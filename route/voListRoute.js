const express = require('express');
const router = express.Router();
const voListController = require('../controller/voListController');

router.post('/vo-list', voListController.handleVoList);

module.exports = router;
