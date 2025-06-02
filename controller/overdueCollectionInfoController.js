const axios = require('axios');
const catchAsync = require('../utils/catchAsync');

// Controller Class
class OverdueCollectionInfoController {
    ChanelLogStart(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    async getOverdueCollectionInfo({
        BranchCode,
        cono,
        projectcode,
        CollectionFrom,
        CollectionTo,
        UpdatedAt,
        securitykey,
        PIN,
        EndcurrentTimes,
        baseUrl,
        AppId,
        AppVersionCode,
        AppVersionName
    }) {
        let url = `${baseUrl}OverdueCollectionInfo?BranchCode=${BranchCode}&CONo=${cono}&ProjectCode=${projectcode}&CollectionFrom=${CollectionFrom}&CollectionTo=${CollectionTo}&UpdatedAt=${UpdatedAt}&key=${securitykey}&caller=${PIN}&EndDateTime=${EndcurrentTimes}`;
        url = url.replace(/ /g, '%20');

        this.ChanelLogStart(BranchCode, PIN, url);
        this.ChanelLogEnd(BranchCode, PIN, url);

        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            const jsondecode = response.data;
            let overdueCollectionInfo = [];

            if (jsondecode && jsondecode.data) {
                overdueCollectionInfo.push(jsondecode.data);
            }

            return {
                data: overdueCollectionInfo
            };

        } catch (error) {
            console.error(`Error in getOverdueCollectionInfo for CONo ${cono}:`, error.message);
            return null;
        }
    }
}

// Main GET handler
const getOverdueCollectionInfo = catchAsync(async (req, res, next) => {
    console.log('=== OverdueCollectionInfo API Called ===');

    // Read query parameters and body
    const queryData = req.query || {};
    const bodyData = req.body || {};

    // Merge body and query parameters (body takes precedence)
    const params = { ...queryData, ...bodyData };

    const {
        BranchCode,
        CONo,
        ProjectCode,
        CollectionFrom,
        CollectionTo,
        UpdatedAt,
        caller,
        EndDateTime,
        baseUrl,
        EndcurrentTimes,
        securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae'
    } = params;

    const AppId = req.headers['appid'];
    const AppVersionCode = req.headers['appversioncode'];
    const AppVersionName = req.headers['appversionname'];

    console.log('Parameters received:', {
        BranchCode, CONo, ProjectCode, CollectionFrom, CollectionTo, UpdatedAt,
        caller, EndDateTime, baseUrl
    });

    // Parameter validation
    const missingParams = [];
    if (!BranchCode) missingParams.push('BranchCode');
    if (!CONo) missingParams.push('CONo');
    if (!ProjectCode) missingParams.push('ProjectCode');
    if (!CollectionFrom) missingParams.push('CollectionFrom');
    if (!CollectionTo) missingParams.push('CollectionTo');
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

    const controller = new OverdueCollectionInfoController();

    const result = await controller.getOverdueCollectionInfo({
        BranchCode,
        cono: CONo,
        projectcode: ProjectCode,
        CollectionFrom,
        CollectionTo,
        UpdatedAt,
        securitykey,
        PIN: caller,
        EndcurrentTimes,
        baseUrl,
        AppId,
        AppVersionCode,
        AppVersionName
    });

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
});

module.exports = {
    getOverdueCollectionInfo
};
