const catchAsync = require("../utils/catchAsync");
const axios = require('axios');

class goodLoansController {
  ChanelLogStart(BranchCode, CONo, url) {
    console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
  }

  ChanelLogEnd(BranchCode, CONo, url) {
    console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, CONo: ${CONo}, URL: ${url}`);
  }

  async getGoodLoans({
    BranchCode,
    month,
    year,
    LastSyncTime,
    securitykey,
    PIN,
    baseUrl,
    AppId,
    AppVersionCode,
    AppVersionName
  }) {
    const currentTimesVoList = new Date().toISOString();
    const status = 'GoodLoans IN-' + PIN;
    console.log(`⏳ SyncTime → BranchCode: ${BranchCode}, PIN: ${PIN}, AppId: ${AppId}, Status: ${status}, Time: ${currentTimesVoList}, AppVersion: ${AppVersionCode}-${AppVersionName}`);

    // Format LastSyncTime as required: yyyy-MM-dd HH:mm:ss
    const formattedSyncTime = `${LastSyncTime} 00:00:00`;
    const encodedSyncTime = encodeURIComponent(formattedSyncTime);

    const url = `${baseUrl}GoodLoans?BranchCode=${BranchCode}&Month=${month}&Year=${year}&UpdatedAt=${encodedSyncTime}&key=${securitykey}&caller=${PIN}&EndDateTime=${encodedSyncTime}`;

    this.ChanelLogStart(BranchCode, PIN, url);

    try {
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      const jsondecode = response.data;
      let goodLoansArray = [];

      if (jsondecode && jsondecode.data && jsondecode.data.length > 0) {
        goodLoansArray = jsondecode.data;
      }

      return goodLoansArray;

    } catch (error) {
      console.error(`❌ Error fetching GoodLoans for PIN ${PIN}:`, error.message);
      return null;
    } finally {
      this.ChanelLogEnd(BranchCode, PIN, url);
      const endTime = new Date().toISOString();
      console.log(`✅ GoodLoans OUT-${PIN} at ${endTime}`);
    }
  }
}

const getGoodLoans = catchAsync(async (req, res, next) => {
  console.log('🌐 API Call: GoodLoans');

  const {
    BranchCode,
    month,
    year,
    LastSyncTime,
    baseUrl,
    securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae',
    caller,
  } = req.query;

  const AppId = req.headers['appid'];
  const AppVersionCode = req.headers['appversioncode'];
  const AppVersionName = req.headers['appversionname'];

  const missing = [];
  if (!BranchCode) missing.push('BranchCode');
  if (!month) missing.push('month');
  if (!year) missing.push('year');
  if (!LastSyncTime) missing.push('LastSyncTime');
  if (!caller) missing.push('caller');
  if (!baseUrl) missing.push('baseUrl');

  if (missing.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: `Missing required parameters: ${missing.join(', ')}`
    });
  }

  const controller = new goodLoansController();
  const result = await controller.getGoodLoans({
    BranchCode,
    month,
    year,
    LastSyncTime,
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
  getGoodLoans
};
