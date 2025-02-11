const { authentication, restrictTo } = require('../controller/authController');
const { createProject, getProject } = require('../controller/projectController');

const router = require('express').Router();
router
    .route('/projects')
    .post(authentication,restrictTo('1'),createProject)
    .get(authentication,getProject);


module.exports = router;