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

    // API Function 1 - VO List Modified
    async getVOListModified(BranchCode, PIN, ProjectCode, BusinessDate, UpdatedAt, key, caller, EndDateTime, baseUrl) {
        try {
            console.log(`=== Calling VOListModified API for PIN: ${PIN} ===`);
            
            let url = `${baseUrl}VOListModified?BranchCode=${BranchCode}&PIN=${PIN}&ProjectCode=${ProjectCode}&BusinessDate=${BusinessDate}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
            url = url.replace(/ /g, '%20');
            
            console.log('VOListModified URL:', url);
            
            this.ChanelLogStart(BranchCode, caller, url);
            
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            });

            this.ChanelLogEnd(BranchCode, caller, url);

            if (response.data && response.data.data) {
                console.log(`VOListModified success for PIN ${PIN}`);
                return response.data.data;
            }
            return null;

        } catch (error) {
            console.error(`Error in getVOListModified for PIN ${PIN}:`, error.message);
            return null;
        }
    }

    // API Function 2 - Member List Modified
    async getMemberListModified(BranchCode, CONo, ProjectCode, BusinessDate, UpdatedAt, key, caller, EndDateTime, baseUrl) {
        try {
            console.log(`=== Calling MemberListModified API for CONo: ${CONo} ===`);
            
            let url = `${baseUrl}MemberListModified?BranchCode=${BranchCode}&CONo=${CONo}&ProjectCode=${ProjectCode}&BusinessDate=${BusinessDate}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
            url = url.replace(/ /g, '%20');
            
            console.log('MemberListModified URL:', url);
            
            this.ChanelLogStart(BranchCode, caller, url);
            
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            });

            this.ChanelLogEnd(BranchCode, caller, url);

            if (response.data && response.data.data) {
                console.log(`MemberListModified success for CONo ${CONo}`);
                return response.data.data;
            }
            return null;

        } catch (error) {
            console.error(`Error in getMemberListModified for CONo ${CONo}:`, error.message);
            return null;
        }
    }

    // API Function 3 - Closed Loan Modified
    async getClosedLoanModified(BranchCode, ProjectCode, CONo, UpdatedAt, key, caller, EndDateTime, baseUrl) {
        try {
            console.log(`=== Calling ClosedLoanModified API for CONo: ${CONo} ===`);
            
            let url = `${baseUrl}ClosedLoanModified?BranchCode=${BranchCode}&ProjectCode=${ProjectCode}&CONo=${CONo}&UpdatedAt=${UpdatedAt}&key=${key}&caller=${caller}&EndDateTime=${EndDateTime}`;
            url = url.replace(/ /g, '%20');
            
            console.log('ClosedLoanModified URL:', url);
            
            this.ChanelLogStart(BranchCode, caller, url);
            
            const response = await axios.get(url, {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            });

            this.ChanelLogEnd(BranchCode, caller, url);

            if (response.data && response.data.data) {
                console.log(`ClosedLoanModified success for CONo ${CONo}`);
                return response.data.data;
            }
            return null;

        } catch (error) {
            console.error(`Error in getClosedLoanModified for CONo ${CONo}:`, error.message);
            return null;
        }
    }

    // Database Helper - Get Personnel List using your existing polist model
    async getPersonnelList(BranchCode, projectcode, designation, PIN, project) {
        try {
            console.log(`=== Getting personnel list for designation: ${designation} ===`);
            
            let whereCondition = { 
                branchcode: BranchCode, 
                status: '1' 
            };
            
            if (designation === "Assistant Branch Manager") {
                whereCondition.abm = { [polist.sequelize.Op.ne]: '' };
                whereCondition.projectcode = projectcode;
            } 
            else if (designation === "Branch Manager" || designation === "Senior Branch Manager") {
                whereCondition.desig = { [polist.sequelize.Op.ne]: 'Assistant Branch Manager' };
                if (project === '339') {
                    whereCondition.projectcode = project;
                } else {
                    whereCondition.projectcode = projectcode;
                }
            } 
            else if (designation === "Area Manager") {
                if (['550', '1039', '159', '339'].includes(project)) {
                    whereCondition.projectcode = { [polist.sequelize.Op.in]: ['550', '1039', '159', '339'] };
                    whereCondition.desig = { [polist.sequelize.Op.ne]: 'Area Manager' };
                }
            } 
            else if (designation === "Area Development Coordinator, IDP") {
                if (['550', '1039', '159'].includes(project)) {
                    whereCondition.projectcode = { [polist.sequelize.Op.in]: ['550', '1039', '159'] };
                }
            } 
            else if (designation === "Area Development Coordinator") {
                if (['550', '1039', '159'].includes(project)) {
                    whereCondition.projectcode = { [polist.sequelize.Op.in]: ['550', '1039', '159'] };
                }
            }

            console.log('Personnel query:', JSON.stringify(whereCondition));
            
            // Use your existing polist model
            const results = await polist.findAll({
                where: whereCondition,
                raw: true // Get plain objects instead of Sequelize instances
            });

            console.log(`Found ${results.length} personnel records`);
            return results;

        } catch (error) {
            console.error('Error getting personnel list:', error);
            return [];
        }
    }

    // Same as getPersonnelList but for API calls
    async getPersonnelForApiCalls(BranchCode, projectcode, designation, PIN, project) {
        return await this.getPersonnelList(BranchCode, projectcode, designation, PIN, project);
    }

    // Logging functions
    ChanelLogStart(BranchCode, PIN, url) {
        console.log(`[${new Date().toISOString()}] LOG START - Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }

    ChanelLogEnd(BranchCode, PIN, url) {
        console.log(`[${new Date().toISOString()}] LOG END - Branch: ${BranchCode}, PIN: ${PIN}, URL: ${url}`);
    }
}

// Initialize BMSM Data Pooling instance
const bmsmDataPooling = new BMSMDataPooling();

// MAIN FUNCTION - This calls the BMSMDataPooling class
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

// Export functions
module.exports = { 
    getAllPo, 
    postPo
};