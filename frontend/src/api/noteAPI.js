import axiosInstance from './axiosInstance';

/**
 * Note-related API calls (sidebar notepad widget).
 * Supports an optional `date` (YYYY-MM-DD) to pin a note to a calendar day.
 */

export const getNotes = async () => {
  const response = await axiosInstance.get('/notes');
  return response.data;
};

export const getNoteByDate = async (date) => {
  const response = await axiosInstance.get(`/notes/by-date/${date}`);
  return response.data;
};

export const createNote = async (content, date = null) => {
  const response = await axiosInstance.post('/notes', { content, date });
  return response.data;
};

export const updateNote = async (id, content, date) => {
  // `date` intentionally left undefined-able: if the caller doesn't pass it,
  // we don't include the key at all, so the backend leaves the note's
  // existing date untouched instead of accidentally clearing it.
  const payload = { content };
  if (date !== undefined) payload.date = date;

  const response = await axiosInstance.put(`/notes/${id}`, payload);
  return response.data;
};

export const deleteNote = async (id) => {
  const response = await axiosInstance.delete(`/notes/${id}`);
  return response.data;
};