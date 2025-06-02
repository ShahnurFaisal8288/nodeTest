// ===== UPDATED CONTROLLER =====
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
    EndDateTime,
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
    const formattedSyncTime = LastSyncTime.includes(' ') ? LastSyncTime : `${LastSyncTime} 00:00:00`;
    const encodedSyncTime = encodeURIComponent(formattedSyncTime);

    // Format EndDateTime - use provided EndDateTime or current time
    let formattedEndDateTime;
    if (EndDateTime) {
      formattedEndDateTime = EndDateTime.includes(' ') ? EndDateTime : `${EndDateTime} 23:59:59`;
    } else {
      formattedEndDateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    const encodedEndDateTime = encodeURIComponent(formattedEndDateTime);

    console.log(`📅 Formatted dates - UpdatedAt: ${formattedSyncTime}, EndDateTime: ${formattedEndDateTime}`);

    const url = `${baseUrl}GoodLoans?BranchCode=${BranchCode}&Month=${month}&Year=${year}&UpdatedAt=${encodedSyncTime}&key=${securitykey}&caller=${PIN}&EndDateTime=${encodedEndDateTime}`;

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

      console.log(`📊 API Response for PIN ${PIN}:`, JSON.stringify(jsondecode, null, 2));

      // Check if API returned success status
      if (jsondecode && jsondecode.code === 200) {
        if (jsondecode.data && jsondecode.data.length > 0) {
          goodLoansArray = jsondecode.data;
          console.log(`✅ Found ${goodLoansArray.length} good loans for PIN ${PIN}`);
        } else {
          console.log(`ℹ️ No data found for PIN ${PIN}. API Message: ${jsondecode.message || 'No message'}`);
        }
        return goodLoansArray;
      } else {
        console.log(`❌ API returned error: ${jsondecode.message || 'Unknown error'}`);
        return null;
      }

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

  // Support both query parameters (GET) and body parameters (POST)
  const params = req.method === 'GET' ? req.query : req.body;
  const {
    BranchCode,
    month,
    year,
    LastSyncTime,
    UpdatedAt, // Alternative field name from your JSON
    EndDateTime,
    baseUrl,
    securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae',
    caller,
  } = params;

  const AppId = req.headers['appid'];
  const AppVersionCode = req.headers['appversioncode'];
  const AppVersionName = req.headers['appversionname'];

  // Use UpdatedAt as LastSyncTime if LastSyncTime is not provided
  const finalLastSyncTime = LastSyncTime || UpdatedAt;

  const missing = [];
  if (!BranchCode) missing.push('BranchCode');
  if (!month) missing.push('month');
  if (!year) missing.push('year');
  if (!finalLastSyncTime) missing.push('LastSyncTime or UpdatedAt');
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
    LastSyncTime: finalLastSyncTime,
    EndDateTime,
    securitykey,
    PIN: caller,
    baseUrl,
    AppId,
    AppVersionCode,
    AppVersionName
  });

  if (result !== null) {
    if (result.length > 0) {
      return res.status(200).json({
        status: 'success',
        data: result,
        count: result.length
      });
    } else {
      // API call was successful but returned no data
      return res.status(200).json({
        status: 'success',
        message: 'No good loans found for the specified criteria',
        data: [],
        count: 0
      });
    }
  } else {
    // API call failed
    return res.status(500).json({
      status: 'error',
      message: 'API request failed - please check logs for details'
    });
  }
});

module.exports = {
  getGoodLoans
};