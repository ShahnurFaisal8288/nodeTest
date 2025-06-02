const router = require("express").Router();
const {
  getCollectionInfo,
} = require("../controller/collectionInfoController");

// Use POST for JSON input
router.route("/CollectionInfo").get(getCollectionInfo);

module.exports = router;
