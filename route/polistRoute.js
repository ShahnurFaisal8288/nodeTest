const { 
    getAllPo, 
    postPo, 

    getVOListData,
    getSavingsListData,
    getClosedLoanData,
    getCOListData,
    debugTableStructure  
} = require('../controller/polistController');

const router = require('express').Router();

// Original combined data pooling endpoint
router
    .route('/bmsm-data-pooling')


router.route('/vo-list-modified')
  .post(getVOListData)
  .get(getVOListData);

router
    .route('/savings-list-data')
    .post(getSavingsListData)
    .get(getSavingsListData);

router
    .route('/closed-loan-data')
    .post(getClosedLoanData)
    .get(getClosedLoanData);

router
    .route('/co-list-data')
    .post(getCOListData)
    .get(getCOListData);


    // Add this debug route
router
    .route('/debug-table')
    .get(debugTableStructure)
    .post(debugTableStructure);
module.exports = router;