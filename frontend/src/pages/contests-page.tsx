import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, type Contest } from '../lib/api-client';
import { Calendar, Clock, MapPin } from 'lucide-react';

export const ContestsPage: React.FC = () => {
  const { data: contests = [], isLoading, error } = useQuery<Contest[]>({
    queryKey: ['contests'],
    queryFn: api.getContests,
  });

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const getEntryPolicyText = (policy: string) => {
    switch (policy) {
      case 'individual': return 'Cá nhân';
      case 'team': return 'Đồng đội (Team)';
      case 'both': return 'Cá nhân & Đồng đội';
      default: return 'Cá nhân';
    }
  };

  // Group contests (filtering out draft status)
  const publicContests = contests.filter(c => c.status !== 'draft');

  const activeContests = publicContests.filter(c => {
    const start = new Date(c.start_time);
    const end = new Date(c.end_time);
    const now = new Date();
    return now >= start && now <= end;
  });

  const upcomingContests = publicContests.filter(c => {
    const start = new Date(c.start_time);
    const now = new Date();
    return now < start;
  });

  const endedContests = publicContests.filter(c => {
    const end = new Date(c.end_time);
    const now = new Date();
    return now > end;
  });

  const renderContestSection = (title: string, list: Contest[], statusType: 'running' | 'upcoming' | 'ended') => {
    if (list.length === 0) return null;

    return (
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            style={{ 
              width: '8px', 
              height: '18px', 
              borderRadius: '2px', 
              backgroundColor: statusType === 'running' ? '#16a34a' : statusType === 'upcoming' ? '#2563eb' : '#64748b' 
            }}
          ></span>
          {title} ({list.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {list.map((contest) => {
            const isRunning = statusType === 'running';
            const isUpcoming = statusType === 'upcoming';
            const isEnded = statusType === 'ended';

            const badgeColor = isRunning 
              ? { bg: '#dcfce7', text: '#16a34a' } 
              : isUpcoming 
              ? { bg: '#eff6ff', text: '#2563eb' } 
              : { bg: '#f1f5f9', text: '#475569' };

            return (
              <div 
                key={contest.id} 
                className="contest-row-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.25rem 1.5rem',
                  border: isRunning ? '1px solid hsla(217, 91%, 60%, 0.15)' : '1px solid #e2e8f0',
                  boxShadow: isRunning ? '0 4px 12px rgba(37, 99, 235, 0.04)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                  transition: 'transform 0.15s ease',
                  backgroundColor: '#ffffff'
                }}
              >
                <div 
                  className="contest-row-thumb"
                  style={{
                    backgroundColor: isRunning ? '#2563eb' : '#64748b',
                    fontWeight: 700,
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  AI OLP
                </div>
                
                <div className="contest-row-details" style={{ marginLeft: '1.5rem', flex: 1 }}>
                  <div className="contest-row-title-container" style={{ gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <h3 className="contest-row-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                      {contest.title}
                    </h3>
                    <span 
                      className="badge" 
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        backgroundColor: badgeColor.bg,
                        color: badgeColor.text,
                        border: 'none'
                      }}
                    >
                      Thi {getEntryPolicyText(contest.entry_policy)}
                    </span>
                  </div>
                  
                  <div className="contest-row-meta" style={{ gap: '1.5rem', color: '#64748b' }}>
                    <span className="contest-row-meta-item">
                      <Clock size={14} style={{ color: '#94a3b8' }} />
                      {formatDateTime(contest.start_time)} - {formatDateTime(contest.end_time)}
                    </span>
                    <span className="contest-row-meta-item">
                      <MapPin size={14} style={{ color: '#94a3b8' }} />
                      Online
                    </span>
                  </div>
                </div>

                <div className="contest-row-action">
                  <Link 
                    to={`/contests/${contest.id}`} 
                    className="btn"
                    style={{
                      backgroundColor: isRunning ? '#2563eb' : '#f1f5f9',
                      color: isRunning ? '#ffffff' : '#475569',
                      padding: '0.6rem 1.2rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    {isUpcoming ? 'Chi tiết' : isEnded ? 'Bảng xếp hạng' : 'Vào thi'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Header Banner */}
      <div className="home-banner" style={{ minHeight: '160px', padding: '2rem 3rem', marginBottom: '2.5rem' }}>
        <div className="home-banner-grid-bg"></div>
        <div className="home-banner-glow"></div>
        
        <div className="home-banner-content">
          <span className="home-banner-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Danh Sách Cuộc Thi</span>
          <h1 className="home-banner-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Các Kì Thi AI</h1>
          <p className="home-banner-subtitle" style={{ fontSize: '1rem', opacity: 0.9 }}>
            Tham gia tranh tài ở các kì thi giải thuật AI đầy kịch tính để nâng tầm năng lực lập trình của bản thân.
          </p>
        </div>
        
        <div style={{ position: 'absolute', right: '5%', bottom: '10%', opacity: 0.15, pointerEvents: 'none' }}>
          <Calendar size={120} color="#ffffff" />
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải danh sách cuộc thi...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="alert alert-danger">
          Không thể kết nối máy chủ để tải cuộc thi. Vui lòng kiểm tra lại kết nối.
        </div>
      )}

      {!isLoading && !error && publicContests.length === 0 && (
        <div className="panel flex flex-col items-center justify-center text-center" style={{ padding: '4rem 2rem' }}>
          <Calendar size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
          <h3 style={{ margin: 0, color: '#475569' }}>Chưa có cuộc thi nào</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Hệ thống chưa có cuộc thi nào được công bố. Vui lòng quay lại sau!
          </p>
        </div>
      )}

      {!isLoading && !error && publicContests.length > 0 && (
        <div>
          {renderContestSection('Đang diễn ra', activeContests, 'running')}
          {renderContestSection('Sắp diễn ra', upcomingContests, 'upcoming')}
          {renderContestSection('Đã kết thúc', endedContests, 'ended')}
        </div>
      )}

    </div>
  );
};
