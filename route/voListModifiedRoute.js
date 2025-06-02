const router = require('express').Router();
const { getVo } = require('../controller/voListModifiedController');

router
    .route('/VOListModified')
    .get(getVo);

module.exports = router;