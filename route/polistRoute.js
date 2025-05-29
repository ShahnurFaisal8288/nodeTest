
const { getAllPo,postPo } = require('../controller/polistController');

const router = require('express').Router();
router
    .route('/bmsm-data-pooling')
    .post(postPo)
    .get(getAllPo)

module.exports = router;