const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

// Closed Loan Controller Class
class ClosedLoanController {
    
    // Logging functions
    ChanelLogStart(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    // API Function - Closed Loan Modified
    async getClosedLoanModified(BranchCode, ProjectCode, CONo, UpdatedAt, key, caller, EndDateTime, baseUrl) {
        try {
            console.log(`=== Calling ClosedLoanModified API for CONo: ${CONo} ===`);
            
            let url = `${baseUrl}ClosedLoanModified?BranchCode=${BranchCode}&ProjectCode=${ProjectCode}&CONo=${CONo}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
            url = url.replace(/ /g, '%20');
            
            console.log('ClosedLoanModified URL:', url);
            
            this.ChanelLogStart(BranchCode, caller, url);
            
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            });

            this.ChanelLogEnd(BranchCode, caller, url);

            if (response.data && response.data.data) {
                console.log(`ClosedLoanModified success for CONo ${CONo}`);
                return response.data.data;
            }
            return null;

        } catch (error) {
            console.error(`Error in getClosedLoanModified for CONo ${CONo}:`, error.message);
            return null;
        }
    }
}

// Initialize Closed Loan Controller instance
const closedLoanController = new ClosedLoanController();

// Main GET function for ClosedLoanModified endpoint
const getClosedLoanModified = catchAsync(async (req, res, next) => {
    console.log('=== ClosedLoanModified API Called ===');
    
    // Extract parameters from query or body
    const BranchCode = req.query.BranchCode || req.body.BranchCode;
    const ProjectCode = req.query.ProjectCode || req.body.ProjectCode;
    const CONo = req.query.CONo || req.body.CONo;
    const UpdatedAt = req.query.UpdatedAt || req.body.UpdatedAt;
    const key = req.query.key || req.body.key || '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';
    const caller = req.query.caller || req.body.caller;
    const EndDateTime = req.query.EndDateTime || req.body.EndDateTime;
    const baseUrl = req.query.baseUrl || req.body.baseUrl;

    console.log('Parameters received:', {
        BranchCode, ProjectCode, CONo, UpdatedAt, key, caller, EndDateTime, baseUrl
    });

    // Parameter validation
    const missingParams = [];
    if (!BranchCode) missingParams.push('BranchCode');
    if (!ProjectCode) missingParams.push('ProjectCode');
    if (!CONo) missingParams.push('CONo');
    if (!UpdatedAt) missingParams.push('UpdatedAt');
    if (!caller) missingParams.push('caller');
    if (!EndDateTime) missingParams.push('EndDateTime');
    if (!baseUrl) missingParams.push('baseUrl');
    
    if (missingParams.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required parameters: ${missingParams.join(', ')}`
        });
    }

    console.log('✅ Parameter validation passed');

    try {
        const result = await closedLoanController.getClosedLoanModified(
            BranchCode, ProjectCode, CONo, UpdatedAt, 
            key, caller, EndDateTime, baseUrl
        );

        if (result) {
            return res.status(200).json({
                status: 'success',
                data: result
            });
        } else {
            return res.status(404).json({
                status: 'error',
                message: 'No data found or API call failed'
            });
        }

    } catch (error) {
        console.error('Error in getClosedLoanModified controller:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = {
    getClosedLoanModified
};