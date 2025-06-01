const router = require('express').Router();
const { getClosedLoanModified } = require('../controller/closedLoanModifiedController');

router
    .route('/ClosedLoanModified')
    .get(getClosedLoanModified);

module.exports = router;