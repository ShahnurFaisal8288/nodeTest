const { authentication, restrictTo } = require('../controller/authController');
const { createProject, getProject, getProjectById, updateProject, deleteProject } = require('../controller/projectController');
const { patch } = require('./authRoute');

const router = require('express').Router();
router
    .route('/projects')
    .post(authentication,restrictTo('1'),createProject)
    .get(authentication,getProject);
router
    .route('/project/:id')
    .get(authentication,getProjectById)
    .patch(authentication,updateProject)
    .delete(authentication,deleteProject);


module.exports = router;