import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children, onUserLang }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then(data => {
          setUser(data.user);
          if (data.user?.language && onUserLang) onUserLang(data.user.language);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    if (data.user?.language && onUserLang) onUserLang(data.user.language);
    return data;
  };

  const register = async (username, password) => {
    const data = await authApi.register(username, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  const updateUser = (newUser) => setUser(newUser);

  const setFavoriteCountry = async (countryId) => {
    const data = await authApi.setFavoriteCountry(countryId);
    localStorage.setItem('token', data.token);
    setUser({ ...data.user });
  };

  const updateAvatarFields = async (fields) => {
    const data = await authApi.updateAvatar(fields);
    localStorage.setItem('token', data.token);
    setUser({ ...data.user });
  };

  const uploadAvatarFile = async (base64, contentType, originalBase64, originalContentType) => {
    const data = await authApi.uploadAvatar(base64, contentType, originalBase64, originalContentType);
    localStorage.setItem('token', data.token);
    setUser({ ...data.user });
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, setFavoriteCountry, updateAvatarFields, uploadAvatarFile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
