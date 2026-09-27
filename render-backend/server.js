/**
 * Ghostscript PDF Compression Backend for Render.com
 */
const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: '/tmp/uploads/' });

app.get('/', (req, res) => {
  res.json({ status: 'Ghostscript PDF Compressor is running', service: 'Render Backend' });
});

app.post('/api/compress-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join('/tmp', `compressed_${Date.now()}.pdf`);
  const quality = req.body.quality || 'ebook'; // screen, ebook, printer, prepress

  // Ghostscript command for PDF compression
  // -dPDFSETTINGS=/screen (72 dpi), /ebook (150 dpi), /printer (300 dpi)
  const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

  exec(gsCommand, (error, stdout, stderr) => {
    // Cleanup input file immediately
    try { fs.unlinkSync(inputPath); } catch (e) {}

    if (error) {
      console.error('Ghostscript error:', error);
      try { fs.unlinkSync(outputPath); } catch (e) {}
      return res.status(500).json({ error: 'PDF compression failed via Ghostscript', details: error.message });
    }

    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: 'Compressed output file not generated' });
    }

    res.download(outputPath, 'compressed.pdf', (err) => {
      try { fs.unlinkSync(outputPath); } catch (e) {}
      if (err) {
        console.error('Download error:', err);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ghostscript PDF compressor running on port ${PORT}`);
});
