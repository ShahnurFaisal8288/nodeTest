const router = require('express').Router();
const { getAllPo,postPo } = require('../controller/polistController');


router
    .route('/bmsm-data-pooling')
    .post(postPo)
    .get(getAllPo)

module.exports = router;
