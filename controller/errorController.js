const AppError = require("../utils/appError");

const sendErrorDev = (error, res) => {
    console.log('Error:', error); // Add this for debugging
    res.status(error.statusCode || 500).json({
        error: {
            statusCode: error.statusCode,
            status: error.status,
            message: error.message,
            stack: error.stack
        }
    });
};

const sendErrorProd = (error, res) => {
    // If operational, trusted error: send message to client
    if (error.isOperational) {
        res.status(error.statusCode || 500).json({
            status: error.status || 'error',
            message: error.message
        });
    } 
    // Programming or other unknown error: don't leak error details
    else {
        // Log error for debugging
        console.error('ERROR 💥', error);
        
        // Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Check if we're in development mode
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (isDevMode) {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};

module.exports = globalErrorHandler;