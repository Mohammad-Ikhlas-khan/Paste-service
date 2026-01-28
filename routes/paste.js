const express=require('express');
const router = express.Router();

const { createPaste, getPaste, viewPaste} = require('../controllers/pasteController.js');

router.post('/api/pastes', createPaste);
router.get('/api/pastes/:id', getPaste);
router.get('/p/:id', viewPaste);

module.exports = router;