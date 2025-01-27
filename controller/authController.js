const user = require("../db/models/user");

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
    });

    if (!newUser) {
        return res.status(500).json({
            status: 'failed',
            message: 'Failed to create user. Please try again later'
        });
    }

    return res.status(201).json({
        status: 'success',
        message: 'User stored successfully'
    });
};

module.exports =  { signUp };
