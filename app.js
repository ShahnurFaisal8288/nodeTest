require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const authRoute = require('./route/authRoute');
const projectRoute = require('./route/projectRoute');
const contactUsRoute = require('./route/contactUsRoute');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

const app = express();

app.use(express.json());

// Routes
app.use('/api/auth', authRoute);
app.use('/api', projectRoute);
app.use('/api', contactUsRoute);

// Handle unknown routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));

});

// Global error handler (MUST BE LAST)
app.use(globalErrorHandler);

const PORT = process.env.APP_PORT || 1000;

app.listen(PORT, () => {
    console.log('Server up and running on port', PORT);
});

module.exports = app;
