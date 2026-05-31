import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Team, type TeamMember } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { Users, UserPlus, Trash2, Plus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const { user, isAdmin, isJury } = useAuth();

  if (isAdmin || isJury) {
    return <Navigate to="/" replace />;
  }
  const queryClient = useQueryClient();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSlug, setNewTeamSlug] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Queries
  const { data: myTeams = [], isLoading: loadingTeams, error: teamsError } = useQuery<Team[]>({
    queryKey: ['myTeams'],
    queryFn: () => api.getMyTeams(),
    enabled: !!user,
  });

  const selectedTeam = myTeams.find(t => t.id === selectedTeamId);

  const { data: teamMembers = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery<TeamMember[]>({
    queryKey: ['teamMembers', selectedTeamId],
    queryFn: () => api.getTeamMembers(selectedTeamId!),
    enabled: !!selectedTeamId,
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) => api.createTeam(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myTeams'] });
      setNewTeamName('');
      setNewTeamSlug('');
      setSelectedTeamId(data.id);
      setActionSuccess(`Team "${data.name}" created successfully!`);
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Failed to create team. Ensure the slug is unique.');
      setActionSuccess(null);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload: { user_id: string; role: 'manager' | 'member' }) =>
      api.addTeamMember(selectedTeamId!, payload),
    onSuccess: () => {
      setInviteUserId('');
      refetchMembers();
      setActionSuccess('Teammate invited successfully!');
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Failed to add member. Please verify the User UUID.');
      setActionSuccess(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.removeTeamMember(selectedTeamId!, userId),
    onSuccess: () => {
      refetchMembers();
      setActionSuccess('Teammate removed successfully.');
      setActionError(null);
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err?.response?.data?.message || 'Failed to remove member.');
      setActionSuccess(null);
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTeamName(val);
    // Simple auto slug generator
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setNewTeamSlug(slug);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamSlug.trim()) {
      setActionError('Both Name and Slug are required.');
      return;
    }
    createTeamMutation.mutate({
      name: newTeamName.trim(),
      slug: newTeamSlug.trim(),
    });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUserId.trim()) return;
    addMemberMutation.mutate({
      user_id: inviteUserId.trim(),
      role: 'member',
    });
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Team Management</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Create teams, invite members, and manage your lineups for team-based contest events.
        </p>
      </div>

      {actionError && (
        <div className="alert alert-danger flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={16} />
          <div>{actionError}</div>
        </div>
      )}

      {actionSuccess && (
        <div className="alert alert-success flex items-center gap-2" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={16} />
          <div>{actionSuccess}</div>
        </div>
      )}

      <div className="grid-1-3">
        {/* Left Panel: Teams List & Creation */}
        <div className="flex flex-col gap-4">
          <div className="panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              My Teams
            </h3>

            {loadingTeams ? (
              <div className="flex justify-center" style={{ padding: '1.5rem 0' }}>
                <Loader2 className="spinner" size={24} />
              </div>
            ) : teamsError ? (
              <p style={{ color: 'var(--text-danger)', fontSize: '0.85rem' }}>Failed to load teams.</p>
            ) : myTeams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                You don't belong to any teams yet. Create one on the right or below!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {myTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setActionError(null);
                      setActionSuccess(null);
                    }}
                    className={`btn text-left flex justify-between items-center`}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      justifyContent: 'space-between',
                      border: selectedTeamId === team.id ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                      backgroundColor: selectedTeamId === team.id ? 'hsla(var(--primary), 0.03)' : 'var(--card)',
                      color: 'var(--text)',
                      fontWeight: selectedTeamId === team.id ? 600 : 400,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem' }}>{team.name}</div>
                      <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                        /{team.slug}
                      </div>
                    </div>
                    {team.owner_id === user?.id && (
                      <span className="badge badge-primary" style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>
                        Owner
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create Team Form */}
          <div className="panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} />
              New Team
            </h3>

            <form onSubmit={handleCreateTeam} className="flex flex-col gap-3">
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Team Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Anti Gravity"
                  value={newTeamName}
                  onChange={handleNameChange}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Slug (unique URL name)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. anti-gravity"
                  value={newTeamSlug}
                  onChange={(e) => setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary flex items-center justify-center gap-2"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? <Loader2 className="spinner" size={16} /> : <Plus size={16} />}
                Create Team
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Selected Team Members */}
        <div>
          {selectedTeam ? (
            <div className="panel">
              <div className="flex justify-between items-center" style={{ borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{selectedTeam.name}</h2>
                  <p className="font-mono text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                    Slug: /{selectedTeam.slug} | ID: {selectedTeam.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                    {teamMembers.length} member{teamMembers.length !== 1 && 's'}
                  </span>
                </div>
              </div>

              {/* Members Table */}
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Teammates</h3>
              {loadingMembers ? (
                <div className="flex justify-center" style={{ padding: '2rem 0' }}>
                  <Loader2 className="spinner" size={24} />
                </div>
              ) : (
                <div className="table-container" style={{ marginBottom: '2rem' }}>
                  <table className="oj-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined At</th>
                        {selectedTeam.owner_id === user?.id && <th style={{ width: '80px', textAlign: 'center' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.user_id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{member.full_name || 'Pending User'}</div>
                            <div className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                              UUID: {member.user_id}
                            </div>
                          </td>
                          <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                            {member.email}
                          </td>
                          <td>
                            <span
                              className={`badge ${member.role === 'manager' ? 'badge-primary' : 'badge-secondary'}`}
                              style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}
                            >
                              {member.role}
                            </span>
                          </td>
                          <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                            {new Date(member.joined_at).toLocaleDateString()}
                          </td>
                          {selectedTeam.owner_id === user?.id && (
                            <td style={{ textAlign: 'center' }}>
                              {member.user_id === user.id ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  Self
                                </span>
                              ) : (
                                <button
                                  onClick={() => removeMemberMutation.mutate(member.user_id)}
                                  className="text-danger flex items-center gap-1"
                                  style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    margin: '0 auto',
                                    padding: '0.2rem',
                                  }}
                                  title="Remove Member"
                                  disabled={removeMemberMutation.isPending}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Member Form (Only visible to managers/owners) */}
              {selectedTeam.owner_id === user?.id && (
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={18} />
                    Invite Teammate
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Add another participant to your team using their account's User UUID.
                  </p>

                  <form onSubmit={handleAddMember} className="flex gap-2" style={{ maxWidth: '600px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                      value={inviteUserId}
                      onChange={(e) => setInviteUserId(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary flex items-center gap-2"
                      disabled={addMemberMutation.isPending}
                    >
                      {addMemberMutation.isPending ? <Loader2 className="spinner" size={16} /> : <UserPlus size={16} />}
                      Invite
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div
              className="panel flex flex-col items-center justify-center text-center"
              style={{ minHeight: '350px', borderStyle: 'dashed', color: 'var(--text-muted)' }}
            >
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>No Team Selected</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto' }}>
                Select a team from the left menu to view members, invite new teammates, or manage roles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
