async function userDetailsController(req, res) {
    try {
        
    } catch (error) {
        res.status(400).json({ 
            message: error.message || error,
            error: true,
            success: false 
        });
    }
};

module.exports = userDetailsController;