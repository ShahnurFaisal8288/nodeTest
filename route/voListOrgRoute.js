const router = require('express').Router();
const { getVOList } = require('../controller/voListController');

router
    .route('/voList')
    .get(getVOList);

module.exports = router;
