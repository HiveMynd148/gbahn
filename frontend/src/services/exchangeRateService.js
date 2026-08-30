import api from './api';

export const exchangeRateService = {
  getRates: async () => {
    const res = await api.get('/exchange-rates/');
    return res.data;
  }
};
