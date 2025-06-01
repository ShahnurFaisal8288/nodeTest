const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

// Member List Controller Class
class MemberListController {
    
    // Logging functions
    ChanelLogStart(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    // API Function - Member List Modified
    async getMemberListModified(BranchCode, CONo, ProjectCode, BusinessDate, UpdatedAt, key, caller, EndDateTime, baseUrl) {
        try {
            console.log(`=== Calling MemberListModified API for CONo: ${CONo} ===`);
            
            let url = `${baseUrl}MemberListModified?BranchCode=${BranchCode}&CONo=${CONo}&ProjectCode=${ProjectCode}&BusinessDate=${BusinessDate}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
            url = url.replace(/ /g, '%20');
            
            console.log('MemberListModified URL:', url);
            
            this.ChanelLogStart(BranchCode, caller, url);
            
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            });

            this.ChanelLogEnd(BranchCode, caller, url);

            if (response.data && response.data.data) {
                console.log(`MemberListModified success for CONo ${CONo}`);
                return response.data.data;
            }
            return null;

        } catch (error) {
            console.error(`Error in getMemberListModified for CONo ${CONo}:`, error.message);
            return null;
        }
    }
}

// Initialize Member List Controller instance
const memberListController = new MemberListController();

// Main GET function for MemberListModified endpoint
const getMemberList = catchAsync(async (req, res, next) => {
    console.log('=== MemberListModified API Called ===');
    
    // Extract parameters from query or body
    const BranchCode = req.query.BranchCode || req.body.BranchCode;
    const CONo = req.query.CONo || req.body.CONo;
    const ProjectCode = req.query.ProjectCode || req.body.ProjectCode;
    const BusinessDate = req.query.BusinessDate || req.body.BusinessDate;
    const UpdatedAt = req.query.UpdatedAt || req.body.UpdatedAt;
    const key = req.query.key || req.body.key || '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';
    const caller = req.query.caller || req.body.caller;
    const EndDateTime = req.query.EndDateTime || req.body.EndDateTime;
    const baseUrl = req.query.baseUrl || req.body.baseUrl;

    console.log('Parameters received:', {
        BranchCode, CONo, ProjectCode, BusinessDate, UpdatedAt, key, caller, EndDateTime, baseUrl
    });

    // Parameter validation
    const missingParams = [];
    if (!BranchCode) missingParams.push('BranchCode');
    if (!CONo) missingParams.push('CONo');
    if (!ProjectCode) missingParams.push('ProjectCode');
    if (!BusinessDate) missingParams.push('BusinessDate');
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
        const result = await memberListController.getMemberListModified(
            BranchCode, CONo, ProjectCode, BusinessDate, UpdatedAt, 
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
        console.error('Error in getMemberList controller:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = {
    getMemberList
};