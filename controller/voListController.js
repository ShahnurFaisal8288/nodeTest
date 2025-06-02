const axios = require('axios');
const moment = require('moment');

const VOListController = {
    
    // Main method to fetch VOList data
    async getVOList(req, res) {
        try {
            const {
                BranchCode,
                PIN,
                cono,
                projectcode,
                LastSyncTime,
                securitykey,
                EndcurrentTimes,
                baseUrl,
                AppId,
                AppVersionCode,
                AppVersionName
            } = req.body;

            // Validate required parameters
            if (!BranchCode || !PIN || !cono || !projectcode || !securitykey || !baseUrl) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters',
                    required: ['BranchCode', 'PIN', 'cono', 'projectcode', 'securitykey', 'baseUrl'],
                    received: Object.keys(req.body)
                });
            }

            const currentTimesVoList = moment().format('YYYY-MM-DD HH:mm:ss');
            const status = `Branch VOList IN-${cono}`;
            
            // Log sync time
            console.log(`Sync Time: ${status} at ${currentTimesVoList}`);

            // Build URL
            const apiUrl = `${baseUrl}VOList`;
            const params = {
                BranchCode,
                PIN: cono,
                ProjectCode: projectcode,
                UpdatedAt: LastSyncTime || '2000-01-01 12:00:00',
                key: securitykey,
                caller: PIN,
                EndDateTime: EndcurrentTimes
            };

            // Log channel start
            console.log(`Channel Log Start: ${BranchCode} - ${PIN} - ${apiUrl}`);
            console.log('Request params:', params);

            // Make API request
            const response = await VOListController.makeApiRequest(apiUrl, params);
            
            if (!response.success) {
                return res.status(500).json({
                    status: 'error',
                    message: response.message,
                    debug: response.debug
                });
            }

            // Process response
            const processedData = VOListController.processApiResponse(response.data);
            
            return res.json({
                status: 'success',
                message: 'VOList data retrieved successfully',
                data: processedData.data,
                count: processedData.count,
                timestamp: currentTimesVoList
            });

        } catch (error) {
            console.error('VOList API Error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
                debug: {
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                }
            });
        }
    },

    // Make API request with proper error handling
    async makeApiRequest(url, params) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = `${url}?${queryString}`;

            console.log('Making request to:', fullUrl);

            const config = {
                method: 'GET',
                url: fullUrl,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'NodeJS-App/1.0'
                },
                timeout: 30000, // 30 seconds
                validateStatus: function (status) {
                    return status < 500; // Resolve only if status code is less than 500
                }
            };

            const response = await axios(config);

            // Check if response is successful
            if (response.status !== 200) {
                return {
                    success: false,
                    message: `HTTP Error: ${response.status}`,
                    debug: {
                        status: response.status,
                        statusText: response.statusText,
                        data: response.data,
                        url: fullUrl
                    }
                };
            }

            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error('API Request Error:', error);
            
            if (error.code === 'ECONNABORTED') {
                return {
                    success: false,
                    message: 'Request timeout',
                    debug: { error: 'Connection timeout', url: url }
                };
            }
            
            if (error.response) {
                return {
                    success: false,
                    message: `API Error: ${error.response.status}`,
                    debug: {
                        status: error.response.status,
                        data: error.response.data,
                        headers: error.response.headers,
                        url: url
                    }
                };
            }
            
            return {
                success: false,
                message: 'Network error',
                debug: { error: error.message, url: url }
            };
        }
    },

    // Process API response with flexible structure handling
    processApiResponse(responseData) {
        const result = {
            data: [],
            count: 0
        };

        if (!responseData) {
            return result;
        }

        // Handle standard structure: {data: [], message: ""}
        if (responseData.data && responseData.message) {
            if (responseData.message === "No data found" || !responseData.data.length) {
                return result;
            }
            result.data = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
            result.data = responseData;
        }
        // Handle single object response (like your current case)
        else if (typeof responseData === 'object' && (responseData.BranchCode || responseData.ProjectCode)) {
            result.data = [responseData];
        }
        // Handle error responses
        else if (responseData.error || responseData.status === 'error') {
            throw new Error(responseData.error || responseData.message || 'Unknown API error');
        }
        else {
            // Log unexpected structure for debugging
            console.warn('Unexpected API response structure:', Object.keys(responseData));
            result.data = [responseData];
        }

        result.count = result.data.length;
        return result;
    },

    // Test endpoint to validate the API
    async testVOList(req, res) {
        const sampleRequest = {
            BranchCode: "1831",
            PIN: "00142543",
            cono: "00142543",
            projectcode: "015",
            LastSyncTime: "2000-01-01 12:00:00",
            securitykey: "your-security-key",
            EndcurrentTimes: "2024-05-29 18:00:00",
            baseUrl: "https://bracapitesting.brac.net/node/scapir/",
            AppId: "your-app-id",
            AppVersionCode: "1.0.0",
            AppVersionName: "VOList App"
        };

        req.body = sampleRequest;
        return VOListController.getVOList(req, res);
    }
};

module.exports = VOListController;