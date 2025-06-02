const router = require("express").Router();
const {
  getTransactionsModifiedLoan,
} = require("../controller/transactionsModifiedLoanController");

// Use POST for JSON input
router.route("/transactionsModifiedLoan").get(getTransactionsModifiedLoan);

module.exports = router;
