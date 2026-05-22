import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Contest } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { Trophy, Calendar, CheckCircle2, Clock, Plus, AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [entryPolicy, setEntryPolicy] = useState<'individual' | 'team' | 'both'>('individual');
  const [formError, setFormError] = useState<string | null>(null);

  // Query contests
  const { data: contests = [], isLoading, error } = useQuery<Contest[]>({
    queryKey: ['contests'],
    queryFn: api.getContests,
  });

  // Create contest mutation
  const createContestMutation = useMutation({
    mutationFn: api.createContest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      setShowCreateModal(false);
      // Reset form
      setTitle('');
      setSlug('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setEntryPolicy('individual');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Failed to create contest.');
    },
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

  // Group contests
  const activeContests = contests.filter(c => {
    const start = new Date(c.start_time);
    const end = new Date(c.end_time);
    const now = new Date();
    return c.status !== 'draft' && now >= start && now <= end;
  });

  const upcomingContests = contests.filter(c => {
    const start = new Date(c.start_time);
    const now = new Date();
    return c.status !== 'draft' && now < start;
  });

  const endedContests = contests.filter(c => {
    const end = new Date(c.end_time);
    const now = new Date();
    return c.status !== 'draft' && now > end;
  });

  const draftContests = contests.filter(c => c.status === 'draft');

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Platform Stats Grid */}
      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
        <div className="panel flex items-center gap-4" style={{ marginBottom: 0 }}>
          <Trophy size={40} className="text-primary" style={{ color: 'hsl(var(--primary))' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.75rem' }}>{activeContests.length}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Active Contests</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4" style={{ marginBottom: 0 }}>
          <Calendar size={40} className="text-primary" style={{ color: 'hsl(var(--warning))' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.75rem' }}>{upcomingContests.length}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Upcoming Contests</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4" style={{ marginBottom: 0 }}>
          <CheckCircle2 size={40} className="text-primary" style={{ color: 'hsl(var(--success))' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.75rem' }}>{endedContests.length}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Archived & Ended</p>
          </div>
        </div>
      </div>

      {/* Main content header */}
      <div className="flex justify-between items-center" style={{ margin: '2rem 0 1rem 0' }}>
        <h2>Available AI Contests</h2>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Contest
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading contests...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          Failed to fetch contests. Please check if backend is running.
        </div>
      )}

      {!isLoading && contests.length === 0 && (
        <div className="panel text-center" style={{ padding: '3rem 1.5rem' }}>
          <Trophy size={48} className="text-muted" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
          <h3>No Contests Scheduled</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            There are currently no active or scheduled contests on the platform.
          </p>
        </div>
      )}

      {/* Group listings */}
      {!isLoading && contests.length > 0 && (
        <div className="flex flex-col gap-6">
          {/* Active Contests */}
          {activeContests.length > 0 && (
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '1rem 1.5rem', marginBottom: 0, backgroundColor: 'hsla(var(--success-bg), 0.3)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} /> Running Now
                </h3>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 0 }}>
                <table className="oj-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Policy</th>
                      <th>Timeline</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeContests.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{c.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.slug}</div>
                        </td>
                        <td>
                          <span className="badge badge-info">{c.entry_policy}</span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                          <div>Start: {new Date(c.start_time).toLocaleString()}</div>
                          <div>End: {new Date(c.end_time).toLocaleString()}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/contests/${c.id}`} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            Enter Phase
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upcoming Contests */}
          {upcomingContests.length > 0 && (
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '1rem 1.5rem', marginBottom: 0, backgroundColor: 'hsla(var(--warning-bg), 0.3)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'hsl(var(--warning))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} /> Upcoming
                </h3>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 0 }}>
                <table className="oj-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Policy</th>
                      <th>Start Time</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingContests.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td>
                          <span className="badge badge-info">{c.entry_policy}</span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                          {new Date(c.start_time).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/contests/${c.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            View Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ended Contests */}
          {endedContests.length > 0 && (
            <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="panel-header" style={{ padding: '1rem 1.5rem', marginBottom: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> Past & Finished
                </h3>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 0 }}>
                <table className="oj-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Policy</th>
                      <th>End Date</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endedContests.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{c.title}</td>
                        <td>
                          <span className="badge badge-info" style={{ opacity: 0.7 }}>{c.entry_policy}</span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(c.end_time).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/contests/${c.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            Standings
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Draft Contests (Admin only) */}
          {isAdmin && draftContests.length > 0 && (
            <div className="panel" style={{ padding: 0, overflow: 'hidden', borderStyle: 'dashed' }}>
              <div className="panel-header" style={{ padding: '1rem 1.5rem', marginBottom: 0, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                  Drafts (Visible only to Admin)
                </h3>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none', marginBottom: 0 }}>
                <table className="oj-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Policy</th>
                      <th>Start Target</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftContests.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td>
                          <span className="badge badge-info">{c.entry_policy}</span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                          {new Date(c.start_time).toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/contests/${c.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            Setup Panel
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--panel)', marginBottom: 0 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Create New Contest</h3>
            {formError && (
              <div className="alert alert-danger flex items-center gap-2">
                <AlertCircle size={18} />
                <div>{formError}</div>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  required
                  placeholder="e.g. AI Driving Agent Challenge"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug (URL friendly) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="e.g. ai-driving-challenge"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contest goals, policies..."
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Participation Policy</label>
                <select
                  className="form-input"
                  value={entryPolicy}
                  onChange={(e: any) => setEntryPolicy(e.target.value)}
                >
                  <option value="individual">Individual Only</option>
                  <option value="team">Team Only</option>
                  <option value="both">Both Allowed</option>
                </select>
              </div>

              <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createContestMutation.isPending}>
                  {createContestMutation.isPending ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
