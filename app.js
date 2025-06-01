// Load environment variables
require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const app = express();

// Import Routes
const authRoute = require('./route/authRoute');
const projectRoute = require('./route/projectRoute');
const contactUsRoute = require('./route/contactUsRoute');
const polistRoute = require('./route/polistRoute');
// const voListController = require('./controller/voListController');

// Import Error Handling Utilities
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

// Middlewares
app.use(express.json()); // To parse JSON bodies

// Mount Routes
app.use('/api/auth', authRoute);
app.use('/api', projectRoute);
app.use('/api', contactUsRoute);
app.use('/api', polistRoute);

// app.use('/api', voListRoute);



// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = process.env.APP_PORT || 2000;
app.listen(PORT, () => {
    console.log(`✅ Server up and running on port ${PORT}`);
});

module.exports = app;
