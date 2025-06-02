const router = require('express').Router();
const { getMemberList } = require('../controller/memberListController');

router
    .route('/MemberListModified')
    .get(getMemberList);

module.exports = router;