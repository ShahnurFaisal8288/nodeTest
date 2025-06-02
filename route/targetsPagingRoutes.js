const router = require("express").Router();
const {
  getTargetsPaging,
} = require("../controller/targetsPagingController");

// Change GET to POST since you're sending JSON data in body
router.route("/targetsPaging").post(getTargetsPaging);

module.exports = router;