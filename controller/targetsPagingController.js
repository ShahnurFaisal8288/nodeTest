const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

class TargetsPagingController {
    ChanelLogStart(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, CONo, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
    }

    SyncTime(BranchCode, PIN, AppId, status, currentTime, AppVersionCode, AppVersionName) {
        console.log(`[${new Date().toISOString()}] SYNC TIME - Branch: ${BranchCode}, PIN: ${PIN}, AppId: ${AppId}, Status: ${status}, Time: ${currentTime}, VersionCode: ${AppVersionCode}, VersionName: ${AppVersionName}`);
    }

    HttpErrorCode(response, BranchCode, PIN, AppId, AppVersionCode, AppVersionName, url) {
        if (response.status >= 400) {
            console.error(`[${new Date().toISOString()}] HTTP ERROR - Branch: ${BranchCode}, PIN: ${PIN}, AppId: ${AppId}, Status: ${response.status}, URL: ${url}`);
        }
    }

    async getTargetsPaging({ BranchCode, cono, projectcode, LastSyncTime, securitykey, PIN, EndcurrentTimes, baseUrl, AppId, AppVersionCode, AppVersionName, targetpreviousmonth, opendate }) {
        this.ChanelLogEnd(BranchCode, PIN, 'TargetsPaging IN');

        const currentTimesVoList = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const status = `Branch TargetsPaging IN-${cono}`;
        this.SyncTime(BranchCode, PIN, AppId, status, currentTimesVoList, AppVersionCode, AppVersionName);

        let url = `${baseUrl}TargetsPaging?BranchCode=${BranchCode}&CONo=${cono}&StartDate=${targetpreviousmonth}&EndDate=${opendate}&ProjectCode=${projectcode}&UpdatedAt=${LastSyncTime}&key=${securitykey}&caller=${PIN}&EndDateTime=${EndcurrentTimes}`;
        url = url.replace(/ /g, '%20');

        this.ChanelLogStart(BranchCode, PIN, url);

        try {
            const response = await axios.get(url, { headers: { Accept: 'application/json' }, timeout: 30000 });
            this.HttpErrorCode(response, BranchCode, PIN, AppId, AppVersionCode, AppVersionName, url);

            const data = response.data;
            const targetarray = [];

            if (data && data.code === '200' && data.message !== 'No data found') {
                targetarray.push(data.data);
            }

            let lastid = null;
            if (data.nextUrl) {
                const params = new URLSearchParams(data.nextUrl.split('?')[1]);
                lastid = params.get('LastId');
            }

            while (lastid) {
                let nextUrl = `${baseUrl}TargetsPaging?BranchCode=${BranchCode}&CONo=${cono}&StartDate=${targetpreviousmonth}&EndDate=${opendate}&ProjectCode=${projectcode}&UpdatedAt=${LastSyncTime}&LastId=${lastid}&key=${securitykey}&caller=${PIN}&EndDateTime=${EndcurrentTimes}`;
                nextUrl = nextUrl.replace(/ /g, '%20');

                const nextResponse = await axios.get(nextUrl, { headers: { Accept: 'application/json' }, timeout: 30000 });
                this.HttpErrorCode(nextResponse, BranchCode, PIN, AppId, AppVersionCode, AppVersionName, nextUrl);

                const nextData = nextResponse.data;

                if (nextData && nextData.code === '200' && nextData.message !== 'No data found') {
                    targetarray.push(nextData.data);
                }

                if (nextData.nextUrl) {
                    const nextParams = new URLSearchParams(nextData.nextUrl.split('?')[1]);
                    lastid = nextParams.get('LastId');
                } else {
                    lastid = null;
                }
            }

            return { data: targetarray };

        } catch (error) {
            console.error(`Error in getTargetsPaging for CONo ${cono}:`, error.message);
            return null;
        }
    }
}

const getTargetsPaging = catchAsync(async (req, res, next) => {
    // Combine query params and body params
    const params = { ...req.query, ...req.body };
    
    console.log('Received params:', params); // Debug log

    // Map the parameters correctly - use the names from your JSON
    const {
        BranchCode, 
        CONo, 
        ProjectCode, 
        UpdatedAt,           // This maps to LastSyncTime
        caller, 
        EndDateTime,         // This maps to EndcurrentTimes
        baseUrl, 
        securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae',
        targetpreviousmonth = params.BusinessDate || '2000-01-01', // Use BusinessDate as fallback
        opendate = params.br_date || '2025-01-01'                 // Use br_date as fallback
    } = params;

    const AppId = req.headers['appid'] || req.headers['AppId'];
    const AppVersionCode = req.headers['appversioncode'] || req.headers['AppVersionCode'];
    const AppVersionName = req.headers['appversionname'] || req.headers['AppVersionName'];

    // Check for missing required parameters
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
            message: `Missing required parameters: ${missingParams.join(', ')}`,
            receivedParams: Object.keys(params) // Show what was received for debugging
        });
    }

    const controller = new TargetsPagingController();

    const result = await controller.getTargetsPaging({
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
        AppVersionName,
        targetpreviousmonth,
        opendate
    });

    if (result) {
        return res.status(200).json({ status: 'success', data: result });
    } else {
        return res.status(404).json({ status: 'error', message: 'No data found or API call failed' });
    }
});

module.exports = {
    getTargetsPaging
};