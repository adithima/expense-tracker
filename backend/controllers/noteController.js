const Note = require('../models/Note');

/**
 * @desc    Create a new note (freeform, or pinned to a date if `date` is sent)
 * @route   POST /api/notes
 * @access  Private
 */
const createNote = async (req, res, next) => {
  try {
    const { content, date } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    // Normalize: treat empty string / undefined as freeform (null)
    const normalizedDate = date && date.trim() ? date.trim() : null;

    const note = await Note.create({
      user: req.user._id,
      content,
      date: normalizedDate,
    });

    res.status(201).json({
      success: true,
      message: 'Note saved',
      note,
    });
  } catch (error) {
    // Duplicate date-linked note for this user (partial unique index hit)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have a note for this day. Edit that one instead.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all notes for the logged-in user, most recently updated first
 * @route   GET /api/notes
 * @access  Private
 */
const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the single note pinned to a specific date (if any)
 * @route   GET /api/notes/by-date/:date
 * @access  Private
 */
const getNoteByDate = async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'date param must be in YYYY-MM-DD format',
      });
    }

    const note = await Note.findOne({ user: req.user._id, date });

    res.status(200).json({
      success: true,
      note: note || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a note (content and/or its date link)
 * @route   PUT /api/notes/:id
 * @access  Private
 */
const updateNote = async (req, res, next) => {
  try {
    const { content, date } = req.body;

    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    if (content !== undefined) note.content = content;

    // Allow explicitly clearing the date (unpin) by sending date: null,
    // setting a new date, or leaving date untouched if not sent at all.
    if (date !== undefined) {
      note.date = date && date.trim() ? date.trim() : null;
    }

    await note.save();

    res.status(200).json({
      success: true,
      message: 'Note updated',
      note,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have a note for this day. Edit that one instead.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete a note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteByDate,
  updateNote,
  deleteNote,
};