import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { Calendar, AlertCircle, ArrowLeft } from 'lucide-react';

export const AdminContestCreatePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [entryPolicy, setEntryPolicy] = useState<'individual' | 'team' | 'both'>('individual');
  const [formError, setFormError] = useState<string | null>(null);

  // Client-side access guard
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Create contest mutation
  const createContestMutation = useMutation({
    mutationFn: (payload: any) => api.createContest(payload),
    onSuccess: (newContest) => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      // Reset form
      setTitle('');
      setSlug('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setEntryPolicy('individual');
      setFormError(null);
      // Navigate to contest setup page
      navigate(`/admin/contests/${newContest.id}/setup`);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to create contest.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title || !slug || !startTime || !endTime) {
      setFormError('Please fill in all required fields.');
      return;
    }
    createContestMutation.mutate({
      title,
      slug,
      description,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      entry_policy: entryPolicy,
      visibility: 'public',
      max_team_size: entryPolicy === 'team' || entryPolicy === 'both' ? 3 : 1,
      require_approval: false,
    });
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Back Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/contests" className="btn btn-secondary flex items-center gap-2" style={{ width: 'fit-content', padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={14} /> Trở lại danh sách cuộc thi
        </Link>
      </div>

      {/* Header Banner */}
      <div className="home-banner" style={{ minHeight: '160px', padding: '2rem 3rem', marginBottom: '2.5rem' }}>
        <div className="home-banner-grid-bg"></div>
        <div className="home-banner-glow"></div>
        
        <div className="home-banner-content">
          <span className="home-banner-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>Quản Trị</span>
          <h1 className="home-banner-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Tạo Cuộc Thi Mới</h1>
          <p className="home-banner-subtitle" style={{ fontSize: '1rem', opacity: 0.9 }}>
            Khởi tạo cuộc thi lập trình thuật toán AI mới trên hệ thống.
          </p>
        </div>
        
        <div style={{ position: 'absolute', right: '5%', bottom: '10%', opacity: 0.15, pointerEvents: 'none' }}>
          <Calendar size={120} color="#ffffff" />
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem', marginTop: 0 }}>
          Thông tin chi tiết cuộc thi
        </h3>

        {formError && (
          <div className="alert alert-danger flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <div>{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Tên cuộc thi *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
              }}
              required
              placeholder="Ví dụ: AI Driving Agent Challenge 2026"
              style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Đường dẫn thân thiện (Slug) *</label>
            <input
              type="text"
              className="form-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="Ví dụ: ai-driving-challenge-2026"
              style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Mô tả ngắn</label>
            <textarea
              className="form-input"
              style={{ height: '100px', resize: 'vertical', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mục tiêu cuộc thi, thể lệ, quy tắc chung..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Thời gian bắt đầu *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Thời gian kết thúc *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Chế độ tham gia</label>
            <select
              className="form-input"
              value={entryPolicy}
              onChange={(e: any) => setEntryPolicy(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', height: 'auto' }}
            >
              <option value="individual">Chỉ cá nhân</option>
              <option value="team">Chỉ đội nhóm</option>
              <option value="both">Cả hai chế độ</option>
            </select>
          </div>

          <div className="flex gap-3" style={{ justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <Link to="/contests" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              Hủy bỏ
            </Link>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ backgroundColor: '#2563eb', padding: '0.6rem 1.2rem', borderRadius: '6px' }}
              disabled={createContestMutation.isPending}
            >
              {createContestMutation.isPending ? 'Đang khởi tạo...' : 'Tạo cuộc thi'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
