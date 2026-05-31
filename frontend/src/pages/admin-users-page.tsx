import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type User } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { ShieldCheck, ChevronLeft, ChevronRight, Users } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Protect client-side page access
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Fetch admin stats (to get total users count)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: api.getAdminStats,
  });

  const totalUsers = stats?.users ?? 0;
  const totalPages = Math.ceil(totalUsers / limit) || 1;

  // Fetch users for the current page
  const { data: users = [], isLoading: loadingUsers, error, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['adminUsers', page],
    queryFn: () => api.listUsers(limit, offset),
  });

  // Mutation to update user role
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.updateUserRole(id, role),
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const isLoading = loadingStats || loadingUsers;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Header Banner */}
      <div className="home-banner" style={{ minHeight: '160px', padding: '2rem 3rem', marginBottom: '2.5rem' }}>
        <div className="home-banner-grid-bg"></div>
        <div className="home-banner-glow"></div>
        
        <div className="home-banner-content">
          <span className="home-banner-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Hệ Thống</span>
          <h1 className="home-banner-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Người Dùng & Vai Trò</h1>
          <p className="home-banner-subtitle" style={{ fontSize: '1rem', opacity: 0.9 }}>
            Phân quyền vai trò hệ thống (Admin, Jury, Contestant) cho các tài khoản người dùng trên nền tảng.
          </p>
        </div>
        
        <div style={{ position: 'absolute', right: '5%', bottom: '10%', opacity: 0.15, pointerEvents: 'none' }}>
          <ShieldCheck size={120} color="#ffffff" />
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải danh sách tài khoản...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="alert alert-danger">
          Không thể tải danh sách tài khoản người dùng từ máy chủ. Vui lòng kiểm tra lại quyền truy cập.
        </div>
      )}

      {!isLoading && !error && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: '#3b82f6' }} />
              Danh sách tài khoản ({totalUsers})
            </h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>TÊN NGƯỜI DÙNG</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>ĐỊA CHỈ EMAIL</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>VAI TRÒ HIỆN TẠI</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textAlign: 'right', width: '360px' }}>THAO TÁC GÁN VAI TRÒ</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr 
                    key={u.id} 
                    style={{ 
                      borderBottom: '1px solid #e2e8f0', 
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1.15rem 1.5rem', fontWeight: 600, color: '#0f172a' }}>{u.full_name}</td>
                    <td style={{ padding: '1.15rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>{u.email}</td>
                    <td style={{ padding: '1.15rem 1.5rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: u.role === 'admin' ? '#fee2e2' : u.role === 'jury' ? '#fef3c7' : '#dcfce7',
                          color: u.role === 'admin' ? '#b91c1c' : u.role === 'jury' ? '#b45309' : '#15803d',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '1.15rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => updateUserRoleMutation.mutate({ id: u.id, role: 'admin' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            disabled={updateUserRoleMutation.isPending}
                          >
                            Set Admin
                          </button>
                        )}
                        {u.role !== 'jury' && (
                          <button
                            onClick={() => updateUserRoleMutation.mutate({ id: u.id, role: 'jury' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            disabled={updateUserRoleMutation.isPending}
                          >
                            Set Jury
                          </button>
                        )}
                        {u.role !== 'contestant' && (
                          <button
                            onClick={() => updateUserRoleMutation.mutate({ id: u.id, role: 'contestant' })}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            disabled={updateUserRoleMutation.isPending}
                          >
                            Set Contestant
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Hiển thị từ <strong>{offset + 1}</strong> đến <strong>{Math.min(offset + limit, totalUsers)}</strong> trong tổng số <strong>{totalUsers}</strong> người dùng
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="btn btn-secondary flex items-center gap-1"
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.85rem', 
                    border: '1px solid #cbd5e1',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.5 : 1
                  }}
                >
                  <ChevronLeft size={16} /> Trước
                </button>
                <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 600 }}>
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="btn btn-secondary flex items-center gap-1"
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.85rem', 
                    border: '1px solid #cbd5e1',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.5 : 1
                  }}
                >
                  Tiếp <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
