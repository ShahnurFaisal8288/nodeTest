require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const app = express();

app.use(express.json());
const authRoute = require('./route/authRoute');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

//all routes from here
app.use('/api/auth',authRoute);

//global error handle start
app.use(
    '*', catchAsync(async (req, res, next) => {
    throw new AppError('Route not found', 404);  // Better to throw a custom error
 })
);
app.use(globalErrorHandler);
//global error handle end

const PORT = process.env.APP_PORT || 8000;

app.listen(PORT, () => {
    console.log('server up and running',PORT);
});