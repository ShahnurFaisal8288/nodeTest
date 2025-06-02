const router = require("express").Router();
const {
  getTransactionsModifiedTermSaving,
} = require("../controller/TransactionsModifiedTermSavingController");

// Use POST for JSON input
router.route("/transactionsModifiedTermSavings").get(getTransactionsModifiedTermSaving);

module.exports = router;
