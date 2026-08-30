import api from './api';

export const programmeService = {
  getAll: async (params) => {
    const res = await api.get('/programmes/', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/programmes/${id}`);
    return res.data;
  },
  getCost: async (id, currency) => {
    const res = await api.get(`/programmes/${id}/cost`, { params: { currency } });
    return res.data;
  },
  getFederalStates: async () => {
    const res = await api.get('/programmes/federal-states');
    return res.data;
  }
};
