const router = require("express").Router();
const {
  getSavingsInfo,
} = require("../controller/savingsInfoController");

// Use POST for JSON input
router.route("/SavingsInfo").get(getSavingsInfo);

module.exports = router;
