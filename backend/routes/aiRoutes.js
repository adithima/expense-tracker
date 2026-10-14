const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { askAboutSpending } = require('../controllers/aiController');

router.use(protect);
router.post('/ask', askAboutSpending);

module.exports = router;