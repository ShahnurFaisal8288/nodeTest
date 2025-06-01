const router = require('express').Router();
const { getVo } = require('../controller/voController');

router
    .route('/VOListModified')
    .get(getVo);

module.exports = router;