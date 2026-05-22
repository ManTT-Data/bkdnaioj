import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Contest, type PhaseDef, type ContestEntry, type EntryMember, type Team, type Announcement, type Task, type Phase } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { User, Users, Lock, Unlock, Settings, ArrowLeft, CheckCircle2, AlertCircle, Volume2, Plus, ArrowRight, Loader2 } from 'lucide-react';

export const ContestDetailPage: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const { user, isAdmin, isJury } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [registerError, setRegisterError] = useState<string | null>(null);

  // Queries
  const { data: contest, isLoading: loadingContest, error: contestError } = useQuery<Contest>({
    queryKey: ['contest', contestId],
    queryFn: () => api.getContest(contestId!),
    enabled: !!contestId,
  });

  const { data: phaseDefs = [], isLoading: loadingPhaseDefs } = useQuery<PhaseDef[]>({
    queryKey: ['phaseDefs', contestId],
    queryFn: () => api.getPhaseDefs(contestId!),
    enabled: !!contestId,
  });

  const { data: entries = [], isLoading: loadingEntries } = useQuery<ContestEntry[]>({
    queryKey: ['entries', contestId],
    queryFn: () => api.getEntries(contestId!),
    enabled: !!contestId && !!user,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', contestId],
    queryFn: () => api.getTasks(contestId!),
    enabled: !!contestId,
  });

  const firstTaskId = tasks[0]?.id;

  const { data: firstTaskPhases = [] } = useQuery<Phase[]>({
    queryKey: ['taskPhases', contestId, 'first', firstTaskId],
    queryFn: () => api.getPhasesByTask(firstTaskId!),
    enabled: !!firstTaskId,
  });

  // Load user's teams
  const { data: myTeams = [], isLoading: loadingMyTeams } = useQuery<Team[]>({
    queryKey: ['myTeams'],
    queryFn: () => api.getMyTeams(),
    enabled: !!user,
  });

  // Check user registration status
  const userEntry = entries.find(
    e => e.user_id === user?.id || 
         e.registered_by === user?.id || 
         (e.team_id && myTeams.some(t => t.id === e.team_id))
  );
  const isRegistered = !!userEntry;
  const isApproved = userEntry?.status === 'approved' || userEntry?.status === 'active' || userEntry?.status === 'finished';

  // Load announcements
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery<Announcement[]>({
    queryKey: ['announcements', contestId],
    queryFn: () => api.getAnnouncements(contestId!),
    enabled: !!contestId,
  });

  // Registration UI Form State
  const [selectedRegType, setSelectedRegType] = useState<'individual' | 'team'>('individual');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [showCreateTeamInline, setShowCreateTeamInline] = useState(false);
  const [inlineTeamName, setInlineTeamName] = useState('');
  const [inlineTeamSlug, setInlineTeamSlug] = useState('');

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) => api.createTeam(payload),
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      setSelectedTeamId(newTeam.id);
      setShowCreateTeamInline(false);
      setInlineTeamName('');
      setInlineTeamSlug('');
      setCustomDisplayName(newTeam.name);
      setRegisterError(null);
    },
    onError: (err: any) => {
      setRegisterError(err?.response?.data?.message || 'Failed to create team.');
    }
  });

  // Register mutation with full payload
  const registerMutation = useMutation({
    mutationFn: (payload: {
      entry_type: 'individual' | 'team';
      entry_mode: 'official' | 'virtual' | 'practice';
      user_id?: string | null;
      team_id?: string | null;
      display_name: string;
    }) => api.createEntry(contestId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', contestId] });
      setRegisterError(null);
    },
    onError: (err: any) => {
      setRegisterError(err?.response?.data?.message || 'Failed to register.');
    },
  });

  const [inviteUserId, setInviteUserId] = useState('');
  const [lineupError, setLineupError] = useState<string | null>(null);

  const { data: lineupMembers = [], refetch: refetchLineupMembers } = useQuery<EntryMember[]>({
    queryKey: ['lineupMembers', userEntry?.id],
    queryFn: () => api.getEntryMembers(userEntry!.id),
    enabled: !!userEntry && userEntry.entry_type === 'team',
  });

  const addLineupMemberMutation = useMutation({
    mutationFn: (userId: string) => api.addEntryMember(userEntry!.id, { user_id: userId, role: 'member' }),
    onSuccess: () => {
      setInviteUserId('');
      setLineupError(null);
      refetchLineupMembers();
    },
    onError: (err: any) => {
      setLineupError(err?.response?.data?.message || 'Failed to add lineup member.');
    }
  });

  const removeLineupMemberMutation = useMutation({
    mutationFn: (userId: string) => api.removeEntryMember(userEntry!.id, userId),
    onSuccess: () => {
      setLineupError(null);
      refetchLineupMembers();
    },
    onError: (err: any) => {
      setLineupError(err?.response?.data?.message || 'Failed to remove lineup member.');
    }
  });

  if (loadingContest || loadingPhaseDefs || loadingEntries || loadingMyTeams || loadingAnnouncements) {
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: '300px' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading contest details...</p>
      </div>
    );
  }

  if (contestError || !contest) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-danger">
          Contest not found or you do not have permission to view it.
        </div>
        <Link to="/" className="btn btn-secondary flex items-center gap-2" style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} /> Back to contests
        </Link>
      </div>
    );
  }

  const handleRegister = () => {
    if (!user) return;
    setRegisterError(null);

    const displayName = customDisplayName.trim();

    if (selectedRegType === 'individual') {
      registerMutation.mutate({
        entry_type: 'individual',
        entry_mode: 'official',
        user_id: user.id,
        display_name: displayName || user.full_name,
      });
    } else {
      if (!selectedTeamId) {
        setRegisterError('Please select or create a team.');
        return;
      }
      const team = myTeams.find(t => t.id === selectedTeamId);
      registerMutation.mutate({
        entry_type: 'team',
        entry_mode: 'official',
        team_id: selectedTeamId,
        display_name: displayName || team?.name || 'Team',
      });
    }
  };

  const getPhaseStatus = (def: PhaseDef) => {
    // Standard phases open/close check
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);

    // If contest hasn't started, phases are locked
    if (now < start) {
      return { status: 'locked', label: 'Locked (Contest hasn\'t started)' };
    }

    // Check if there is a concrete phase for this PhaseDef on the first task
    const concretePhase = firstTaskPhases.find(p => p.contest_phase_def_id === def.id);
    let phaseStart: Date;
    let phaseEnd: Date;

    if (concretePhase) {
      phaseStart = new Date(concretePhase.open_time);
      phaseEnd = new Date(concretePhase.close_time);
    } else {
      // Fallback: 1/4 of total time
      const duration = end.getTime() - start.getTime();
      const phaseIndex = def.sort_order - 1; // 0, 1, 2, 3
      phaseStart = new Date(start.getTime() + (duration / 4) * phaseIndex);
      phaseEnd = new Date(start.getTime() + (duration / 4) * (phaseIndex + 1));
    }

    if (now < phaseStart) {
      return { status: 'locked', label: `Opens at ${phaseStart.toLocaleString()}` };
    }
    if (now >= phaseStart && now <= phaseEnd) {
      return { status: 'active', label: `Active (Closes at ${phaseEnd.toLocaleString()})` };
    }
    return { status: 'ended', label: `Ended at ${phaseEnd.toLocaleString()}` };
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn btn-secondary flex items-center gap-2" style={{ width: 'fit-content', padding: '0.4rem 0.8rem', marginBottom: '1rem' }}>
          <ArrowLeft size={14} /> Back to List
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>{contest.title}</h1>
            <p className="font-mono text-muted" style={{ fontSize: '0.85rem' }}>ID: {contest.id} | Slug: {contest.slug}</p>
          </div>
          {(isAdmin || isJury) && (
            <Link to={`/admin/contests/${contest.id}/setup`} className="btn btn-secondary flex items-center gap-2">
              <Settings size={16} /> Admin Setup Panel
            </Link>
          )}
        </div>
      </div>

      <div className="grid-3-1">
        {/* Left Column: Phases list */}
        <div>
          <div className="panel" style={{ padding: '1rem 1.5rem', marginBottom: '1rem', backgroundColor: '#fcfcfc' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Contest Phases</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              The contest consists of 4 distinct test phases. You must register to participate.
            </p>
          </div>

          <div className="grid-2">
            {phaseDefs.map(def => {
              const info = getPhaseStatus(def);
              const isLocked = info.status === 'locked' && !(isAdmin || isJury);

              return (
                <div key={def.id} className="panel" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: info.status === 'active' ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  boxShadow: info.status === 'active' ? '0 0 8px hsla(var(--primary), 0.1)' : 'var(--shadow-sm)',
                  opacity: isLocked ? 0.75 : 1
                }}>
                  <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', margin: 0, textTransform: 'capitalize' }}>
                        {def.title.replace('_', ' ')}
                      </h3>
                      {isLocked ? <Lock size={16} className="text-muted" /> : <Unlock size={16} style={{ color: 'hsl(var(--success))' }} />}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {info.label}
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
                    {isLocked ? (
                      <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                        Locked
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (isApproved || isAdmin || isJury) {
                            navigate(`/contests/${contest.id}/phases/${def.key}`);
                          } else {
                            setRegisterError('You must register and be approved by the jury to enter.');
                          }
                        }}
                        className={`btn ${info.status === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ width: '100%' }}
                      >
                        Enter Phase Hub
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Latest Announcements */}
          <div className="panel" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <Volume2 size={18} /> Latest Announcements
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {announcements.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No announcements from organizers yet.</p>
              ) : (
                [...announcements]
                  .sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .slice(0, 5) // Show top 5 latest
                  .map(ann => (
                    <div
                      key={ann.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        border: ann.is_pinned ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                        backgroundColor: ann.is_pinned ? 'hsla(var(--primary), 0.02)' : 'var(--background)'
                      }}
                    >
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {ann.is_pinned && <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>PINNED</span>}
                          {ann.title}
                        </span>
                        <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', margin: 0, whiteSpace: 'pre-line', lineHeight: '1.4', color: 'var(--text)' }}>
                        {ann.content}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Registration & Info */}
        <div className="flex flex-col gap-4">
          {/* Registration / Admin Card */}
          {(isAdmin || isJury) ? (
            <div className="panel" style={{ border: '1px solid hsl(var(--warning))', backgroundColor: 'hsla(var(--warning), 0.02)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.1rem', color: 'hsl(var(--warning-dark))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} /> Administrative Access
              </h3>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text)' }} className="flex flex-col gap-3">
                <p>
                  You are logged in as <strong>{user?.role}</strong>. You have unrestricted access to all phases and tasks.
                </p>
                <div style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', backgroundColor: 'var(--background)', border: '1px solid hsl(var(--border))' }}>
                  <strong>Role:</strong> {user?.role.toUpperCase()} <br />
                  <strong>User:</strong> {user?.full_name}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Contest registration is not required for organizers.
                </p>
                <Link to={`/admin/contests/${contest.id}/setup`} className="btn btn-secondary flex items-center justify-center gap-2" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <Settings size={16} /> Admin Setup Panel
                </Link>
              </div>
            </div>
          ) : (
            <div className="panel">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Participation</h3>

              {registerError && (
                <div className="alert alert-danger flex items-center gap-2" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
                  <AlertCircle size={14} />
                  <div>{registerError}</div>
                </div>
              )}

              {!user ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Please login or register to participate in this contest.
                  </p>
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>Login</Link>
                </div>
              ) : isRegistered ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-success" style={{ color: 'hsl(var(--success))', fontWeight: 600 }}>
                    <CheckCircle2 size={20} />
                    <span>Registered</span>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <div><strong>Mode:</strong> {userEntry.entry_type}</div>
                    <div><strong>Status:</strong> <span className={`badge ${userEntry.status === 'approved' || userEntry.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{userEntry.status}</span></div>
                  </div>
                  {userEntry.status === 'pending' && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Your registration is pending approval by the judges.
                    </p>
                  )}
                  {userEntry.entry_type === 'team' && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Team Lineup Members</h4>
                      
                      {lineupError && (
                        <div className="alert alert-danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                          {lineupError}
                        </div>
                      )}

                      {lineupMembers.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No other members in team yet.</p>
                      ) : (
                        <ul style={{ paddingLeft: 0, listStyle: 'none', marginBottom: '1rem' }} className="flex flex-col gap-1">
                          {lineupMembers.map(m => (
                            <li key={m.user_id} className="flex justify-between items-center" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                              <div className="font-mono" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {m.user_id}
                              </div>
                              <span className="badge badge-secondary" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                {m.role}
                              </span>
                              <button
                                onClick={() => removeLineupMemberMutation.mutate(m.user_id)}
                                className="text-danger"
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                                disabled={removeLineupMemberMutation.isPending}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex gap-1" style={{ marginTop: '0.5rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Teammate User UUID"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                          value={inviteUserId}
                          onChange={(e) => setInviteUserId(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            if (inviteUserId.trim()) {
                              addLineupMemberMutation.mutate(inviteUserId.trim());
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                          disabled={addLineupMemberMutation.isPending}
                        >
                          Add Member
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2" style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                    {contest.entry_policy !== 'team' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegType('individual');
                          setCustomDisplayName('');
                        }}
                        className={`btn ${selectedRegType === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <User size={14} style={{ marginRight: '0.25rem' }} /> Individual
                      </button>
                    )}
                    {contest.entry_policy !== 'individual' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRegType('team');
                          setCustomDisplayName('');
                          if (myTeams.length > 0 && !selectedTeamId) {
                            setSelectedTeamId(myTeams[0].id);
                          }
                        }}
                        className={`btn ${selectedRegType === 'team' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        <Users size={14} style={{ marginRight: '0.25rem' }} /> Team
                      </button>
                    )}
                  </div>

                  {selectedRegType === 'individual' ? (
                    <div className="flex flex-col gap-2">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Display Name</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        placeholder={user.full_name}
                        value={customDisplayName}
                        onChange={(e) => setCustomDisplayName(e.target.value)}
                      />
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                        Leave empty to use your name: <strong>{user.full_name}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {showCreateTeamInline ? (
                        <div className="panel" style={{ padding: '0.75rem', backgroundColor: '#fcfcfc', border: '1px dashed hsl(var(--border))' }}>
                          <h4 style={{ fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>Create New Team</h4>
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                              placeholder="Team Name"
                              value={inlineTeamName}
                              onChange={(e) => {
                                setInlineTeamName(e.target.value);
                                const slug = e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, '-')
                                  .replace(/(^-|-$)/g, '');
                                setInlineTeamSlug(slug);
                              }}
                            />
                            <input
                              type="text"
                              className="form-input"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                              placeholder="team-slug"
                              value={inlineTeamSlug}
                              onChange={(e) => setInlineTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            />
                            <div className="flex gap-1 justify-end">
                              <button
                                type="button"
                                onClick={() => setShowCreateTeamInline(false)}
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (inlineTeamName.trim() && inlineTeamSlug.trim()) {
                                    createTeamMutation.mutate({
                                      name: inlineTeamName.trim(),
                                      slug: inlineTeamSlug.trim()
                                    });
                                  }
                                }}
                                className="btn btn-primary"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                disabled={createTeamMutation.isPending}
                              >
                                {createTeamMutation.isPending ? 'Creating...' : 'Create & Select'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Team</label>
                          {myTeams.length === 0 ? (
                            <div style={{ padding: '0.5rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', backgroundColor: 'var(--background)' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                                You don't have any teams yet.
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowCreateTeamInline(true)}
                                className="btn btn-secondary flex items-center gap-1"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', width: '100%', justifyContent: 'center' }}
                              >
                                <Plus size={12} /> Create Team Inline
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <select
                                className="form-input"
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', height: 'auto' }}
                                value={selectedTeamId}
                                onChange={(e) => {
                                  setSelectedTeamId(e.target.value);
                                  const team = myTeams.find(t => t.id === e.target.value);
                                  setCustomDisplayName(team ? team.name : '');
                                }}
                              >
                                <option value="" disabled>-- Choose a Team --</option>
                                {myTeams.map(t => (
                                  <option key={t.id} value={t.id}>{t.name} (/{t.slug})</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => setShowCreateTeamInline(true)}
                                className="btn btn-secondary flex items-center justify-center gap-1"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', alignSelf: 'flex-end' }}
                              >
                                <Plus size={12} /> Or Create New Team
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Display Name</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                          placeholder="e.g. Dream Team"
                          value={customDisplayName}
                          onChange={(e) => setCustomDisplayName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRegister}
                    className="btn btn-primary flex items-center justify-center gap-2"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    disabled={registerMutation.isPending || showCreateTeamInline}
                  >
                    {registerMutation.isPending ? <Loader2 className="spinner" size={16} /> : <ArrowRight size={16} />}
                    Confirm Registration
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Details Card */}
          <div className="panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Contest Details</h3>
            <div className="flex flex-col gap-2 font-mono" style={{ fontSize: '0.8rem' }}>
              <div><strong>Start:</strong> {new Date(contest.start_time).toLocaleString()}</div>
              <div><strong>End:</strong> {new Date(contest.end_time).toLocaleString()}</div>
              <div><strong>Policy:</strong> {contest.entry_policy}</div>
              <div><strong>Visibility:</strong> {contest.visibility}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
