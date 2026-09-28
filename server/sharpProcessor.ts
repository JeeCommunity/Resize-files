import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export function registerSharpRoutes(app: express.Express) {
  app.post('/api/sharp-process', upload.single('file'), async (req, res) => {
    let inputPath = req.file?.path;
    const outputPath = path.join(os.tmpdir(), `sharp_out_${Date.now()}.${req.body.format || 'jpg'}`);

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const operation = req.body.operation || 'resize';
      const format = (req.body.format || 'jpeg').toLowerCase();
      const quality = parseInt(req.body.quality || '85', 10);
      const width = req.body.width ? parseInt(req.body.width, 10) : undefined;
      const height = req.body.height ? parseInt(req.body.height, 10) : undefined;
      const targetSizeKB = req.body.targetSizeKB ? parseInt(req.body.targetSizeKB, 10) : undefined;
      const fit = req.body.fit || 'inside';

      // Filters
      const grayscale = req.body.grayscale === 'true';
      const brightness = req.body.brightness ? parseFloat(req.body.brightness) : 1;
      const contrast = req.body.contrast ? parseFloat(req.body.contrast) : 1;
      const blur = req.body.blur ? parseFloat(req.body.blur) : 0;
      const sharpen = req.body.sharpen === 'true';
      const sepia = req.body.sepia === 'true';

      let pipeline = sharp(inputPath).rotate(); // EXIF auto-rotate
      const metadata = await pipeline.metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image metadata');
      }
      if (metadata.width > 10000 || metadata.height > 10000) {
        throw new Error('Image dimensions exceed maximum allowed limit (10000x10000)');
      }

      // Filters
      if (grayscale) pipeline = pipeline.grayscale();
      if (sepia) pipeline = pipeline.tint({ r: 112, g: 66, b: 20 });
      if (blur > 0) pipeline = pipeline.blur(blur);
      if (sharpen) pipeline = pipeline.sharpen();

      // TARGET SIZE COMPRESSION WITH BINARY SEARCH & DIMENSION SCALING
      if (operation === 'compress' || operation === 'target_size') {
        if (targetSizeKB) {
          const targetBytes = targetSizeKB * 1024;
          let bestBuffer: Buffer | null = null;
          let bestSize = Infinity;
          let currentWidth = metadata.width;
          let currentHeight = metadata.height;
          
          // Outer loop for resizing dimensions if quality alone cannot satisfy target size
          for (let scaleAttempt = 0; scaleAttempt < 3; scaleAttempt++) {
            let low = 10;
            let high = 95;
            let foundValidInScale = false;

            // Binary search for quality
            while (low <= high) {
              const midQuality = Math.floor((low + high) / 2);
              let working = sharp(inputPath).rotate();

              if (scaleAttempt > 0) {
                const scaleFactor = Math.pow(0.8, scaleAttempt);
                currentWidth = Math.max(100, Math.round(metadata.width * scaleFactor));
                working = working.resize({ width: currentWidth, withoutEnlargement: true });
              } else if (width) {
                working = working.resize({ width, withoutEnlargement: true });
              }

              let encoded: Buffer;
              if (format === 'png') {
                // For PNG, adjust palette or compression level
                const pLevel = Math.min(9, Math.max(3, Math.floor((100 - midQuality) / 10) + 3));
                encoded = await working.png({ compressionLevel: pLevel, palette: midQuality < 70, quality: midQuality }).toBuffer();
              } else if (format === 'webp') {
                encoded = await working.webp({ quality: midQuality }).toBuffer();
              } else {
                encoded = await working.jpeg({ quality: midQuality, mozjpeg: true }).toBuffer();
              }

              if (encoded.length <= targetBytes) {
                // Fits under target! Try to get closer to target bytes from below (maximize quality)
                if (encoded.length > bestSize || !bestBuffer) {
                  bestBuffer = encoded;
                  bestSize = encoded.length;
                }
                foundValidInScale = true;
                low = midQuality + 1; // Try higher quality
              } else {
                // Too large
                if (encoded.length < bestSize) {
                  // Keep lowest over-target as backup if no under-target found yet
                  bestBuffer = encoded;
                  bestSize = encoded.length;
                }
                high = midQuality - 1; // Try lower quality
              }
            }

            if (foundValidInScale && bestSize <= targetBytes) {
              break; // Found optimal quality at this scale
            }
          }

          if (!bestBuffer) {
            // Absolute fallback
            bestBuffer = await sharp(inputPath).resize({ width: Math.min(metadata.width, 400), withoutEnlargement: true }).jpeg({ quality: 20 }).toBuffer();
          }

          fs.writeFileSync(outputPath, bestBuffer);
          const stats = fs.statSync(outputPath);

          res.setHeader('Content-Type', `image/${format === 'jpg' ? 'jpeg' : format}`);
          res.setHeader('X-File-Size', stats.size.toString());
          res.setHeader('X-File-Width', currentWidth.toString());
          res.setHeader('X-File-Height', currentHeight.toString());

          const readStream = fs.createReadStream(outputPath);
          readStream.pipe(res);
          readStream.on('close', () => {
            try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
            try { if (outputPath) fs.unlinkSync(outputPath); } catch {}
          });
          return;
        }
      }

      // Standard operations (Resize / Convert)
      if (operation === 'resize' || operation === 'photo_resizer' || operation === 'signature_resizer' || operation === 'passport_resizer') {
        if (width || height) {
          pipeline = pipeline.resize({
            width: width,
            height: height,
            fit: fit as any,
            withoutEnlargement: false,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          });
        }
      }

      let outputBuffer: Buffer;
      const targetFormat = (format === 'jpg' || format === 'jpeg') ? 'jpeg' : format;

      if (targetFormat === 'png') {
        outputBuffer = await pipeline.png({ quality, compressionLevel: 8 }).toBuffer();
      } else if (targetFormat === 'webp') {
        outputBuffer = await pipeline.webp({ quality }).toBuffer();
      } else {
        outputBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      }

      fs.writeFileSync(outputPath, outputBuffer);
      const stats = fs.statSync(outputPath);

      res.setHeader('Content-Type', `image/${targetFormat === 'jpeg' ? 'jpeg' : targetFormat}`);
      res.setHeader('X-File-Size', stats.size.toString());
      res.setHeader('X-File-Width', metadata.width.toString());
      res.setHeader('X-File-Height', metadata.height.toString());

      const readStream = fs.createReadStream(outputPath);
      readStream.pipe(res);
      readStream.on('close', () => {
        try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
        try { if (outputPath) fs.unlinkSync(outputPath); } catch {}
      });

    } catch (err: any) {
      console.error('Sharp processing error:', err);
      try { if (inputPath) fs.unlinkSync(inputPath); } catch {}
      try { if (outputPath) fs.unlinkSync(outputPath); } catch {}
      res.status(500).json({ error: err.message || 'Image processing failed' });
    }
  });
}
