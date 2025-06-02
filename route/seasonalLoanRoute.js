const router = require("express").Router();
const {
  getSessionalLoanInfo,
} = require("../controller/seasonalLoanController");

// Use POST for JSON input
router.route("/SessionalLoanInfo").get(getSessionalLoanInfo,);

module.exports = router;


