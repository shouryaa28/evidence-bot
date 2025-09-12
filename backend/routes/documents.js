const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentService = require('../services/documentService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        // Keep original filename with timestamp
        const timestamp = Date.now();
        const originalName = file.originalname;
        cb(null, `${timestamp}-${originalName}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept CSV and Excel files only
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${fileExt} not supported. Please upload CSV or Excel files only.`), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

/**
 * Upload document
 */
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                acceptedTypes: ['.csv', '.xlsx', '.xls'],
                maxSize: '50MB'
            });
        }

        // Analyze the uploaded document immediately
        const analysis = await documentService.analyzeDocument(req.file.filename);

        res.json({
            message: 'File uploaded and analyzed successfully',
            file: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                type: path.extname(req.file.originalname).toLowerCase()
            },
            analysis: analysis
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to upload and analyze document',
            message: error.message
        });
    }
});

/**
 * Analyze existing document
 */
router.get('/analyze/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        const analysis = await documentService.analyzeDocument(filename);
        res.json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze document',
            message: error.message
        });
    }
});

/**
 * Get list of available files
 */
router.get('/files', async (req, res) => {
    try {
        const files = documentService.getAvailableFiles();
        res.json({
            count: files.length,
            files: files
        });
    } catch (error) {
        console.error('Files list error:', error);
        res.status(500).json({
            error: 'Failed to retrieve file list',
            message: error.message
        });
    }
});

/**
 * Export data to CSV
 */
router.post('/export/csv', async (req, res) => {
    try {
        const { data, filename = 'evidence_export' } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                error: 'Data array is required for export'
            });
        }

        const exportResult = await documentService.exportToCSV(data, filename);

        res.json({
            message: 'Data exported to CSV successfully',
            export: exportResult,
            downloadUrl: `/uploads/${exportResult.filename}`
        });
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).json({
            error: 'Failed to export to CSV',
            message: error.message
        });
    }
});

/**
 * Export data to Excel
 */
router.post('/export/excel', async (req, res) => {
    try {
        const { data, filename = 'evidence_export' } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                error: 'Data array is required for export'
            });
        }

        const exportResult = await documentService.exportToExcel(data, filename);

        res.json({
            message: 'Data exported to Excel successfully',
            export: exportResult,
            downloadUrl: `/uploads/${exportResult.filename}`
        });
    } catch (error) {
        console.error('Excel export error:', error);
        res.status(500).json({
            error: 'Failed to export to Excel',
            message: error.message
        });
    }
});

/**
 * Delete file
 */
router.delete('/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        const result = documentService.deleteFile(filename);
        res.json(result);
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            error: 'Failed to delete file',
            message: error.message
        });
    }
});

/**
 * Download file
 */
router.get('/download/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../uploads', filename);

        res.download(filePath, (error) => {
            if (error) {
                console.error('Download error:', error);
                res.status(404).json({
                    error: 'File not found',
                    filename: filename
                });
            }
        });
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            error: 'Failed to download file',
            message: error.message
        });
    }
});

/**
 * Health check for document service
 */
router.get('/health', (req, res) => {
    try {
        const files = documentService.getAvailableFiles();
        res.json({
            status: 'healthy',
            availableFiles: files.length,
            supportedFormats: ['.csv', '.xlsx', '.xls'],
            maxFileSize: '50MB'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;
