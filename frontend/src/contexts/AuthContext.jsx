import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthClient, isAuthConfigured } from '../services/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isAuthConfigured);
  const [error, setError] = useState(null);

  useEffect(() => {
    // onAuthStateChanged acompanha login, logout e restauração da sessão salva
    // pelo Firebase. A inscrição é removida quando o provider sai da tela.
    if (!isAuthConfigured) return;
    let cancelled = false;
    let unsubscribe;
    getAuthClient().then(({ auth, sdk }) => {
      if (cancelled) return;
      unsubscribe = sdk.onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      }, (authError) => { setError(authError); setLoading(false); });
    }).catch((authError) => {
      if (!cancelled) { setError(authError); setLoading(false); }
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }, []);

  return <AuthContext.Provider value={{ user, loading, error, configured: isAuthConfigured }}>{children}</AuthContext.Provider>;
}

// Componentes chamam useAuth() sem precisar importar o SDK do Firebase.
export function useAuth() { return useContext(AuthContext); }
