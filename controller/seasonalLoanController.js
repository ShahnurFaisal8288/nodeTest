const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

class SeasonalLoanController {
    ChanelLogStart(BranchCode, PIN, url) {
        console.log(`[START] [${new Date().toISOString()}] Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, PIN, url) {
        console.log(`[END] [${new Date().toISOString()}] Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }

    async getSeasonalLoanInfo({
        BranchCode,
        cono,
        projectcode,
        LastSyncTime,
        securitykey,
        PIN,
        baseUrl,
        AppId,
        AppVersionCode,
        AppVersionName
    }) {
        const currentTimesVoList = new Date().toISOString();
        const status = 'SeasonalLoan IN-' + PIN;
        console.log(`⏳ SyncTime → BranchCode: ${BranchCode}, PIN: ${PIN}, AppId: ${AppId}, Status: ${status}, Time: ${currentTimesVoList}, AppVersion: ${AppVersionCode}-${AppVersionName}`);

        let url = `${baseUrl}SeasonalLoan?key=${securitykey}&BranchCode=${BranchCode}&ProjectCode=${projectcode}&PONo=${cono}&UpdatedAt=${LastSyncTime}&caller=${PIN}`;
        url = url.replace(/ /g, '%20');

        this.ChanelLogStart(BranchCode, PIN, url);

        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 30000
            });

            const seasonaljsondecode = response.data;
            console.log('📦 Raw API Response:', JSON.stringify(seasonaljsondecode, null, 2));

            let seasonalarray = [];

            if (seasonaljsondecode && seasonaljsondecode.data) {
                const data = seasonaljsondecode.data;

                if (Array.isArray(data) && data.length > 0) {
                    seasonalarray = data;
                } else if (typeof data === 'object') {
                    const loanList = data.loanList || data.loans || null;

                    if (Array.isArray(loanList) && loanList.length > 0) {
                        seasonalarray = loanList;
                    } else {
                        seasonalarray.push(data); // Assume single object
                    }
                }
            }

            return seasonalarray;

        } catch (error) {
            console.error(`❌ Error fetching SeasonalLoan for PIN ${PIN}:`, error.message);

            if (error.response) {
                console.error('❗ API responded with status:', error.response.status);
                console.error('❗ API response data:', JSON.stringify(error.response.data, null, 2));
            }

            return null;
        } finally {
            this.ChanelLogEnd(BranchCode, PIN, url);
            const endTime = new Date().toISOString();
            console.log(`✅ SeasonalLoan OUT-${PIN} at ${endTime}`);
        }
    }
}

const getSessionalLoanInfo = catchAsync(async (req, res, next) => {
    console.log('🌐 API Call: SessionalLoanInfo');

    const body = req.body || {};
    const query = req.query || {};
    const params = { ...query, ...body };

    const {
        BranchCode,
        CONo,
        ProjectCode,
        UpdatedAt,
        baseUrl,
        securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae',
        caller
    } = params;

    const AppId = req.headers['appid'];
    const AppVersionCode = req.headers['appversioncode'];
    const AppVersionName = req.headers['appversionname'];

    const missing = [];
    if (!BranchCode) missing.push('BranchCode');
    if (!CONo) missing.push('CONo');
    if (!ProjectCode) missing.push('ProjectCode');
    if (!UpdatedAt) missing.push('UpdatedAt');
    if (!caller) missing.push('caller');
    if (!baseUrl) missing.push('baseUrl');

    if (missing.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required parameters: ${missing.join(', ')}`
        });
    }

    const controller = new SeasonalLoanController();
    const result = await controller.getSeasonalLoanInfo({
        BranchCode,
        cono: CONo,
        projectcode: ProjectCode,
        LastSyncTime: UpdatedAt,
        securitykey,
        PIN: caller,
        baseUrl,
        AppId,
        AppVersionCode,
        AppVersionName
    });

    if (result && result.length > 0) {
        return res.status(200).json({
            status: 'success',
            data: result
        });
    } else {
        return res.status(404).json({
            status: 'error',
            message: 'No data found or API request failed'
        });
    }
});

module.exports = {
    getSessionalLoanInfo
};
