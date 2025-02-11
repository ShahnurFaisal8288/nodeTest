const catchAsync = require("../utils/catchAsync");
const project = require("../db/models/project");
const AppError = require("../utils/appError");
const user = require("../db/models/user");


const createProject = catchAsync(async (req, res, next) => {
    const body = req.body;
    const newProject = await project.create({
        title: body.title,
        productImage: body.productImage,
        price: body.price,
        shortDescription: body.shortDescription,
        description: body.description,
        productUrl: body.productUrl,
        category: body.category,
        tags: body.tags,
        createdBy: 1,
    });
    if (!newProject) {
        return next(new AppError('Failed to create the Post', 400));
        
    }
    return res.status(201).json({
        status: 'success',
        data: newProject,
    })
});
const getProject= catchAsync(async (req, res, next) => {
    const projects = await project.findAll({include:user});
    return res.status(200).json({
        status: 'success',
        data: projects,
    });
});
module.exports = { createProject,getProject };



