import { useState, useEffect } from 'react';
import { programmeService } from '../services/programmeService';

export const useProgrammes = (initialParams = {}) => {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgrammes = async (params = {}) => {
    setLoading(true);
    try {
      const data = await programmeService.getAll(params);
      setProgrammes(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch programmes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammes(initialParams);
  }, []);

  return { programmes, loading, error, fetchProgrammes };
};

export const useProgramme = (id) => {
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchProgramme = async () => {
      setLoading(true);
      try {
        const data = await programmeService.getById(id);
        setProgramme(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch programme details');
      } finally {
        setLoading(false);
      }
    };
    fetchProgramme();
  }, [id]);

  return { programme, loading, error };
};
