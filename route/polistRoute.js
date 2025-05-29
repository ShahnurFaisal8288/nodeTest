// Add these routes to your router file or create a separate mock routes file

const router = require('express').Router();
const { getAllPo, postPo } = require('../controller/polistController');

// Your existing route
router
    .route('/bmsm-data-pooling')
    .post(postPo)
    .get(getAllPo);

// Mock API endpoints that your code is trying to call
router.get('/VOListModified', (req, res) => {
    console.log('🔄 Mock VOListModified called with params:', req.query);
    
    // Return mock data structure
    res.json({
        status: 'success',
        data: [
            {
                id: 1,
                voName: 'Mock VO 1',
                members: 25,
                lastModified: new Date().toISOString()
            },
            {
                id: 2,
                voName: 'Mock VO 2', 
                members: 30,
                lastModified: new Date().toISOString()
            }
        ]
    });
});

router.get('/MemberListModified', (req, res) => {
    console.log('🔄 Mock MemberListModified called with params:', req.query);
    
    // Return mock data structure
    res.json({
        status: 'success',
        data: [
            {
                memberId: 'M001',
                memberName: 'Mock Member 1',
                savings: 5000,
                lastModified: new Date().toISOString()
            },
            {
                memberId: 'M002',
                memberName: 'Mock Member 2',
                savings: 7500,
                lastModified: new Date().toISOString()
            }
        ]
    });
});

router.get('/ClosedLoanModified', (req, res) => {
    console.log('🔄 Mock ClosedLoanModified called with params:', req.query);
    
    // Return mock data structure
    res.json({
        status: 'success',
        data: [
            {
                loanId: 'L001',
                amount: 50000,
                closedDate: '2024-05-01',
                lastModified: new Date().toISOString()
            },
            {
                loanId: 'L002',
                amount: 75000,
                closedDate: '2024-05-15',
                lastModified: new Date().toISOString()
            }
        ]
    });
});

module.exports = router;