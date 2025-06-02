const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

// Controller Class
class TransactionsModifiedLoanController {
    ChanelLogStart(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    async getTransactionsModifiedLoan({
        BranchCode,
        cono,
        projectcode,
        previousTwoYears,
        opendate,
        LastSyncTime,
        securitykey,
        PIN,
        EndcurrentTimes,
        baseUrl,
        AppId,
        AppVersionCode,
        AppVersionName
    }) {
        let url = `${baseUrl}TransactionsModifiedLoan?BranchCode=${BranchCode}&CONo=${cono}&ProjectCode=${projectcode}&StartDate=${previousTwoYears}&EndDate=${opendate}&UpdatedAt=${LastSyncTime}&key=${securitykey}&caller=${PIN}&EndDateTime=${EndcurrentTimes}`;
        url = url.replace(/ /g, '%20');

        this.ChanelLogEnd(BranchCode, PIN, url);
        this.ChanelLogStart(BranchCode, PIN, url);

        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            const jsondecode = response.data;
            let transtrailloansmodified = [];
            let nextUrl = null;
            let lastid = '';

            if (jsondecode != null) {
                const datacheck = jsondecode.data;
                const code = jsondecode.code;
                const msg = jsondecode.message;
                const nextUrlexp = jsondecode.nextUrl;

                if (nextUrlexp != null) {
                    const exp = nextUrlexp.split('/');
                    nextUrl = exp[1];

                    const exp1 = nextUrlexp.split('&');
                    const LastIdvalue = exp1[7];
                    const exp2 = LastIdvalue.split('=');
                    lastid = exp2[1];
                }

                if (msg !== "No data found" && code === '200' && datacheck) {
                    transtrailloansmodified.push(datacheck);
                }
            }

            return {
                data: transtrailloansmodified,
                nextUrl,
                lastid
            };

        } catch (error) {
            console.error(`Error in getTransactionsModifiedLoan for CONo ${cono}:`, error.message);
            return null;
        }
    }
}

// Main GET handler - Reading from req.body for JSON data (non-standard but works)
const getTransactionsModifiedLoan = catchAsync(async (req, res, next) => {
    console.log('=== transactionsModifiedLoan API Called ===');
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
        BusinessDate,
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
        BranchCode, CONo, ProjectCode, BusinessDate, UpdatedAt,
        caller, EndDateTime, baseUrl
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

    const controller = new TransactionsModifiedLoanController();

    const result = await controller.getTransactionsModifiedLoan({
        BranchCode,
        cono: CONo,
        projectcode: ProjectCode,
        previousTwoYears: BusinessDate,
        opendate: BusinessDate,
        LastSyncTime: UpdatedAt,
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
    getTransactionsModifiedLoan
};