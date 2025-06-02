const express = require('express');
const router = express.Router();
const { getTransactionsModifiedSavings } = require('../controller/transactionsModifiedSavingsController');

router
    .route('/TransactionsModifiedSavings')
    .get(getTransactionsModifiedSavings);

module.exports = router;