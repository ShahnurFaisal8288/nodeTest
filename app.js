require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const authRoute = require('./route/authRoute');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');


const app = express();

app.use(express.json());
//all routes from here
app.use('/api/auth',authRoute);

//global error handle start
app.use(
    '*', 
    catchAsync(async (req, res, next) => {
    throw new AppError(`Can't find ${req.originalUrl} on this server`, 404);  // Better to throw a custom error
 })
);
app.use(globalErrorHandler);
//global error handle end

const PORT = process.env.APP_PORT || 1000;

app.listen(PORT, () => {
    console.log('server up and running',PORT);
});