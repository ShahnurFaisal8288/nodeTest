const catchAsync = require("../utils/catchAsync");
const polist = require("../db/models/polist");
const axios = require('axios');
const { Op } = require('sequelize');

// Your existing functions
const getAllPo = catchAsync(async (req, res, next) => {
    const projects = await polist.findAll();

    return res.status(200).json({
        status: 'success',
        data: projects,
    });
});

// BMSM Data Pooling Class
class BMSMDataPooling {
    
    // Main Data Pooling Function
    async BMSM_DataPooling(params) {
        const {
            BranchCode, projectcode, LastSyncTime, securitykey, br_date, 
            _url, currentTimes, designation, PIN, AppId, EndcurrentTimes, 
            project, ApiKey, AppVersionName, AppVersionCode
        } = params;

        try {
            console.log('=== Starting BMSM Data Pooling Process ===');
            console.log('Parameters received:', JSON.stringify(params, null, 2));
            
            // Initialize result arrays
            let volistmodified = [];
            let savingsmodified = [];
            let colsedarray = [];
            let polists = [];
            let myArray = {};

            // Set EndTime
            const EndTime = new Date().toISOString().replace('T', '%20').slice(0, -5);

            // Check if AppId is 'bmsmerp'
            if (AppId === 'bmsmerp' || AppId === 'bmfpo') {
                console.log(`=== AppId is ${AppId}, getting personnel list ===`);
                
                // Get personnel list based on designation
                const personnel = await this.getPersonnelList(BranchCode, projectcode, designation, PIN, project);
                
                // Build CO List
                if (!personnel || personnel.length === 0) {
                    console.log('=== No personnel found, setting null values ===');
                    polists.push({
                        CONo: "null",
                        COName: "null",
                        LastSyncTime: "null",
                        ABM: "null",
                        Mobile: "null"
                    });
                    myArray.COList = polists;
                } else {
                    console.log('=== Building CO list from personnel ===');
                    personnel.forEach(row => {
                        if (row.cono !== PIN) {
                            polists.push({
                                CONo: row.cono,
                                COName: row.coname,
                                LastSyncTime: row.lastposynctime,
                                ABM: row.abm,
                                Mobile: row.mobileno
                            });
                        }
                    });
                    myArray.COList = polists;
                }
            }

            // Calculate closed end date
            const newdate = new Date(br_date);
            newdate.setMonth(newdate.getMonth() - 3);
            const ClosedEndtdate = `${newdate.getFullYear()}-${String(newdate.getMonth() + 1).padStart(2, '0')}-01`;
            console.log('=== Closed end date calculated:', ClosedEndtdate, '===');

            // Get personnel for API calls
            const getbm = await this.getPersonnelForApiCalls(BranchCode, projectcode, designation, PIN, project);

            // Process API calls if personnel exists and not initial sync
            if (getbm && getbm.length > 0 && LastSyncTime !== "2000-01-01%2012:00:00") {
                console.log('=== Processing API calls for', getbm.length, 'personnel ===');
                
                for (const row of getbm) {
                    const cono = row.cono;
                    console.log(`=== Processing CO: ${cono} ===`);
                    
                    // Call all APIs for this CO (parallel execution)
                    const [voData, memberData, closedData] = await Promise.all([
                        this.getVOListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url),
                        this.getMemberListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url),
                        this.getClosedLoanModified(BranchCode, projectcode, cono, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url)
                    ]);

                    // Collect results
                    if (voData) volistmodified.push(voData);
                    if (memberData) savingsmodified.push(memberData);
                    if (closedData) colsedarray.push(closedData);
                }
            } else {
                console.log('=== Skipping API calls - Initial sync or no personnel ===');
            }

