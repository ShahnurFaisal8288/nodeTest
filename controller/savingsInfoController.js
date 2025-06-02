const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

// Controller Class
class SavingsInfoController {
    ChanelLogStart(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    // Equivalent of PHP SyncTime method
    SyncTime(BranchCode, PIN, AppId, status, currentTime, AppVersionCode, AppVersionName) {
        console.log(`[${new Date().toISOString()}] SYNC TIME - Branch: ${BranchCode}, PIN: ${PIN}, AppId: ${AppId}, Status: ${status}, Time: ${currentTime}, VersionCode: ${AppVersionCode}, VersionName: ${AppVersionName}`);
        // Add your database sync logic here if needed
    }

    // Equivalent of PHP HttpErrorCode method
    HttpErrorCode(response, BranchCode, PIN, AppId, AppVersionCode, AppVersionName, url) {
        if (response.status >= 400) {
            console.error(`[${new Date().toISOString()}] HTTP ERROR - Branch: ${BranchCode}, PIN: ${PIN}, AppId: ${AppId}, Status: ${response.status}, URL: ${url}`);
            // Add your error handling logic here
        }
    }

    async getSavingsInfo({
        BranchCode,
        cono,
        projectcode,
        LastSyncTime,
        securitykey,
        PIN,
        EndcurrentTimes,
        baseUrl,
        AppId,
        AppVersionCode,
        AppVersionName
    }) {
        // Log End (equivalent to ChanelLogEnd in PHP)
        this.ChanelLogEnd(BranchCode, PIN, 'VOList OUT');

        // Current time for VOList OUT sync
        const currentTimesVoListOut = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const statusOut = `Branch VOList OUT-${cono}`;
        this.SyncTime(BranchCode, PIN, AppId, statusOut, currentTimesVoListOut, AppVersionCode, AppVersionName);

        // Current time for SavingsInfo IN sync
        const currentTimesVoListIn = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const statusIn = `Branch SavingsInfo IN-${cono}`;
        this.SyncTime(BranchCode, PIN, AppId, statusIn, currentTimesVoListIn, AppVersionCode, AppVersionName);

        // Build URL
        let url = `${baseUrl}SavingsInfo?BranchCode=${BranchCode}&CONo=${cono}&ProjectCode=${projectcode}&Status=2&UpdatedAt=${LastSyncTime}&key=${securitykey}&caller=${PIN}&EndDateTime=${EndcurrentTimes}`;
        url = url.replace(/ /g, '%20');

        this.ChanelLogStart(BranchCode, PIN, url);

        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            // Check for HTTP errors
            this.HttpErrorCode(response, BranchCode, PIN, AppId, AppVersionCode, AppVersionName, url);

            const jsondecode = response.data;
            let arymrg2 = [];

            if (jsondecode != null) {
                const datacheck = jsondecode.data;
                const msg = jsondecode.message;

                if (msg !== "No data found") {
                    arymrg2.push(datacheck);
                }
            }

            return {
                data: arymrg2
            };

        } catch (error) {
            console.error(`Error in getSavingsInfo for CONo ${cono}:`, error.message);
            return null;
        }
    }
}

// Main GET handler
const getSavingsInfo = catchAsync(async (req, res, next) => {
    console.log('=== SavingsInfo API Called ===');
    console.log('Request body:', req.body);
    console.log('Request query:', req.query);

    // Try to read from body first (for JSON), then fallback to query
    const bodyData = req.body || {};
    const queryData = req.query || {};
    
    // Merge both sources, body takes precedence
    const params = { ...queryData, ...bodyData };
    
    const {
        BranchCode,
        CONo,
        ProjectCode,
        UpdatedAt,
        caller,
        EndDateTime,
        baseUrl,
        securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae'
    } = params;

    const AppId = req.headers['appid'];
    const AppVersionCode = req.headers['appversioncode'];
    const AppVersionName = req.headers['appversionname'];

    console.log('Parameters received:', {
        BranchCode, CONo, ProjectCode, UpdatedAt,
        caller, EndDateTime, baseUrl
    });

    // Parameter validation
    const missingParams = [];
    if (!BranchCode) missingParams.push('BranchCode');
    if (!CONo) missingParams.push('CONo');
    if (!ProjectCode) missingParams.push('ProjectCode');
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

    const controller = new SavingsInfoController();

    const result = await controller.getSavingsInfo({
        BranchCode,
        cono: CONo,
        projectcode: ProjectCode,
        LastSyncTime: UpdatedAt,
        securitykey,
        PIN: caller,
        EndcurrentTimes: EndDateTime,
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
    getSavingsInfo
};
