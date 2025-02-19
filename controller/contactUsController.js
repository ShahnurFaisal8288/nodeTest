
const ContactUs = require("../db/models/contactus");
const contactUs = require("../db/models/contactus");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
//create Contact
const createContactUs = catchAsync(async(req, res, next) => {
    const body = req.body;
    const newContact =await contactUs.create({
        title:  body.title,  
        subject:  body.subject,  
        details:  body.details,  
    });
    if(! newContact){
        return next(new AppError('Failed to Create ContactUs'))
    }
    return res.status(201).json({
        status:'success',
        data: newContact,
    });
});

//Get All Contact
const getAllContact = catchAsync(async(req, res, next) => {
    const allContact = await ContactUs.findAll();
    return  res.status(200).json({
        status: 'success',
        data: allContact
    });
});

//getSingleContact
const getSingleContact = catchAsync(async(req, res, next) => {
    const {id} = req.params;
    const singleContact = await ContactUs.findByPk(id);

    return res.status(200).json({
        status: 'success',
        data: singleContact
    });
});

//updateContact
const updateContact = catchAsync(async(req,res,next) => {
    const {id} =req.params;
    const body = req.body;
    const result = await ContactUs.findByPk(id);
        result.title =  body.title;
        result.subject =  body.subject;  
        result.details =  body.details;  

        await result.save();
        return res.status(200).json({
            status: 'Updated Successfully',
            data:result
        });
});


//delete
const deleteContact = catchAsync(async(req,res,next) => {
    const { id } = req.params;
    const result = await ContactUs.findOne({where:{id:id}});
    await result.destroy();
    return res.status(200).json({
        status: 'successfully deleted',
    });

});

module.exports = { createContactUs,getAllContact,getSingleContact,updateContact,deleteContact };