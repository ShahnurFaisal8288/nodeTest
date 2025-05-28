const { authentication } = require('../controller/authController');
const { createContactUs, getAllContact, getSingleContact, updateContact, deleteContact } = require('../controller/contactUsController');

const router = require('express').Router();
router
    .route('/contact')
    .post(authentication,createContactUs)
    .get(getAllContact)

router
    .route('/contact/:id')
    .get(authentication,getSingleContact)
    .patch(authentication,updateContact)
    .delete(authentication,deleteContact);



module.exports = router;