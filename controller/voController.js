const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

// VO Controller Class
class VOController {
    
    // Logging functions
    ChanelLogStart(BranchCode, PIN, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, PIN, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }

    // API Function - VO List Modified
    async getVOListModified(BranchCode, PIN, ProjectCode, BusinessDate, UpdatedAt, key, caller, EndDateTime, baseUrl) {
        try {
            console.log(`=== Calling VOListModified API for PIN: ${PIN} ===`);
            
            let url = `${baseUrl}VOListModified?BranchCode=${BranchCode}&PIN=${PIN}&ProjectCode=${ProjectCode}&BusinessDate=${BusinessDate}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
            url = url.replace(/ /g, '%20');
            
            console.log('VOListModified URL:', url);
            console.log('Request headers:', { 'Accept': 'application/json' });
            
            this.ChanelLogStart(BranchCode, caller, url);
            
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            });

            this.ChanelLogEnd(BranchCode, caller, url);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Response data structure:', {
                hasData: !!response.data,
                dataKeys: response.data ? Object.keys(response.data) : [],
                dataType: typeof response.data,
                fullResponse: response.data
            });

            if (response.data && response.data.data) {
                console.log(`VOListModified success for PIN ${PIN}`);
                return response.data.data;
            } else if (response.data) {
                console.log(`VOListModified returned data but no .data property for PIN ${PIN}`);
                return response.data; // Return the whole response if no .data property
            }
            
            console.log(`VOListModified returned no data for PIN ${PIN}`);
            return null;

        } catch (error) {
            console.error(`Error in getVOListModified for PIN ${PIN}:`, error.message);
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                responseData: error.response?.data,
                code: error.code
            });
            return null;
        }
    }
}

// Initialize VO Controller instance
const voController = new VOController();

// Main GET function for VOListModified endpoint
const getVo = catchAsync(async (req, res, next) => {
    console.log('=== VOListModified API Called ===');
    
    // Extract parameters from query or body
    const BranchCode = req.query.BranchCode || req.body.BranchCode;
    const PIN = req.query.PIN || req.body.PIN;
    const ProjectCode = req.query.ProjectCode || req.body.ProjectCode;
    const BusinessDate = req.query.BusinessDate || req.body.BusinessDate;
    const UpdatedAt = req.query.UpdatedAt || req.body.UpdatedAt;
    const key = req.query.key || req.body.key || '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';
    const caller = req.query.caller || req.body.caller;
    const EndDateTime = req.query.EndDateTime || req.body.EndDateTime;
    const baseUrl = req.query.baseUrl || req.body.baseUrl;

    console.log('Parameters received:', {
        BranchCode, PIN, ProjectCode, BusinessDate, UpdatedAt, key, caller, EndDateTime, baseUrl
    });

    // Parameter validation
    const missingParams = [];
    if (!BranchCode) missingParams.push('BranchCode');
    if (!PIN) missingParams.push('PIN');
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
        const result = await voController.getVOListModified(
            BranchCode, PIN, ProjectCode, BusinessDate, UpdatedAt, 
            key, caller, EndDateTime, baseUrl
        );

        // Enhanced debugging response
        return res.status(200).json({
            status: result ? 'success' : 'no_data',
            data: result || null,
            debug: {
                apiCalled: true,
                resultReceived: !!result,
                parameters: {
                    BranchCode, PIN, ProjectCode, BusinessDate, 
                    UpdatedAt, key, caller, EndDateTime, baseUrl
                },
                constructedUrl: `${baseUrl}VOListModified?BranchCode=${BranchCode}&PIN=${PIN}&ProjectCode=${ProjectCode}&BusinessDate=${BusinessDate}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`.replace(/ /g, '%20')
            }
        });

    } catch (error) {
        console.error('Error in getVo controller:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            error: error.message,
            debug: {
                parameters: {
                    BranchCode, PIN, ProjectCode, BusinessDate, 
                    UpdatedAt, key, caller, EndDateTime, baseUrl
                }
            }
        });
    }
});

module.exports = {
    getVo
};