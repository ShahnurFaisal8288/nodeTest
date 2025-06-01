const voService = require('./services/voService');

exports.handleVoList = async (req, res, next) => {
    try {
        const {
            BranchCode,
            cono,
            projectcode,
            br_date,
            LastSyncTime,
            securitykey,
            PIN,
            EndcurrentTimes,
            url
        } = req.body;

        if (!BranchCode || !cono || !projectcode || !br_date || !LastSyncTime || !securitykey || !PIN || !EndcurrentTimes || !url) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const result = await voService.getVOListModified(
            BranchCode,
            cono,
            projectcode,
            br_date,
            LastSyncTime,
            securitykey,
            PIN,
            EndcurrentTimes,
            url
        );

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
