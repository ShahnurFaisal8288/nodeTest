const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const user = require("../db/models/user");
const project = require("../db/models/project");

//create
const createProject = catchAsync(async (req, res, next) => {
    const body = req.body;
    const userId = req.user.id;
    const newProject = await project.create({
        title: body.title,
        productImage: body.productImage,
        price: body.price,
        shortDescription: body.shortDescription,
        description: body.description,
        productUrl: body.productUrl,
        category: body.category,
        tags: body.tags,
        createdBy: userId,
    });

    return res.status(201).json({
        status: 'success',
        data: newProject,
    });
});

//getAll
const getProject = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const projects = await project.findAll({include:user,where:{createdBy:userId}});
    return res.status(200).json({
        status: 'success',
        data: projects,
    });
});
//getSingle
const getProjectById = catchAsync(async(req, res, next) => {
    const projectId = req.params.id;
    const singleProject = await project.findByPk(projectId);
    
    if (project) {
        return res.status(200).json({
            status: 'success',
            data: singleProject,
        });
    }else{
        return next(new AppError('Incorrect project ID', 401));
    }
});
//update
const updateProject = catchAsync(async(req, res, next) => {
    const projectIds = req.params.id;
    const body = req.body;

    const result = await project.findByPk(projectIds);

    if(!result){
        return next(new AppError('Invalid Primary Kew',400));
    }
    result.title = body.title || result.title;
    result.productImage = body.productImage || result.productImage;
    result.price = body.price || result.price;
    result.shortDescription = body.shortDescription || result.shortDescription;
    result.description = body.description || result.description;
    result.productUrl = body.productUrl || result.productUrl;
    result.category = Array.isArray(body.category) ? body.category : result.category;
    result.tags = Array.isArray(body.tags) ? body.tags : result.tags;
    result.createdBy = body.createdBy || result.createdBy; 

    await result.save(); // Save changes to the database

    return res.json({
        status: 'success',
        data:result
    })
})

const deleteProject = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const projectId = req.params.id;
    const body = req.body;
    const result = await project.findOne({where:{id:projectId,createdBy:userId}});
    if(!result){
        return next(new AppError('Invalid Primary Kew',400));
    }
    await result.destroy(); 
    return res.json({
        status: 'deleted',
        data:result
    })
});
module.exports = { createProject,getProject,getProjectById,updateProject,deleteProject };



