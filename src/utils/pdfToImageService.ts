import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";

// Configure worker for pdfjs 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ConvertOptions {
  format?: "jpg" | "png";
  quality?: number; // 0.1 to 1.0 (or 60-100 mapped)
  scale?: number;
  selectedPages?: number[] | null;
  onProgress?: (progress: { current: number; total: number; percent: number }) => void;
  signal?: AbortSignal;
}

export interface ConvertedPageResult {
  pageNumber: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  filename: string;
  sizeBytes: number;
}

export async function convertPdfToImages(
  file: File,
  {
    format = "jpg",
    quality = 0.9,
    scale = 1.5,
    selectedPages = null,
    onProgress = () => {},
    signal
  }: ConvertOptions = {}
): Promise<ConvertedPageResult[]> {
  if (!(file instanceof File)) {
    throw new Error("Please select a valid PDF file.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("The selected file is not a PDF.");
  }

  const buffer = await file.arrayBuffer();

  if (signal?.aborted) {
    throw new DOMException("Conversion cancelled", "AbortError");
  }

  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  const totalPages = pdf.numPages;

  const pages = selectedPages?.length
    ? selectedPages
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const results: ConvertedPageResult[] = [];

  for (let i = 0; i < pages.length; i++) {
    if (signal?.aborted) {
      throw new DOMException("Conversion cancelled", "AbortError");
    }

    const pageNumber = pages[i];
    if (pageNumber < 1 || pageNumber > totalPages) continue;

    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {
      alpha: true
    });

    if (!context) {
      throw new Error("Canvas is not supported by this browser.");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const mimeType = format === "png" ? "image/png" : "image/jpeg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Failed to create image."));
            return;
          }
          resolve(result);
        },
        mimeType,
        format === "jpg" ? quality : undefined
      );
    });

    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'document';
    const filename = `${baseName}-page-${String(pageNumber).padStart(3, "0")}.${format === 'png' ? 'png' : 'jpg'}`;
    const url = URL.createObjectURL(blob);

    results.push({
      pageNumber,
      blob,
      url,
      width: canvas.width,
      height: canvas.height,
      filename,
      sizeBytes: blob.size
    });

    onProgress({
      current: i + 1,
      total: pages.length,
      percent: Math.round(((i + 1) / pages.length) * 100)
    });

    // Release canvas memory
    canvas.width = 1;
    canvas.height = 1;

    page.cleanup?.();
  }

  return results;
}

export async function createZip(results: ConvertedPageResult[]): Promise<Blob> {
  const zip = new JSZip();

  for (const result of results) {
    zip.file(result.filename, result.blob);
  }

  return await zip.generateAsync({
    type: "blob",
    compression: "STORE"
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
