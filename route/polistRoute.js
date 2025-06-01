// Add these routes to your router file or create a separate mock routes file

const router = require('express').Router();
const { getAllPo, postPo } = require('../controller/polistController');
const { getVo } = require('../controller/voController');
const { getMemberList } = require('../controller/memberListController');
const { getClosedLoanModified } = require('../controller/closedLoanModifiedController');

// Your existing route
router
    .route('/bmsm-data-pooling')
    .post(postPo)
    .get(getAllPo);


module.exports = router;