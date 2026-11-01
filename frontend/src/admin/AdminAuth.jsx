import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'gw-admin-token';

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Admin login state. The Sanctum token is kept in this browser so a reload
 * stays signed in; any 401 from the API signs the user out.
 */
export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);

  const save = (value) => {
    setToken(value);
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage blocked — stays signed in until the tab closes
    }
  };

  const logout = useCallback(() => {
    if (token) api('/admin/logout', { method: 'POST', token }).catch(() => {});
    save(null);
    setUser(null);
  }, [token]);

  /** Call the admin API with the token; signs out on 401. */
  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await api('/admin' + path, { ...options, token });
      } catch (error) {
        if (error.status === 401) {
          save(null);
          setUser(null);
        }
        throw error;
      }
    },
    [token]
  );

  const login = async (email, password) => {
    const res = await api('/admin/login', { method: 'POST', body: { email, password } });
    save(res.token);
    setUser(res.user);
  };

  const value = useMemo(
    () => ({ token, user, setUser, login, logout, request }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, logout, request]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAdmin = () => useContext(AuthContext);
