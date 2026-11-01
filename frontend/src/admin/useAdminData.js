import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from './AdminAuth';

/**
 * Load data from the admin API: const { data, error, loading, reload } = useAdminData('/dashboard').
 */
export function useAdminData(path) {
  const { request } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await request(path));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, request]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}