            // Return final result
            console.log('=== Returning final result ===');
            return {
                success: true,
                data: {
                    COList: myArray.COList || [],
                    volistmodified,
                    savingsmodified,
                    colsedarray,
                    EndTime,
                    ClosedEndtdate
                }
            };

        } catch (error) {
            console.error('Error in BMSM_DataPooling:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

// Fixed Personnel Methods - Replace in your BMSMDataPooling class
 
async getPersonnelList(BranchCode, projectcode, designation, PIN, project) {
    try {
        console.log('Getting personnel list with params:', { BranchCode, projectcode, designation, PIN, project });
        
        const whereCondition = {
            branchcode: BranchCode,
            projectcode: projectcode
        };
 
        // Add designation filter if provided - using 'desig' instead of 'designation'
        if (designation && designation !== 'all') {
            whereCondition.desig = designation;  // ✅ Changed from 'designation' to 'desig'
        }
 
        console.log('Query conditions:', whereCondition);
 
        const personnel = await polist.findAll({
            where: whereCondition,
            attributes: [
                'cono',
                'coname', 
                'lastposynctime',
                'abm',
                'mobileno'
            ],
            raw: true
        });
 
        console.log(`Found ${personnel.length} personnel records`);
        console.log('Sample personnel data:', personnel.slice(0, 2)); // Log first 2 records
        
        return personnel;
        
    } catch (error) {
        console.error('Error getting personnel list:', error);
        return [];
    }
}
 
async getPersonnelForApiCalls(BranchCode, projectcode, designation, PIN, project) {
    try {
        console.log('Getting personnel for API calls...');
        
        const whereCondition = {
            branchcode: BranchCode,
            projectcode: projectcode
        };
 
        // Add designation filter if provided - using 'desig' instead of 'designation'
        if (designation && designation !== 'all') {
            whereCondition.desig = designation;  // ✅ Changed from 'designation' to 'desig'
        }
 
        console.log('API calls query conditions:', whereCondition);
 
        const personnel = await polist.findAll({
            where: whereCondition,
            attributes: ['cono'], // Only need cono for API calls
            raw: true
        });
 
        console.log(`Found ${personnel.length} personnel for API calls`);
        return personnel;
        
    } catch (error) {
        console.error('Error getting personnel for API calls:', error);
        return [];
    }
}
 
// Alternative method to filter by multiple designation values if needed
async getPersonnelListByDesignations(BranchCode, projectcode, designations, PIN, project) {
    try {
        console.log('Getting personnel list by multiple designations:', designations);
        
        const whereCondition = {
            branchcode: BranchCode,
            projectcode: projectcode
        };
 
        // Add designation filter for multiple values
        if (designations && designations.length > 0) {
            whereCondition.desig = {
                [Op.in]: designations  // Use Op.in for multiple values
            };
        }
 
        console.log('Multiple designations query conditions:', whereCondition);
 
        const personnel = await polist.findAll({
            where: whereCondition,
            attributes: [
                'cono',
                'coname', 
                'lastposynctime',
                'abm',
                'mobileno',
                'desig'  // Include desig to see what designations exist
            ],
            raw: true
        });
 
        console.log(`Found ${personnel.length} personnel records`);
        return personnel;
        
    } catch (error) {
        console.error('Error getting personnel list by designations:', error);
        return [];
    }
}

// Alternative method to check table structure
async checkTableStructure() {
    try {
        console.log('=== Checking polist table structure ===');
        
        // Get a sample record to see available columns
        const sampleRecord = await polist.findOne({
            raw: true,
            limit: 1
        });
        
        if (sampleRecord) {
            console.log('Available columns in polist table:');
            Object.keys(sampleRecord).forEach(column => {
                console.log(`  - ${column}: ${typeof sampleRecord[column]} (${sampleRecord[column]})`);
            });
        } else {
            console.log('No records found in polist table');
        }
        
        // Also check total count
        const totalCount = await polist.count();
        console.log(`Total records in polist: ${totalCount}`);
        
        return sampleRecord;
    } catch (error) {
        console.error('Error checking table structure:', error);
        return null;
    }
}










// FIXED API METHODS - Replace these in your BMSMDataPooling class

async getVOListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
    try {
        console.log(`Making VO List API call for CO: ${cono}`);
        console.log(`Making VO List API call for url: ${_url}`);
        
        // Log the API call start with the actual URL that will be called
        this.ChanelLogStart(BranchCode, PIN, _url);
        
        // Prepare API parameters
        const apiParams = {
            BranchCode: BranchCode,
            cono: cono,
            projectcode: projectcode,
            br_date: br_date,
            LastSyncTime: LastSyncTime,
            securitykey: securitykey,
            PIN: PIN,
            EndcurrentTimes: EndcurrentTimes,
            url: _url // Include the URL in the parameters for logging
        };
        
        console.log(`VO API Params for ${cono}:`, apiParams);
        
        // Make the API call - USE THE _url DIRECTLY, don't append anything
        const response = await axios.post(_url, apiParams, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Log the API call end
        this.ChanelLogEnd(BranchCode, PIN, _url);
        console.log(`url  test: ${_url}`);
        
        console.log(`VO API Response for ${cono}:`, {
            status: response.status,
            dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data'
        });
        
        // Return the response data
        return {
            cono: cono,
            url: _url,
            data: response.data,
            status: response.status,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error getting VO list for CO ${cono}:`, {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        
        // Log the API call end even on error
        this.ChanelLogEnd(BranchCode, PIN, _url);
        
        // Return error info instead of null so you can track failures
        return {
            cono: cono,
            error: true,
            url: _url,
            message: error.message,
            status: error.response?.status || 'network_error',
            timestamp: new Date().toISOString()
        };
    }
}

async getMemberListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
    try {
        console.log(`Making Member List API call for CO: ${cono}`);
        
        // Log the API call start
        this.ChanelLogStart(BranchCode, PIN, _url);
        
        // Prepare API parameters
        const apiParams = {
            BranchCode: BranchCode,
            cono: cono,
            projectcode: projectcode,
            br_date: br_date,
            LastSyncTime: LastSyncTime,
            securitykey: securitykey,
            PIN: PIN,
            EndcurrentTimes: EndcurrentTimes
        };
        
        console.log(`Member API Params for ${cono}:`, apiParams);
        
        // Make the API call - USE THE _url DIRECTLY
        const response = await axios.post(_url, apiParams, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Log the API call end
        this.ChanelLogEnd(BranchCode, PIN, _url);
        
        console.log(`Member API Response for ${cono}:`, {
            status: response.status,
            dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data'
        });
        
        // Return the response data
        return {
            cono: cono,
            data: response.data,
            status: response.status,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error getting Member list for CO ${cono}:`, {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        
        // Log the API call end even on error
        this.ChanelLogEnd(BranchCode, PIN, _url);
        
        // Return error info instead of null
        return {
            cono: cono,
            error: true,
            message: error.message,
            status: error.response?.status || 'network_error',
            timestamp: new Date().toISOString()
        };
    }
}

async getClosedLoanModified(BranchCode, projectcode, cono, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
    try {
        console.log(`Making Closed Loan API call for CO: ${cono}`);
        
        // Log the API call start
        this.ChanelLogStart(BranchCode, PIN, _url);
        
        // Prepare API parameters
        const apiParams = {
            BranchCode: BranchCode,
            projectcode: projectcode,
            cono: cono,
            LastSyncTime: LastSyncTime,
            securitykey: securitykey,
            PIN: PIN,
            EndcurrentTimes: EndcurrentTimes
        };
        
        console.log(`Closed Loan API Params for ${cono}:`, apiParams);
        
        // Make the API call - USE THE _url DIRECTLY
        const response = await axios.post(_url, apiParams, {
            timeout: 30000, // 30 second timeout
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // Log the API call end
        this.ChanelLogEnd(BranchCode, PIN, _url);
        
        console.log(`Closed Loan API Response for ${cono}:`, {
            status: response.status,
            dataLength: response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data'
        });
        
        // Return the response data
        return {
            cono: cono,
            data: response.data,
            status: response.status,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`Error getting Closed Loan data for CO ${cono}:`, {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        
        // Log the API call end even on error
        this.ChanelLogEnd(BranchCode, PIN, _url);
        
        // Return error info instead of null
        return {
            cono: cono,
            error: true,
            message: error.message,
            status: error.response?.status || 'network_error',
            timestamp: new Date().toISOString()
        };
    }
}







 

// Enhanced logging methods with better formatting
ChanelLogStart(BranchCode, PIN, url) {
    const timestamp = new Date().toISOString();
    console.log(`\n=== API CALL START [${timestamp}] ===`);
    console.log(`Branch: ${BranchCode} | PIN: ${PIN}`);
    console.log(`URL: ${url}`);
    console.log('=====================================\n');
}
 
ChanelLogEnd(BranchCode, PIN, url) {
    const timestamp = new Date().toISOString();
    console.log(`\n=== API CALL END [${timestamp}] ===`);
    console.log(`Branch: ${BranchCode} | PIN: ${PIN}`);
    console.log(`URL: ${url}`);
    console.log('===================================\n');
}

    // async getVOListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
    //     // Implementation needed - placeholder for now
    //     try {
    //         // Add your API call here
    //         console.log('Getting VO list modified data...');
    //         return null; // Return actual VO data
    //     } catch (error) {
    //         console.error('Error getting VO list:', error);
    //         return null;
    //     }
    // }

    // async getMemberListModified(BranchCode, cono, projectcode, br_date, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
    //     // Implementation needed - placeholder for now
    //     try {
    //         // Add your API call here
    //         console.log('Getting member list modified data...');
    //         return null; // Return actual member data
    //     } catch (error) {
    //         console.error('Error getting member list:', error);
    //         return null;
    //     }
    // }

    // async getClosedLoanModified(BranchCode, projectcode, cono, LastSyncTime, securitykey, PIN, EndcurrentTimes, _url) {
    //     // Implementation needed - placeholder for now
    //     try {
    //         // Add your API call here
    //         console.log('Getting closed loan modified data...');
    //         return null; // Return actual closed loan data
    //     } catch (error) {
    //         console.error('Error getting closed loan data:', error);
    //         return null;
    //     }
    // }

    // Logging functions
    ChanelLogStart(BranchCode, PIN, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, PIN, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }















}

// Initialize BMSM Data Pooling instance (only once)
const bmsmDataPooling = new BMSMDataPooling();

// 1. GET VO LIST MODIFIED DATA - Returns volistmodified array
const getVOListData = catchAsync(async (req, res, next) => {
    console.log('=== VOListData API Called ===');

    const ApiKey = req.headers.apikey || req.headers.ApiKey || req.query.ApiKey || req.body.ApiKey;
    const AppVersionName = req.headers.appversionname || req.headers.AppVersionName || req.query.AppVersionName || req.body.AppVersionName;
    const AppVersionCode = req.headers.appversioncode || req.headers.AppVersionCode || req.query.AppVersionCode || req.body.AppVersionCode;
    const AppId = req.headers.appid || req.headers.AppId || req.query.AppId || req.body.AppId;

    const params = {
        BranchCode: req.query.BranchCode || req.body.BranchCode,
        projectcode: req.query.projectcode || req.body.projectcode,
        LastSyncTime: req.query.LastSyncTime || req.body.LastSyncTime,
        securitykey: req.query.securitykey || req.body.securitykey,
        br_date: req.query.br_date || req.body.br_date,
        _url: req.query._url || req.body._url,
        currentTimes: req.query.currentTimes || req.body.currentTimes,
        designation: req.query.designation || req.body.designation,
        PIN: req.query.PIN || req.body.PIN,
        AppId: AppId,
        EndcurrentTimes: req.query.EndcurrentTimes || req.body.EndcurrentTimes,
        project: req.query.project || req.body.project,
        ApiKey: ApiKey,
        AppVersionName: AppVersionName,
        AppVersionCode: AppVersionCode,
    };

    // Validate required parameters
    const required = ['BranchCode', 'projectcode', 'LastSyncTime', 'securitykey', 'br_date', '_url', 'designation', 'PIN', 'EndcurrentTimes', 'project'];
    const missing = required.filter(param => !params[param]);
    
    if (missing.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required parameters: ${missing.join(', ')}`
        });
    }

    try {
        let volistmodified = [];
        
        // Get personnel for API calls
        const getbm = await bmsmDataPooling.getPersonnelForApiCalls(
            params.BranchCode, 
            params.projectcode, 
            params.designation, 
            params.PIN, 
            params.project
        );

        // Process API calls for VO data
        if (getbm && getbm.length > 0) {
            console.log('=== Processing VOList API calls for', getbm.length, 'personnel ===');
            
            for (const row of getbm) {
                const cono = row.cono;
                console.log(`=== Processing VO data for CO: ${cono} ===`);
                
                const voData = await bmsmDataPooling.getVOListModified(
                    params.BranchCode, 
                    cono, 
                    params.projectcode, 
                    params.br_date, 
                    params.LastSyncTime, 
                    params.securitykey, 
                    params.PIN, 
                    params.EndcurrentTimes, 
                    params._url
                );

                if (voData) {
                    volistmodified.push(voData);
                }
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                volistmodified,
                totalRecords: volistmodified.length,
                personnelCount: getbm ? getbm.length : 0
            }
        });

    } catch (error) {
        console.error('Error in getVOListData:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 2. GET MEMBER/SAVINGS LIST MODIFIED DATA - Returns savingsmodified array
const getSavingsListData = catchAsync(async (req, res, next) => {
    console.log('=== SavingsListData API Called ===');

    const ApiKey = req.headers.apikey || req.headers.ApiKey || req.query.ApiKey || req.body.ApiKey;
    const AppVersionName = req.headers.appversionname || req.headers.AppVersionName || req.query.AppVersionName || req.body.AppVersionName;
    const AppVersionCode = req.headers.appversioncode || req.headers.AppVersionCode || req.query.AppVersionCode || req.body.AppVersionCode;
    const AppId = req.headers.appid || req.headers.AppId || req.query.AppId || req.body.AppId;

    const params = {
        BranchCode: req.query.BranchCode || req.body.BranchCode,
        projectcode: req.query.projectcode || req.body.projectcode,
        LastSyncTime: req.query.LastSyncTime || req.body.LastSyncTime,
        securitykey: req.query.securitykey || req.body.securitykey,
        br_date: req.query.br_date || req.body.br_date,
        _url: req.query._url || req.body._url,
        currentTimes: req.query.currentTimes || req.body.currentTimes,
        designation: req.query.designation || req.body.designation,
        PIN: req.query.PIN || req.body.PIN,
        AppId: AppId,
        EndcurrentTimes: req.query.EndcurrentTimes || req.body.EndcurrentTimes,
        project: req.query.project || req.body.project,
        ApiKey: ApiKey,
        AppVersionName: AppVersionName,
        AppVersionCode: AppVersionCode,
    };

    // Validate required parameters
    const required = ['BranchCode', 'projectcode', 'LastSyncTime', 'securitykey', 'br_date', '_url', 'designation', 'PIN', 'EndcurrentTimes', 'project'];
    const missing = required.filter(param => !params[param]);
    
    if (missing.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required parameters: ${missing.join(', ')}`
        });
    }

    try {
        let savingsmodified = [];
        
        // Get personnel for API calls
        const getbm = await bmsmDataPooling.getPersonnelForApiCalls(
            params.BranchCode, 
            params.projectcode, 
            params.designation, 
            params.PIN, 
            params.project
        );

        // Process API calls for Member/Savings data
        if (getbm && getbm.length > 0) {
            console.log('=== Processing MemberList API calls for', getbm.length, 'personnel ===');
            
            for (const row of getbm) {
                const cono = row.cono;
                console.log(`=== Processing Member data for CO: ${cono} ===`);
                
                const memberData = await bmsmDataPooling.getMemberListModified(
                    params.BranchCode, 
                    cono, 
                    params.projectcode, 
                    params.br_date, 
                    params.LastSyncTime, 
                    params.securitykey, 
                    params.PIN, 
                    params.EndcurrentTimes, 
                    params._url
                );

                if (memberData) {
                    savingsmodified.push(memberData);
                }
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                savingsmodified,
                totalRecords: savingsmodified.length,
                personnelCount: getbm ? getbm.length : 0
            }
        });

    } catch (error) {
        console.error('Error in getSavingsListData:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 3. GET CLOSED LOAN MODIFIED DATA - Returns colsedarray
const getClosedLoanData = catchAsync(async (req, res, next) => {
    console.log('=== ClosedLoanData API Called ===');

    const ApiKey = req.headers.apikey || req.headers.ApiKey || req.query.ApiKey || req.body.ApiKey;
    const AppVersionName = req.headers.appversionname || req.headers.AppVersionName || req.query.AppVersionName || req.body.AppVersionName;
    const AppVersionCode = req.headers.appversioncode || req.headers.AppVersionCode || req.query.AppVersionCode || req.body.AppVersionCode;
    const AppId = req.headers.appid || req.headers.AppId || req.query.AppId || req.body.AppId;

    const params = {
        BranchCode: req.query.BranchCode || req.body.BranchCode,
        projectcode: req.query.projectcode || req.body.projectcode,
        LastSyncTime: req.query.LastSyncTime || req.body.LastSyncTime,
        securitykey: req.query.securitykey || req.body.securitykey,
        br_date: req.query.br_date || req.body.br_date,
        _url: req.query._url || req.body._url,
        currentTimes: req.query.currentTimes || req.body.currentTimes,
        designation: req.query.designation || req.body.designation,
        PIN: req.query.PIN || req.body.PIN,
        AppId: AppId,
        EndcurrentTimes: req.query.EndcurrentTimes || req.body.EndcurrentTimes,
        project: req.query.project || req.body.project,
        ApiKey: ApiKey,
        AppVersionName: AppVersionName,
        AppVersionCode: AppVersionCode,
    };

    // Validate required parameters
    const required = ['BranchCode', 'projectcode', 'LastSyncTime', 'securitykey', 'br_date', '_url', 'designation', 'PIN', 'EndcurrentTimes', 'project'];
    const missing = required.filter(param => !params[param]);
    
    if (missing.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required parameters: ${missing.join(', ')}`
        });
    }

    try {
        let colsedarray = [];
        
        // Get personnel for API calls
        const getbm = await bmsmDataPooling.getPersonnelForApiCalls(
            params.BranchCode, 
            params.projectcode, 
            params.designation, 
            params.PIN, 
            params.project
        );

        // Process API calls for Closed Loan data
        if (getbm && getbm.length > 0) {
            console.log('=== Processing ClosedLoan API calls for', getbm.length, 'personnel ===');
            
            for (const row of getbm) {
                const cono = row.cono;
                console.log(`=== Processing Closed Loan data for CO: ${cono} ===`);
                
                const closedData = await bmsmDataPooling.getClosedLoanModified(
                    params.BranchCode, 
                    params.projectcode, 
                    cono, 
                    params.LastSyncTime, 
                    params.securitykey, 
                    params.PIN, 
                    params.EndcurrentTimes, 
                    params._url
                );

                if (closedData) {
                    colsedarray.push(closedData);
                }
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                colsedarray,
                totalRecords: colsedarray.length,
                personnelCount: getbm ? getbm.length : 0
            }
        });

    } catch (error) {
        console.error('Error in getClosedLoanData:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 4. GET CO LIST ONLY - Returns just the COList
const getCOListData = catchAsync(async (req, res, next) => {
    console.log('=== COListData API Called ===');

    const ApiKey = req.headers.apikey || req.headers.ApiKey || req.query.ApiKey || req.body.ApiKey;
    const AppVersionName = req.headers.appversionname || req.headers.AppVersionName || req.query.AppVersionName || req.body.AppVersionName;
    const AppVersionCode = req.headers.appversioncode || req.headers.AppVersionCode || req.query.AppVersionCode || req.body.AppVersionCode;
    const AppId = req.headers.appid || req.headers.AppId || req.query.AppId || req.body.AppId;

    const params = {
        BranchCode: req.query.BranchCode || req.body.BranchCode,
        projectcode: req.query.projectcode || req.body.projectcode,
        designation: req.query.designation || req.body.designation,
        PIN: req.query.PIN || req.body.PIN,
        AppId: AppId,
        project: req.query.project || req.body.project,
        ApiKey: ApiKey,
        AppVersionName: AppVersionName,
        AppVersionCode: AppVersionCode,
    };

    // Validate required parameters
    const required = ['BranchCode', 'projectcode', 'designation', 'PIN', 'project'];
    const missing = required.filter(param => !params[param]);
    
    if (missing.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: `Missing required parameters: ${missing.join(', ')}`
        });
    }

    try {
        let polists = [];
        let COList = [];

        // Check if AppId is 'bmsmerp' or 'bmfpo'
        if (params.AppId === 'bmsmerp' || params.AppId === 'bmfpo') {
            console.log(`=== AppId is ${params.AppId}, getting personnel list ===`);
            
            // Get personnel list based on designation
            const personnel = await bmsmDataPooling.getPersonnelList(
                params.BranchCode, 
                params.projectcode, 
                params.designation, 
                params.PIN, 
                params.project
            );
            
            // Build CO List
            if (!personnel || personnel.length === 0) {
                console.log('=== No personnel found, setting null values ===');
                polists.push({
                    CONo: "null",
                    COName: "null",
                    LastSyncTime: "null",
                    ABM: "null",
                    Mobile: "null"
                });
            } else {
                console.log('=== Building CO list from personnel ===');
                personnel.forEach(row => {
                    if (row.cono !== params.PIN) {
                        polists.push({
                            CONo: row.cono,
                            COName: row.coname,
                            LastSyncTime: row.lastposynctime,
                            ABM: row.abm,
                            Mobile: row.mobileno
                        });
                    }
                });
            }
            COList = polists;
        }

        res.status(200).json({
            status: 'success',
            data: {
                COList,
                totalCOs: COList.length
            }
        });

    } catch (error) {
        console.error('Error in getCOListData:', error);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// MAIN FUNCTION - This calls the BMSMDataPooling class (removed duplicate)
const postPo = catchAsync(async (req, res, next) => {
    console.log('=== BMSM Data Pooling API Called ===');

    const ApiKey = req.headers.apikey || req.headers.ApiKey || req.query.ApiKey || req.body.ApiKey;
    const AppVersionName = req.headers.appversionname || req.headers.AppVersionName || req.query.AppVersionName || req.body.AppVersionName;
    const AppVersionCode = req.headers.appversioncode || req.headers.AppVersionCode || req.query.AppVersionCode || req.body.AppVersionCode;
    const AppId = req.headers.appid || req.headers.AppId || req.query.AppId || req.body.AppId;

    console.log('Headers received:');
    console.log('- ApiKey:', ApiKey);
    console.log('- AppVersionName:', AppVersionName);
    console.log('- AppVersionCode:', AppVersionCode);
    console.log('- AppId:', AppId);

    console.log('Body received:', JSON.stringify(req.body, null, 2));

    const params = {
        BranchCode: req.query.BranchCode || req.body.BranchCode,
        projectcode: req.query.projectcode || req.body.projectcode,
        LastSyncTime: req.query.LastSyncTime || req.body.LastSyncTime,
        securitykey: req.query.securitykey || req.body.securitykey,
        br_date: req.query.br_date || req.body.br_date,
        _url: req.query._url || req.body._url,
        currentTimes: req.query.currentTimes || req.body.currentTimes,
        designation: req.query.designation || req.body.designation,
        PIN: req.query.PIN || req.body.PIN,
        AppId: AppId,
        EndcurrentTimes: req.query.EndcurrentTimes || req.body.EndcurrentTimes,
        project: req.query.project || req.body.project,
        ApiKey: ApiKey,
        AppVersionName: AppVersionName,
        AppVersionCode: AppVersionCode,
    };

    const result = await bmsmDataPooling.BMSM_DataPooling(params);

    if (result.success) {
        res.status(200).json({ status: 'success', data: result.data });
    } else {
        res.status(500).json({ status: 'error', message: result.error });
    }
});


const debugTableStructure = catchAsync(async (req, res, next) => {
    console.log('=== Debug Table Structure API Called ===');
    
    try {
        // Get sample records to see structure
        const sampleRecords = await polist.findAll({
            limit: 5,
            raw: true
        });
        
        const totalCount = await polist.count();
        
        const structure = {
            totalRecords: totalCount,
            availableColumns: sampleRecords.length > 0 ? Object.keys(sampleRecords[0]) : [],
            sampleData: sampleRecords
        };
        
        // Also check for records matching your criteria
        const filteredRecords = await polist.findAll({
            where: {
                branchcode: req.query.BranchCode || req.body.BranchCode || '1831',
                projectcode: req.query.projectcode || req.body.projectcode || '015'
            },
            limit: 10,
            raw: true
        });
        
        res.status(200).json({
            status: 'success',
            data: {
                tableStructure: structure,
                filteredRecords: {
                    count: filteredRecords.length,
                    data: filteredRecords
                }
            }
        });
        
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: error.stack
        });
    }
});


// Export all functions
module.exports = { 
    getAllPo, 
    postPo,
    getVOListData,          // Returns volistmodified array
    getSavingsListData,     // Returns savingsmodified array
    getClosedLoanData,      // Returns colsedarray
    getCOListData,
    debugTableStructure  
    
    
};