import api from './api';

export const dashboardService = {
  getDashboard: async () => {
    const res = await api.get('/dashboard/');
    return res.data;
  },
  addProgramme: async (programmeId) => {
    const res = await api.post('/dashboard/programmes', { programme_id: programmeId });
    return res.data;
  },
  removeProgramme: async (programmeId) => {
    const res = await api.delete(`/dashboard/programmes/${programmeId}`);
    return res.data;
  },
  updateProgrammeStatus: async (programmeId, status, notes) => {
    const res = await api.patch(`/dashboard/programmes/${programmeId}`, { 
      personal_status: status, 
      personal_notes: notes 
    });
    return res.data;
  },
  updateSettings: async (currency) => {
    const res = await api.patch('/dashboard/settings', { display_currency: currency });
    return res.data;
  }
};
