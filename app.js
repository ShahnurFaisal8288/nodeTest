require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const app = express();

app.use(express.json());
const authRoute = require('./route/authRoute');

//all routes from here
app.use('/api/auth',authRoute);


app.use('*', (req ,res ,next) => {
    res.status(404).json({
        status: 'fail',
        message: 'Route not found',
    })
})

const PORT = process.env.APP_PORT || 8000;

app.listen(PORT, () => {
    console.log('server up and running',PORT);
});