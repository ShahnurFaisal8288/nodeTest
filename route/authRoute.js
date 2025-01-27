const { signUp } = require('../controller/authController')

const router = require('express').Router();
router.route('/signUp').post(signUp);

module.exports = router;