import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, openLoginModal } = useAuth();

  // ✅ User nahi hai toh modal open karo
  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-muted)',
        fontSize: 16,
      }}>
        Loading...
      </div>
    );
  }

  // ✅ /login ki jagah home pe bhejo, modal wahan se khulega
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
