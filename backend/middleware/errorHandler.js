const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = { message, statusCode: 400 };
    }

    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            const message = 'File too large. Maximum size is 50MB';
            error = { message, statusCode: 400 };
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            const message = 'Too many files. Maximum is 1 file';
            error = { message, statusCode: 400 };
        } else {
            const message = 'File upload error';
            error = { message, statusCode: 400 };
        }
    }

    if (err.message && err.message.includes('rate limit')) {
        const message = 'API rate limit exceeded. Please try again later';
        error = { message, statusCode: 429 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
