// controllers/transactionsModifiedSavingsController.js
const axios = require('axios');
const moment = require('moment');
const { URLSearchParams } = require('url');

const TransactionsModifiedSavingsController = {
    // Main method to fetch transactions
    async getTransactionsModifiedSavings(req, res) {
        try {
            const {
                BranchCode,
                PIN,
                cono,
                projectcode,
                LastSyncTime = '2000-01-01 12:00:00',
                securitykey,
                EndcurrentTimes = moment().format('YYYY-MM-DD HH:mm:ss'),
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

            // Calculate previous two years date
            const previousTwoYears = moment().subtract(2, 'years').format('YYYY-MM-DD');
            const opendate = moment().format('YYYY-MM-DD');
            
            const status = `Branch TransactionsModifiedSavings IN-${cono}`;
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            
            // Log sync time
            console.log(`Sync Time: ${status} at ${currentTime}`);

            // Initial request
            const initialParams = {
                BranchCode,
                CONo: cono,
                ProjectCode: projectcode,
                StartDate: previousTwoYears,
                EndDate: opendate,
                UpdatedAt: LastSyncTime,
                key: securitykey,
                caller: PIN,
                EndDateTime: EndcurrentTimes
            };

            const apiUrl = `${baseUrl}TransactionsModifiedSavings`;
            
            // Log channel start
            console.log(`Channel Log Start: ${BranchCode} - ${PIN} - ${apiUrl}`);
            console.log('Initial request params:', initialParams);

            // Process all transactions with pagination
            const result = await TransactionsModifiedSavingsController.processTransactionsWithPagination(
                apiUrl, 
                initialParams,
                BranchCode,
                PIN,
                AppId,
                AppVersionCode,
                AppVersionName
            );

            if (!result.success) {
                return res.status(500).json({
                    status: 'error',
                    message: result.message,
                    debug: result.debug
                });
            }

            return res.json({
                status: 'success',
                message: 'TransactionsModifiedSavings data retrieved successfully',
                data: result.data,
                count: result.count,
                timestamp: currentTime
            });

        } catch (error) {
            console.error('TransactionsModifiedSavings API Error:', error);
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

    // Process transactions with pagination support
    async processTransactionsWithPagination(apiUrl, initialParams, BranchCode, PIN, AppId, AppVersionCode, AppVersionName) {
        let allTransactions = [];
        let nextUrl = null;
        let lastId = '';
        let hasMoreData = true;
        let attemptCount = 0;
        const maxAttempts = 100; // Prevent infinite loops

        try {
            // Process initial request
            const initialResponse = await TransactionsModifiedSavingsController.makeApiRequest(apiUrl, initialParams);
            
            if (!initialResponse.success) {
                return initialResponse;
            }

            const { data: initialData, nextUrl: initialNextUrl } = TransactionsModifiedSavingsController.processApiResponse(initialResponse.data);
            
            if (initialData && initialData.length > 0) {
                allTransactions = allTransactions.concat(initialData);
            }

            nextUrl = initialNextUrl;
            if (nextUrl) {
                const urlParts = new URL(nextUrl, apiUrl);
                lastId = urlParts.searchParams.get('LastId') || '';
            }

            // Process paginated requests
            while (hasMoreData && lastId && attemptCount < maxAttempts) {
                attemptCount++;
                
                const paginatedParams = {
                    ...initialParams,
                    LastId: lastId
                };

                const paginatedResponse = await TransactionsModifiedSavingsController.makeApiRequest(apiUrl, paginatedParams);
                
                if (!paginatedResponse.success) {
                    return paginatedResponse;
                }

                const { data: paginatedData, nextUrl: paginatedNextUrl } = 
                    TransactionsModifiedSavingsController.processApiResponse(paginatedResponse.data);
                
                if (paginatedData && paginatedData.length > 0) {
                    allTransactions = allTransactions.concat(paginatedData);
                }

                nextUrl = paginatedNextUrl;
                if (nextUrl) {
                    const urlParts = new URL(nextUrl, apiUrl);
                    lastId = urlParts.searchParams.get('LastId') || '';
                } else {
                    hasMoreData = false;
                }
            }

            return {
                success: true,
                data: allTransactions,
                count: allTransactions.length
            };

        } catch (error) {
            console.error('Pagination Processing Error:', error);
            return {
                success: false,
                message: 'Error processing paginated data',
                debug: {
                    error: error.message,
                    lastId,
                    attemptCount,
                    collectedCount: allTransactions.length
                }
            };
        }
    },

    // Make API request with proper error handling
    async makeApiRequest(url, params) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = `${url}?${queryString}`.replace(/ /g, '%20');

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
                    debug: { error: 'Connection timeout', url }
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
                        url
                    }
                };
            }
            
            return {
                success: false,
                message: 'Network error',
                debug: { error: error.message, url }
            };
        }
    },

    // Process API response with flexible structure handling
    processApiResponse(responseData) {
        const result = {
            data: [],
            nextUrl: null
        };

        if (!responseData) {
            return result;
        }

        // Handle standard structure: {data: [], message: "", nextUrl: ""}
        if (responseData.data !== undefined && responseData.message !== undefined) {
            if (responseData.message === "No data found" || !responseData.data) {
                return result;
            }
            
            result.data = Array.isArray(responseData.data) ? responseData.data : [responseData.data];
            result.nextUrl = responseData.nextUrl || null;
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
            result.data = responseData;
        }
        // Handle single object response
        else if (typeof responseData === 'object') {
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

        return result;
    },

    // Test endpoint to validate the API
    async testTransactionsModifiedSavings(req, res) {
        const sampleRequest = {
            BranchCode: "1831",
            PIN: "00142543",
            cono: "00142543",
            projectcode: "015",
            LastSyncTime: "2000-01-01 12:00:00",
            securitykey: "your-security-key",
            EndcurrentTimes: moment().format('YYYY-MM-DD HH:mm:ss'),
            baseUrl: "https://bracapitesting.brac.net/node/scapir/",
            AppId: "your-app-id",
            AppVersionCode: "1.0.0",
            AppVersionName: "Transactions App"
        };

        req.body = sampleRequest;
        return TransactionsModifiedSavingsController.getTransactionsModifiedSavings(req, res);
    }
};

module.exports = TransactionsModifiedSavingsController;