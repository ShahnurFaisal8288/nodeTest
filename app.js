// Load environment variables
require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const app = express();

// Import Routes
const authRoute = require('./route/authRoute');
const projectRoute = require('./route/projectRoute');
const contactUsRoute = require('./route/contactUsRoute');
const polistRoute = require('./route/polistRoute');
const voListModifiedRoute = require('./route/voListModifiedRoute'); // for /VOListModified
const memberListRoutes = require('./route/memberListModifiedRoutes');
const closedLoanRoutes = require('./route/closedLoanModifiedRoutes');
// const voListController = require('./controller/voListController');
const transactionModifiedLoanRoute = require('./route/transactionsModifiedLoanRoute');
const  savingsInfoRoutes = require('./route/savingsInfoRoutes');
const collectionInfoRoutes = require('./route/collectionInfoRoutes');
const overdueCollectionInfoRoutes = require('./route/overdueCollectionInfoRoutes');
const seasonalLoanRoutes = require('./route/seasonalLoanRoute');
const GoodLoansRoutes = require('./route/goodLoansRoutes');
const TargetsPagingRoutes = require('./route/targetsPagingRoutes');
const activeSpecialSavingsProductsRoutes = require('./route/activeSpecialSavingsProductRoutes');
const transactionsModifiedTermSavingRoutes = require('./route/transactionsModifiedTermSavingRoute');
const TransactionsModifiedSavingsRoutes = require('./route/transactionsModifiedSavingsRoutes');
const voListRoute = require('./route/voListOrgRoute');
// const transactionsModifiedLoanRoutes = require('./route/transactionsModifiedLoanRoutes');

// Import Error Handling Utilities
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

// Middlewares
app.use(express.json()); // To parse JSON bodies

app.use(express.urlencoded({ extended: true }));


// Mount Routes
app.use('/api/auth', authRoute);
app.use('/api', projectRoute);
app.use('/api', contactUsRoute);
app.use('/api', polistRoute);
app.use('/api', voListModifiedRoute); // for /VOListModified
app.use('/api', memberListRoutes); // for /MemberListModified
app.use('/api', closedLoanRoutes); // for /ClosedLoanModified
app.use('/api', transactionModifiedLoanRoute); // for /transactionsModifiedLoan
app.use('/api', savingsInfoRoutes); // for /savingsInfo
app.use('/api', collectionInfoRoutes); // for /collectionInfo
app.use('/api', overdueCollectionInfoRoutes); // for /overdueCollectionInfo
app.use('/api', seasonalLoanRoutes); // for /SessionalLoanInfo
app.use('/api', GoodLoansRoutes); // for /GoodLoans
app.use('/api', TargetsPagingRoutes); // for /TargetsPaging
app.use('/api', activeSpecialSavingsProductsRoutes); // for /activeSpecialSavingsProducts
app.use('/api', transactionsModifiedTermSavingRoutes); // for /transactionsModifiedTermSavings
app.use('/api', TransactionsModifiedSavingsRoutes); // for /transactionsModifiedLoans
app.use('/api', voListRoute); // for /voListOrg



// app.use("/api", transactionsModifiedLoanRoutes);

// app.use('/api', voListRoute);



// Handle undefined routes
// app.all('*', (req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
// });


app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server`
  });
});


// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = process.env.APP_PORT || 2000;
app.listen(PORT, () => {
    console.log(`✅ Server up and running on port ${PORT}`);
});

module.exports = app;
