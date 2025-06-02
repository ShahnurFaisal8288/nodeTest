const catchAsync = require("../utils/catchAsync"); 
const axios = require('axios'); 

class ActiveSpecialSavingsProductController { 
  ChanelLogStart(branchCode, conNo, url) { 
    console.log(`[${new Date().toISOString()}] LOG START - Branch: ${branchCode}, CONo: ${conNo}, URL: ${url}`); 
  } 

  ChanelLogEnd(branchCode, conNo, url) { 
    console.log(`[${new Date().toISOString()}] LOG END - Branch: ${branchCode}, CONo: ${conNo}, URL: ${url}`); 
  } 

  async getActiveSpecialProduct({ 
    BranchCode, 
    ProjectCode, 
    LastSyncTime, 
    securitykey, 
    baseUrl, 
    caller, 
    AppId, 
    AppVersionCode, 
    AppVersionName 
  }) { 
    const currentTimes = new Date().toISOString().replace('T', ' ').substring(0, 19); 
    const status = 'ActiveSpecialSavingsProducts IN-' + caller; 

    console.log(`🔄 Sync Start → BranchCode: ${BranchCode}, PIN: ${caller}, Status: ${status}, Time: ${currentTimes}`); 

    let url = `${baseUrl}ActiveSpecialSavingsProducts?BranchCode=${BranchCode}&ProjectCode=${ProjectCode}&UpdatedAt=${LastSyncTime}&key=${securitykey}&caller=${caller}&EndDateTime=${LastSyncTime}`; 
    url = url.replace(/ /g, '%20'); 

    this.ChanelLogStart(BranchCode, caller, url); 

    try { 
      const response = await axios.get(url, { 
        headers: { 
          'Accept': 'application/json' 
        }, 
        timeout: 30000 
      }); 

      const json = response.data; 
      let result = []; 

      if (json && json.data && json.data.length > 0) { 
        result = json.data; 
      } 

      return result; 

    } catch (error) { 
      console.error(`❌ Error fetching data for ${caller}:`, error.message); 
      return null; 
    } finally { 
      this.ChanelLogEnd(BranchCode, caller, url); 
      const endTime = new Date().toISOString(); 
      console.log(`✅ ActiveSpecialSavingsProducts OUT-${caller} at ${endTime}`); 
    } 
  } 
} 

const getActiveSpecialProduct = catchAsync(async (req, res, next) => { 
  // Support both query parameters (GET) and body parameters (POST)
  const params = req.method === 'GET' ? req.query : req.body;
  const { 
    BranchCode, 
    ProjectCode, 
    LastSyncTime, 
    baseUrl, 
    securitykey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae', 
    caller 
  } = params;

  const AppId = req.headers['appid']; 
  const AppVersionCode = req.headers['appversioncode']; 
  const AppVersionName = req.headers['appversionname']; 

  const missing = []; 
  if (!BranchCode) missing.push('BranchCode'); 
  if (!ProjectCode) missing.push('ProjectCode'); 
  if (!LastSyncTime) missing.push('LastSyncTime'); 
  if (!baseUrl) missing.push('baseUrl'); 
  if (!caller) missing.push('caller'); 

  if (missing.length > 0) { 
    return res.status(400).json({ 
      status: 'error', 
      message: `Missing required parameters: ${missing.join(', ')}` 
    }); 
  } 

  const controller = new ActiveSpecialSavingsProductController(); 
  const result = await controller.getActiveSpecialProduct({ 
    BranchCode, 
    ProjectCode, 
    LastSyncTime, 
    baseUrl, 
    securitykey, 
    caller, 
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
  getActiveSpecialProduct 
};