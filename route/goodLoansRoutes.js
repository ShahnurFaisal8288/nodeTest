const router = require("express").Router();
const {
  getGoodLoans,
} = require("../controller/goodLoansController");

// Use POST for JSON input
router.route("/GoodLoans").get(getGoodLoans);

module.exports = router;


