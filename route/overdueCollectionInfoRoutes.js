const router = require("express").Router();
const {
  getOverdueCollectionInfo,
} = require("../controller/overdueCollectionInfoController");

// Use POST for JSON input
router.route("/OverdueCollectionInfo").get(getOverdueCollectionInfo);

module.exports = router;


