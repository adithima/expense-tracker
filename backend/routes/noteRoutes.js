const express = require('express');
const router = express.Router();

const {
  createNote,
  getNotes,
  getNoteByDate,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');

const { protect } = require('../middleware/authMiddleware');

// All note routes require a logged-in user
router.use(protect);

/**
 * @route   POST /api/notes
 * @desc    Create a new note (freeform, or pinned to a date)
 * @access  Private
 */
router.post('/', createNote);

/**
 * @route   GET /api/notes
 * @desc    Get all notes for the logged-in user
 * @access  Private
 */
router.get('/', getNotes);

/**
 * @route   GET /api/notes/by-date/:date
 * @desc    Get the note pinned to a specific day (YYYY-MM-DD), used by
 *          the Calendar page for click-to-view day notes
 * @access  Private
 */
router.get('/by-date/:date', getNoteByDate);

/**
 * @route   PUT /api/notes/:id
 * @desc    Update a note (content and/or date link)
 * @access  Private
 */
router.put('/:id', updateNote);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete a note
 * @access  Private
 */
router.delete('/:id', deleteNote);

module.exports = router;