import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from './useAuth';

export const useDashboard = () => {
  const { isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await dashboardService.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const addProgramme = async (id) => {
    await dashboardService.addProgramme(id);
    await fetchDashboard();
  };

  const removeProgramme = async (id) => {
    await dashboardService.removeProgramme(id);
    await fetchDashboard();
  };

  const updateStatus = async (id, status, notes) => {
    await dashboardService.updateProgrammeStatus(id, status, notes);
    await fetchDashboard();
  };

  return { dashboard, loading, error, fetchDashboard, addProgramme, removeProgramme, updateStatus };
};
