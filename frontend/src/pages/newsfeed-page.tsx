import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Contest, type Announcement } from '../lib/api-client';
import { Volume2, Megaphone, Clock, Award, ShieldAlert } from 'lucide-react';

interface RichAnnouncement extends Announcement {
  contestTitle: string;
}

export const NewsfeedPage: React.FC = () => {
  // Query all contests
  const { data: contests = [], isLoading: loadingContests, error: contestsError } = useQuery<Contest[]>({
    queryKey: ['contests'],
    queryFn: api.getContests,
  });

  // Query announcements from all contests in parallel
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery<RichAnnouncement[]>({
    queryKey: ['global-announcements', contests.map(c => c.id).join(',')],
    queryFn: async () => {
      if (contests.length === 0) return [];
      const results = await Promise.all(
        contests.map(async (contest) => {
          try {
            const list = await api.getAnnouncements(contest.id);
            return list.map(item => ({
              ...item,
              contestTitle: contest.title,
            }));
          } catch (e) {
            console.error(`Failed to load announcements for contest ${contest.id}`, e);
            return [];
          }
        })
      );
      return results.flat().sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
    enabled: contests.length > 0,
  });

  const isLoading = loadingContests || (contests.length > 0 && loadingAnnouncements);

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

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Header Banner */}
      <div className="home-banner" style={{ minHeight: '160px', padding: '2rem 3rem', marginBottom: '2.5rem' }}>
        <div className="home-banner-grid-bg"></div>
        <div className="home-banner-glow"></div>
        
        <div className="home-banner-content">
          <span className="home-banner-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>Tin Tức Hệ Thống</span>
          <h1 className="home-banner-title" style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Bảng Tin Thông Báo</h1>
          <p className="home-banner-subtitle" style={{ fontSize: '1rem', opacity: 0.9 }}>
            Cập nhật những thông báo chính thức, thông tin thay đổi đề thi và cập nhật hệ thống mới nhất.
          </p>
        </div>
        
        <div style={{ position: 'absolute', right: '5%', bottom: '10%', opacity: 0.15, pointerEvents: 'none' }}>
          <Megaphone size={120} color="#ffffff" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
        
        {/* Main Feed Column */}
        <div>
          {isLoading && (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '250px' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Đang tải tin tức...</p>
            </div>
          )}

          {!isLoading && contestsError && (
            <div className="alert alert-danger">
              Không thể kết nối máy chủ để tải thông báo.
            </div>
          )}

          {!isLoading && !contestsError && announcements.length === 0 && (
            <div className="panel flex flex-col items-center justify-center text-center" style={{ padding: '4rem 2rem' }}>
              <Volume2 size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, color: '#475569' }}>Không có thông báo nào</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem', maxWidth: '380px' }}>
                Hiện tại hệ thống chưa ghi nhận bất kỳ thông báo chính thức nào từ Ban Tổ Chức.
              </p>
            </div>
          )}

          {!isLoading && announcements.length > 0 && (
            <div className="flex flex-col gap-6">
              {announcements.map((ann) => (
                <article 
                  key={ann.id} 
                  className="panel"
                  style={{
                    borderLeft: ann.is_pinned ? '4px solid #2563eb' : '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    boxShadow: ann.is_pinned ? '0 4px 12px rgba(37, 99, 235, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
                    <div>
                      <div className="flex items-center gap-2" style={{ marginBottom: '0.4rem' }}>
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            backgroundColor: '#eff6ff', 
                            color: '#2563eb', 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          {ann.contestTitle}
                        </span>
                        {ann.is_pinned && (
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              backgroundColor: '#fee2e2', 
                              color: '#ef4444', 
                              padding: '0.2rem 0.6rem', 
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            Ghim
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: '#0f172a' }}>{ann.title}</h2>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-muted font-mono" style={{ fontSize: '0.8rem' }}>
                      <Clock size={14} style={{ color: '#94a3b8' }} />
                      {formatDateTime(ann.created_at)}
                    </div>
                  </div>

                  <p 
                    style={{ 
                      fontSize: '0.95rem', 
                      margin: 0, 
                      whiteSpace: 'pre-line', 
                      lineHeight: '1.6', 
                      color: '#334155' 
                    }}
                  >
                    {ann.content}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info Column */}
        <div>
          <div className="panel" style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={18} style={{ color: '#2563eb' }} />
              Về Nền Tảng
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#475569', margin: 0 }}>
              Chào mừng đến với nền tảng thi AI OLP. Đây là không gian tương tác, cập nhật trực tiếp tiến độ các kì thi. Hãy theo dõi Newsfeed để nhận các thông tin kỹ thuật sớm nhất.
            </p>
            <hr style={{ margin: '1rem 0', borderColor: '#e2e8f0' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#eab308' }} />
              <span>Nếu có bất kỳ sự cố kỹ thuật nào trong quá trình nộp bài, vui lòng gửi Support Ticket trong trang chi tiết Vòng thi tương ứng.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
