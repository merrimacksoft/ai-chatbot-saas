const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  }
});

// Upload document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let content = '';
    let fileType = '';

    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      content = pdfData.text;
      fileType = 'pdf';
    } else if (req.file.mimetype === 'text/plain') {
      content = req.file.buffer.toString('utf-8');
      fileType = 'txt';
    }

    if (!content.trim()) {
      return res.status(400).json({ error: 'No text content found in file' });
    }

    // Save to database
    const document = new Document({
      userId: req.userId,
      filename: req.file.originalname,
      originalName: req.file.originalname,
      content,
      fileType,
      fileSize: req.file.size
    });

    await document.save();

    console.log(`📄 Document uploaded: ${document.originalName} by user ${req.userId}`);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        filename: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get user's documents
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .select('-content') // Don't send full content
      .sort({ createdAt: -1 });

    res.json({ documents });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// ⭐ ADD THIS NEW DELETE ROUTE ⭐
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log(`🗑️ Document deleted: ${document.originalName} by user ${req.userId}`);

    res.json({ 
      message: 'Document deleted successfully',
      deletedDocument: {
        id: document._id,
        name: document.originalName
      }
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;