import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkAuthStatus } from './services/api';
import Login from './pages/Login';
import ChatNew from './pages/ChatNew';
import AuthSuccess from './pages/AuthSuccess';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await checkAuthStatus();
      if (response.data.authenticated) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/auth/success" element={<AuthSuccess onSuccess={checkAuth} />} />
        <Route path="/" element={user ? <ChatNew user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
