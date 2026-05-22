import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { Trophy, LogOut, User as UserIcon, Settings } from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { user, logout, isAdmin, isJury } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="navbar-brand">
            <Trophy size={26} />
            OLP<span>AI</span>
          </Link>
          <nav className="navbar-links">
            <Link to="/" className="navbar-item">Contests</Link>
            {user && !isAdmin && !isJury && (
              <Link to="/teams" className="navbar-item">Teams</Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {(isAdmin || isJury) && (
                <Link to="/admin" className="btn btn-secondary flex items-center gap-2" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  <Settings size={14} />
                  Admin Panel
                </Link>
              )}
              <div className="flex items-center gap-2">
                <div className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  {user.role}
                </div>
                <div className="flex items-center gap-1 font-mono" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  <UserIcon size={14} className="text-muted" />
                  {user.full_name}
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-danger flex items-center gap-1" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
