import api from './axiosInstance';
export const askAboutSpending = (question) =>
  api.post('/ai/ask', { question }).then(r => r.data);