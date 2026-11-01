import { useEffect, useState } from 'react';
import { api, apiEnabled } from '../services/api';

/**
 * Provinces and the cities of the chosen province, from the external Indonesian
 * regions API (proxied and cached by Laravel). Empty lists when the API is off.
 */
export function useRegions(provinceId) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiEnabled) return;
    api('/regions/provinces')
      .then(setProvinces)
      .catch(() => setError('Could not load provinces — please type your city instead.'));
  }, []);

  useEffect(() => {
    setCities([]);
    if (!apiEnabled || !provinceId) return undefined;
    let current = true;
    api('/regions/provinces/' + provinceId + '/cities')
      .then((list) => current && setCities(list))
      .catch(() => current && setError('Could not load cities for this province.'));
    return () => {
      current = false;
    };
  }, [provinceId]);

  return { provinces, cities, error, enabled: apiEnabled && !error };
}
