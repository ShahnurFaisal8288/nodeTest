const router = require("express").Router();
const {
  getGoodLoans,
} = require("../controller/goodLoansController");

// Support both GET and POST requests
router.route("/GoodLoans")
  .get(getGoodLoans)
  .post(getGoodLoans);

module.exports = router;