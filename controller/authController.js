const user = require("../db/models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY,{
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const signUp = async (req, res) => {
    const body = req.body;

    if (!['1','2'].includes(body.userType)) {
        return res.status(400).json({
            status: 'failed',
            message: 'Invalid user type. Must be either "1" or "2"'
        });
    }

    const newUser = await user.create({
        userType: body.userType,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: body.password,
        confirmPassword: body.confirmPassword,
    });

    const result = newUser.toJSON();
    delete result.password;
    delete result.deletedAt;

    result.token = generateToken({
        id: result.id,
    });

    if (!result) {
        return res.status(500).json({
            status: 'failed',
            message: 'Failed to create user. Please try again later'
        });
    }

    return res.status(201).json({
        status: 'success',
        message: 'User stored successfully',
        data: result
    });
};

//login
const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password.', 400));
    }

    const result = await user.findOne({ where: { email } });
    if (!result || !(await bcrypt.compare(password, result.password))) {
        return next(new AppError('Incorrect email or password.', 401));
    }

    const token = generateToken({
        id: result.id,
    });

    return res.json({
        status: 'success',
        token,
    });
});

module.exports =  { signUp,login };
