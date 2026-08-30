import React, { createContext, useState, useEffect } from 'react';
import { exchangeRateService } from '../services/exchangeRateService';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../hooks/useAuth';

export const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [rates, setRates] = useState([]);
  const [currencies, setCurrencies] = useState(['EUR', 'INR', 'USD', 'GBP']); // Default fallbacks
  
  // We cannot use useAuth hook directly if we are high in tree unless AuthProvider wraps us, which it does.
  // Wait, let's just expose a function to update selected currency and handle it.
  
  useEffect(() => {
    exchangeRateService.getRates().then(data => {
      setRates(data);
      const currs = ['EUR', ...data.map(r => r.target_currency)];
      setCurrencies([...new Set(currs)].sort());
    }).catch(err => console.error("Failed to load exchange rates", err));
  }, []);

  const changeCurrency = async (newCurrency, isAuthenticated) => {
    setSelectedCurrency(newCurrency);
    if (isAuthenticated) {
      try {
        await dashboardService.updateSettings(newCurrency);
      } catch (err) {
        console.error("Failed to update user currency preference", err);
      }
    }
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, changeCurrency, rates, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
};
