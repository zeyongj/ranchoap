// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const GENERAL_PASSWORD = 'apvan2026';
const ADMIN_PASSWORD = 'ranchovan1125';
const SENIOR_PASSWORD = '1981';
const POST_PAYMENT_PASSWORD = '4255';
const ADMIN_USERNAME = 'admin';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('ranchoap_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [seniorUnlocked, setSeniorUnlocked] = useState(() =>
    sessionStorage.getItem('ranchoap_senior') === 'true'
  );
  const [postPaymentUnlocked, setPostPaymentUnlocked] = useState(() =>
    sessionStorage.getItem('ranchoap_postpayment') === 'true'
  );

  const login = (username, password) => {
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser) return { success: false, error: 'Please enter your name.' };

    if (trimmedUser.toLowerCase() === ADMIN_USERNAME) {
      if (trimmedPass === ADMIN_PASSWORD) {
        const u = { username: ADMIN_USERNAME, isAdmin: true };
        setUser(u);
        sessionStorage.setItem('ranchoap_user', JSON.stringify(u));
        setSeniorUnlocked(true);
        setPostPaymentUnlocked(true);
        sessionStorage.setItem('ranchoap_senior', 'true');
        sessionStorage.setItem('ranchoap_postpayment', 'true');
        return { success: true };
      }
      return { success: false, error: 'Incorrect admin password.' };
    }

    if (trimmedPass === GENERAL_PASSWORD) {
      const u = { username: trimmedUser, isAdmin: false };
      setUser(u);
      sessionStorage.setItem('ranchoap_user', JSON.stringify(u));
      return { success: true };
    }
    return { success: false, error: 'Incorrect password.' };
  };

  const logout = () => {
    setUser(null);
    setSeniorUnlocked(false);
    setPostPaymentUnlocked(false);
    sessionStorage.clear();
  };

  const unlockSenior = (password) => {
    if (password === SENIOR_PASSWORD || user?.isAdmin) {
      setSeniorUnlocked(true);
      sessionStorage.setItem('ranchoap_senior', 'true');
      return true;
    }
    return false;
  };

  const unlockPostPayment = (password) => {
    if (password === POST_PAYMENT_PASSWORD || user?.isAdmin) {
      setPostPaymentUnlocked(true);
      sessionStorage.setItem('ranchoap_postpayment', 'true');
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      seniorUnlocked, unlockSenior,
      postPaymentUnlocked, unlockPostPayment
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
