import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api, API_BASE_URL, type Contest, type PhaseDef, type Task, type Phase, type ContestEntry, type Submission, type LeaderboardRow, type Clarification, type Announcement, type Ticket, type Team } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import {
  FileText, UploadCloud, Play, RefreshCw, ArrowLeft, Star, Volume2, ShieldAlert, Lock, Unlock, Settings
} from 'lucide-react';

const formatParticipantName = (row: { display_name: string; entry_type: string; user_emails?: string[] }) => {
  if (row.entry_type === 'individual') {
    if (row.user_emails && row.user_emails.length > 0) {
      const email = row.user_emails[0];
      return email.split('@')[0];
    }
    return row.display_name.includes('@') ? row.display_name.split('@')[0] : row.display_name;
  } else if (row.entry_type === 'team') {
    if (row.user_emails && row.user_emails.length > 0) {
      const members = row.user_emails.map(email => email.split('@')[0]).join(', ');
      return `${row.display_name} (${members})`;
    }
    return row.display_name;
  }
  return row.display_name;
};

const artifactContentType = (file: File) => file.type || 'application/octet-stream';

const contractForPhase = (task: Task | undefined, isFinal: boolean) => {
  const schema = task?.submission_schema || {};
  return isFinal ? schema.final : schema.non_final;
};

export const PhaseHubPage: React.FC = () => {
  const { contestId, phaseKey } = useParams<{ contestId: string, phaseKey: string }>();
  const { user, isAdmin, isJury } = useAuth();
  const queryClient = useQueryClient();

  const getPdfUrl = (url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = API_BASE_URL.endsWith('/api/v1') ? API_BASE_URL.slice(0, -7) : API_BASE_URL;
    return `${apiBase}${url}`;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'submissions' | 'standings' | 'clarifications' | 'tickets'>(() => {
    const validTabs = ['overview', 'problems', 'submissions', 'standings', 'clarifications', 'tickets'];
    return (tabParam && validTabs.includes(tabParam)) ? (tabParam as any) : 'overview';
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Sync activeTab state with URL parameter if it changes
  useEffect(() => {
    const validTabs = ['overview', 'problems', 'submissions', 'standings', 'clarifications', 'tickets'];
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const nextParams: Record<string, string> = { tab };
    const taskIdParam = searchParams.get('taskId');
    if (tab === 'problems' && selectedTaskId) {
      nextParams.taskId = selectedTaskId;
    } else if (tab === 'problems' && taskIdParam) {
      nextParams.taskId = taskIdParam;
    }
    setSearchParams(nextParams);
  };

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSearchParams({ tab: activeTab, taskId });
  };

  // Standings Mode
  const [standingsMode, setStandingsMode] = useState<'task' | 'overall'>('task');
  const [leaderboardMode, setLeaderboardMode] = useState<'official' | 'virtual' | 'practice'>(() => {
    const m = searchParams.get('mode');
    return (m === 'virtual' || m === 'practice') ? m : 'official';
  });

  // Support Ticket Form State
  const [ticketCategory, setTicketCategory] = useState<'upload' | 'judge' | 'score' | 'system'>('system');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSubmissionId, setTicketSubmissionId] = useState('');
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'initiating' | 'uploading' | 'completing' | 'done' | 'failed'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Q&A Form State
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaTaskId, setQaTaskId] = useState<string>('');
  const [qaError, setQaError] = useState<string | null>(null);

  // Clarification Answer Form State
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [qaAnswer, setQaAnswer] = useState('');
  const [isPublicAnswer, setIsPublicAnswer] = useState(true);

  // Queries
  const { data: contest } = useQuery<Contest>({
    queryKey: ['contest', contestId],
    queryFn: () => api.getContest(contestId!),
    enabled: !!contestId,
  });

  const { data: phaseDefs = [] } = useQuery<PhaseDef[]>({
    queryKey: ['phaseDefs', contestId],
    queryFn: () => api.getPhaseDefs(contestId!),
    enabled: !!contestId,
  });

  const { data: entries = [] } = useQuery<ContestEntry[]>({
    queryKey: ['entries', contestId],
    queryFn: () => api.getEntries(contestId!),
    enabled: !!contestId && !!user,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', contestId],
    queryFn: () => api.getTasks(contestId!),
    enabled: !!contestId,
  });

  const currentDef = phaseDefs.find(d => d.key === phaseKey);

  // Load user's teams
  const { data: myTeams = [] } = useQuery<Team[]>({
    queryKey: ['myTeams'],
    queryFn: () => api.getMyTeams(),
    enabled: !!user,
  });

  const userEntries = entries.filter(
    e => e.user_id === user?.id || 
         e.registered_by === user?.id || 
         (e.team_id && myTeams.some(t => t.id === e.team_id))
  );

  const activeMode = searchParams.get('mode') || 'official';
  const userEntry = userEntries.find(e => e.entry_mode === activeMode) || userEntries[0];

  // Helper to compute active phase times based on participation mode
  const getPhaseTimes = (phase: Phase | null) => {
    if (!phase) return null;
    let openTime = new Date(phase.open_time);
    let closeTime = new Date(phase.close_time);
    let modeText = 'Official Timeline';

    if (userEntry?.entry_mode === 'virtual' && userEntry.start_at && contest) {
      const contestStart = new Date(contest.start_time).getTime();
      const phaseOpen = new Date(phase.open_time).getTime();
      const phaseClose = new Date(phase.close_time).getTime();
      const phaseOpenOffset = phaseOpen - contestStart;
      const phaseCloseOffset = phaseClose - contestStart;

      const virtualStartAt = new Date(userEntry.start_at).getTime();
      openTime = new Date(virtualStartAt + phaseOpenOffset);
      closeTime = new Date(virtualStartAt + phaseCloseOffset);
      modeText = 'Virtual Timeline';
    } else if (userEntry?.entry_mode === 'practice') {
      modeText = 'Practice Timeline';
    }

    const now = new Date();
    const isLocked = now < openTime;
    const isEnded = userEntry?.entry_mode === 'practice' ? false : now > closeTime;

    return { openTime, closeTime, isLocked, isEnded, modeText };
  };

  // Fetch all phases for the tasks to match the current PhaseDef ID
  const { data: taskPhasesMap = {} } = useQuery<{ [taskId: string]: Phase }>({
    queryKey: ['taskPhases', contestId, currentDef?.id],
    queryFn: async () => {
      const mapping: { [taskId: string]: Phase } = {};
      if (!currentDef) return mapping;
      for (const t of tasks) {
        try {
          const phasesList = await api.getPhasesByTask(t.id);
          const matched = phasesList.find(p => p.contest_phase_def_id === currentDef.id);
          if (matched) {
            mapping[t.id] = matched;
          }
        } catch (e) {
          console.error(`Failed to load phase for task ${t.id}`, e);
        }
      }
      return mapping;
    },
    enabled: tasks.length > 0 && !!currentDef,
  });

  // Query submissions for the user entry
  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ['submissions', userEntry?.id],
    queryFn: () => api.getSubmissionsByEntry(userEntry!.id),
    enabled: !!userEntry,
    refetchInterval: (query) => {
      const data = query.state.data as Submission[] | undefined;
      const hasRunning = data?.some(s => ['uploaded', 'validating', 'queued', 'running'].includes(s.status));
      return hasRunning ? 3000 : false; // Poll every 3 seconds if active submissions
    }
  });

  // Selected task phase details
  const activePhase = selectedTaskId ? taskPhasesMap[selectedTaskId] : null;

  // Query standings
  const { data: leaderboard = [], refetch: refetchLeaderboard } = useQuery<LeaderboardRow[]>({
    queryKey: ['leaderboard', activePhase?.id, leaderboardMode],
    queryFn: () => api.getTaskPhaseLeaderboard(activePhase!.id, leaderboardMode),
    enabled: !!activePhase && activeTab === 'standings',
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Query clarifications
  const { data: clarifications = [], refetch: refetchClarifications } = useQuery<Clarification[]>({
    queryKey: ['clarifications', contestId],
    queryFn: () => api.getClarifications(contestId!),
    enabled: !!contestId && activeTab === 'clarifications',
  });

  // Query overall phase standings
  const { data: overallLeaderboard = [], refetch: refetchOverallLeaderboard } = useQuery<LeaderboardRow[]>({
    queryKey: ['overallLeaderboard', contestId, currentDef?.id, leaderboardMode],
    queryFn: () => api.getContestPhaseLeaderboard(contestId!, currentDef!.id, leaderboardMode),
    enabled: !!contestId && !!currentDef && activeTab === 'standings' && standingsMode === 'overall',
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Query contestant tickets
  const { data: myTickets = [], refetch: refetchMyTickets } = useQuery<Ticket[]>({
    queryKey: ['myTickets'],
    queryFn: () => api.listMyTickets(),
    enabled: !!user && activeTab === 'tickets',
  });

  // Query announcements
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements', contestId],
    queryFn: () => api.getAnnouncements(contestId!),
    enabled: !!contestId,
  });

  // Set default selected task (checking URL query parameters first)
  useEffect(() => {
    if (tasks.length > 0) {
      const taskIdParam = searchParams.get('taskId');
      if (taskIdParam && tasks.some(t => t.id === taskIdParam)) {
        if (selectedTaskId !== taskIdParam) {
          setSelectedTaskId(taskIdParam);
        }
      } else if (!selectedTaskId) {
        setSelectedTaskId(tasks[0].id);
      }
    }
  }, [tasks, selectedTaskId, searchParams]);

  // Mutations
  const submitPredictionMutation = useMutation({
    mutationFn: async ({ file, taskId, phaseId }: { file: File, taskId: string, phaseId: string }) => {
      if (!userEntry) throw new Error('No active entry');
      setUploadProgress('initiating');

      const uploadFilename = file.name;
      const contentType = artifactContentType(file);

      // 1. Initiate
      const initRes = await api.initiateSubmission(userEntry.id, {
        task_id: taskId,
        phase_id: phaseId,
        files: [{
          filename: uploadFilename,
          content_type: contentType,
          size_bytes: file.size,
        }]
      });

      const uploadInfo = initRes.uploads[0];
      setUploadProgress('uploading');

      // 2. Upload to S3
      await axios.put(uploadInfo.put_url, file, {
        headers: {
          'Content-Type': contentType,
        }
      });

      setUploadProgress('completing');

      // 3. Complete
      const completedSub = await api.completeSubmission(initRes.submission_id, {
        files: [{
          filename: uploadFilename,
          object_key: uploadInfo.object_key,
          size_bytes: file.size,
          content_type: contentType,
        }]
      });

      return completedSub;
    },
    onSuccess: () => {
      setUploadProgress('done');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['submissions', userEntry?.id] });
      setTimeout(() => {
        setUploadProgress('idle');
        setActiveTab('submissions'); // Switch to view run queue
      }, 1000);
    },
    onError: (err: any) => {
      console.error(err);
      setUploadProgress('failed');
      setUploadError(err?.response?.data?.message || err?.message || 'File upload or submission failed.');
    }
  });

  const createQaMutation = useMutation({
    mutationFn: (payload: any) => api.createClarification(contestId!, payload, userEntry?.id),
    onSuccess: () => {
      setQaQuestion('');
      setQaTaskId('');
      refetchClarifications();
    },
    onError: (err: any) => {
      setQaError(err?.response?.data?.message || 'Failed to submit clarification.');
    }
  });

  const answerQaMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => api.answerClarification(id, payload),
    onSuccess: () => {
      setAnsweringId(null);
      setQaAnswer('');
      refetchClarifications();
    }
  });

  const markFinalMutation = useMutation({
    mutationFn: (subId: string) => api.markFinalSubmission(subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions', userEntry?.id] });
      refetchLeaderboard();
      refetchOverallLeaderboard();
    }
  });

  const recomputeLeaderboardMutation = useMutation({
    mutationFn: (phaseId: string) => api.recomputeTaskPhaseLeaderboard(phaseId),
    onSuccess: () => {
      refetchLeaderboard();
    }
  });

  const recomputeOverallLeaderboardMutation = useMutation({
    mutationFn: () => api.recomputeContestPhaseLeaderboard(contestId!, currentDef!.id),
    onSuccess: () => {
      refetchOverallLeaderboard();
    }
  });

  const freezePhaseMutation = useMutation({
    mutationFn: (phaseId: string) => api.freezePhase(phaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskPhases', contestId, currentDef?.id] });
      refetchLeaderboard();
    }
  });

  const unfreezePhaseMutation = useMutation({
    mutationFn: (phaseId: string) => api.unfreezePhase(phaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskPhases', contestId, currentDef?.id] });
      refetchLeaderboard();
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: (payload: any) => api.createTicket(payload),
    onSuccess: () => {
      setTicketSubject('');
      setTicketDescription('');
      setTicketSubmissionId('');
      setTicketSuccess('Support ticket submitted successfully!');
      setTicketError(null);
      refetchMyTickets();
      setTimeout(() => setTicketSuccess(null), 3500);
    },
    onError: (err: any) => {
      setTicketError(err?.response?.data?.message || 'Failed to submit support ticket.');
      setTicketSuccess(null);
    }
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTaskId) return;
    if (file.type !== 'application/pdf') {
      alert('Chỉ chấp nhận tệp định dạng PDF.');
      return;
    }
    try {
      setUploadingPdf(true);
      await api.uploadTaskStatement(selectedTaskId, file);
      queryClient.invalidateQueries({ queryKey: ['tasks', contestId] });
      alert('Tải lên đề bài PDF thành công!');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error?.response?.data?.message || 'Không thể tải lên tệp đề bài.');
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const triggerUpload = () => {
    if (!selectedFile || !selectedTaskId || !activePhase) {
      setUploadError('Please select a file first.');
      return;
    }
    submitPredictionMutation.mutate({
      file: selectedFile,
      taskId: selectedTaskId,
      phaseId: activePhase.id
    });
  };

  const handleQaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQaError(null);
    if (!qaQuestion.trim()) return;
    createQaMutation.mutate({
      task_id: qaTaskId || null,
      phase_id: activePhase?.id || null,
      question: qaQuestion,
    });
  };

  const handleAnswerSubmit = (clarificationId: string) => {
    if (!qaAnswer.trim()) return;
    answerQaMutation.mutate({
      id: clarificationId,
      payload: {
        answer: qaAnswer,
        is_public: isPublicAnswer
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded': return <span className="badge badge-info">Uploaded</span>;
      case 'validating': return <span className="badge badge-warning">Validating</span>;
      case 'queued': return <span className="badge badge-warning">Queued</span>;
      case 'running': return <span className="badge badge-info" style={{ backgroundColor: 'hsla(199, 89%, 96%, 1)' }}>Running</span>;
      case 'done': return <span className="badge badge-success">Done</span>;
      case 'failed': return <span className="badge badge-danger">Failed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {/* Contest header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to={`/contests/${contestId}`} className="btn btn-secondary flex items-center gap-2" style={{ width: 'fit-content', padding: '0.4rem 0.8rem', marginBottom: '1rem' }}>
          <ArrowLeft size={14} /> Back to Contest
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ marginBottom: '0.25rem', textTransform: 'capitalize' }}>
              {contest?.title} — {phaseKey?.replace('_', ' ')}
            </h1>
            <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
              Work area for submitted predictions and scoreboard validations.
            </p>
          </div>
        </div>
      </div>

      {/* Participation Mode Banner */}
      {userEntry && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          backgroundColor: userEntry.entry_mode === 'official' ? 'hsla(var(--primary), 0.05)' : userEntry.entry_mode === 'virtual' ? 'hsla(var(--warning), 0.05)' : 'hsla(var(--success), 0.05)',
          border: userEntry.entry_mode === 'official' ? '1px solid hsl(var(--primary))' : userEntry.entry_mode === 'virtual' ? '1px solid hsl(var(--warning))' : '1px solid hsl(var(--success))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem'
        }}>
          <div>
            You are participating in <strong>{userEntry.entry_mode.toUpperCase()} MODE</strong>.
            {userEntry.entry_mode === 'virtual' && userEntry.start_at && userEntry.end_at && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }} className="text-muted">
                (Virtual timer: {new Date(userEntry.start_at).toLocaleString()} to {new Date(userEntry.end_at).toLocaleString()})
              </span>
            )}
            {userEntry.entry_mode === 'practice' && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }} className="text-muted">
                (Practice submissions do not affect official standings rankings)
              </span>
            )}
          </div>
          {userEntries.length > 1 && (
            <div className="flex items-center gap-2">
              <label style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Switch View:</label>
              <select
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', height: 'auto', width: 'fit-content', margin: 0 }}
                value={activeMode}
                onChange={(e) => {
                  setSearchParams({ tab: activeTab, mode: e.target.value });
                  setLeaderboardMode(e.target.value as any);
                }}
              >
                {userEntries.map(e => (
                  <option key={e.id} value={e.entry_mode} style={{ textTransform: 'capitalize' }}>
                    {e.entry_mode} Mode
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tab bar navigation */}
      <div className="tab-bar">
        <div className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
          Overview
        </div>
        <div className={`tab-item ${activeTab === 'problems' ? 'active' : ''}`} onClick={() => handleTabChange('problems')}>
          Tasks & Submit
        </div>
        <div className={`tab-item ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => handleTabChange('submissions')}>
          Submissions
        </div>
        <div className={`tab-item ${activeTab === 'standings' ? 'active' : ''}`} onClick={() => handleTabChange('standings')}>
          Standings
        </div>
        <div className={`tab-item ${activeTab === 'clarifications' ? 'active' : ''}`} onClick={() => handleTabChange('clarifications')}>
          Clarifications
        </div>
        <div className={`tab-item ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => handleTabChange('tickets')}>
          Support Tickets
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Rules and Policies */}
          <div className="panel" style={{ lineHeight: '1.7' }}>
            <h2>Phase Rules & Policy</h2>
            <p>Welcome to the <strong>{phaseKey?.replace('_', ' ')}</strong> phase of {contest?.title}.</p>
            <hr style={{ margin: '1rem 0', borderColor: 'hsl(var(--border))' }} />
            <h3>System Policies</h3>
            <ul>
              <li>Submissions must match the artifact contract defined by each task.</li>
              <li>Each submission is automatically run against the evaluation containers.</li>
              <li>Standings show ranks based on your selected <strong>Final</strong> submission. You can mark any successful run as your final candidate.</li>
              <li>WebSockets/polling updates status in real-time.</li>
            </ul>
          </div>

          {/* Announcements Timeline */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={18} /> Announcements
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
              {announcements.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No announcements yet.</p>
              ) : (
                [...announcements]
                  .sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
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
      )}

      {/* Problems/Tasks Tab */}
      {activeTab === 'problems' && (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          {/* 1. Left Column: Sidebar tasks list */}
          <div className="flex flex-col gap-2" style={{ width: '260px', flexShrink: 0 }}>
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 750 }}>
              Danh sách bài tập
            </h4>
            {tasks.map(t => (
              <button
                key={t.id}
                onClick={() => handleTaskChange(t.id)}
                className={`btn ${selectedTaskId === t.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%', padding: '0.6rem 0.8rem', gap: '0.6rem', border: selectedTaskId === t.id ? 'none' : '1px solid hsl(var(--border))' }}
              >
                <FileText size={16} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  {t.title}
                </span>
              </button>
            ))}
          </div>

          {/* 2. Middle Column: Task Title & PDF Viewer */}
          <div className="panel" style={{ padding: '1.5rem', minHeight: '650px', display: 'flex', flexDirection: 'column', margin: 0, flex: 1 }}>
            {selectedTask ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.35rem', margin: 0, fontWeight: 750, color: 'hsl(var(--text-main))' }}>{selectedTask.title}</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                        {selectedTask.score_label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        Điểm số: {selectedTask.higher_is_better ? 'Càng cao càng tốt' : 'Càng thấp càng tốt'}
                      </span>
                    </div>
                  </div>
                  
                  {/* PDF Upload Button for Organizers */}
                  {(isAdmin || isJury) && (
                    <div style={{ marginLeft: '1rem' }}>
                      <input
                        type="file"
                        ref={pdfInputRef}
                        accept="application/pdf"
                        style={{ display: 'none' }}
                        onChange={handlePdfUpload}
                      />
                      <button
                        onClick={() => pdfInputRef.current?.click()}
                        className="btn btn-secondary flex items-center gap-1.5"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        disabled={uploadingPdf}
                      >
                        <UploadCloud size={14} />
                        {selectedTask.problem_statement_url ? 'Cập nhật PDF' : 'Tải lên PDF'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Task Description Text if provided */}
                {selectedTask.description && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)', fontSize: '0.875rem', color: 'hsl(var(--text-muted))', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ fontWeight: 650, color: 'hsl(var(--text-main))', marginBottom: '0.25rem' }}>Mô tả bài tập:</div>
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                      {selectedTask.description}
                    </div>
                  </div>
                )}

                {/* Dataset URL if provided */}
                {selectedTask.dataset_url && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'hsl(var(--background))', borderRadius: 'var(--radius)', fontSize: '0.875rem', border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontWeight: 650, color: 'hsl(var(--text-main))' }}>Link dữ liệu huấn luyện (Dataset): </span>
                    <a href={selectedTask.dataset_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'hsl(var(--primary))' }}>
                      {selectedTask.dataset_url}
                    </a>
                  </div>
                )}

                {/* PDF Viewer Window */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '520px', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', overflow: 'hidden', backgroundColor: 'hsl(var(--background))', position: 'relative' }}>
                  {uploadingPdf && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                      <div className="spinner" style={{ marginBottom: '0.5rem' }}></div>
                      <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Đang tải lên đề bài...</span>
                    </div>
                  )}

                  {selectedTask.problem_statement_url ? (
                    <iframe
                      src={getPdfUrl(selectedTask.problem_statement_url)}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', minHeight: '550px', flex: 1 }}
                      title="Problem Statement PDF"
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                      <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 650 }}>Chưa có đề bài PDF</h4>
                      <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', maxWidth: '300px' }}>
                        {(isAdmin || isJury) 
                          ? 'Vui lòng nhấn nút "Tải lên PDF" ở góc trên bên phải để cập nhật file đề bài cho thí sinh.' 
                          : 'Ban tổ chức chưa cập nhật tệp đề bài PDF cho bài tập này.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'hsl(var(--text-muted))' }}>
                <p>Vui lòng chọn bài tập từ danh sách bên trái.</p>
              </div>
            )}
          </div>

          {/* 3. Right Column: Submit & Task-specific History */}
          <div className="flex flex-col gap-4" style={{ width: '380px', flexShrink: 0 }}>
            {selectedTask && (
              <div className="panel" style={{ padding: '1.25rem', margin: 0 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 750, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UploadCloud size={18} style={{ color: 'hsl(var(--primary))' }} />
                  Nộp bài giải (Submit)
                </h3>
                
                {activePhase ? (() => {
                  const times = getPhaseTimes(activePhase);
                  if (!times) return null;

                  if (times.isLocked) {
                    return (
                      <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.8rem', padding: '0.75rem' }}>
                        Vòng thi chưa mở. Sẽ mở vào lúc <strong>{times.openTime.toLocaleString()}</strong>.
                      </div>
                    );
                  }

                  if (times.isEnded) {
                    return (
                      <div className="alert alert-danger" style={{ margin: 0, fontSize: '0.8rem', padding: '0.75rem' }}>
                        Thời gian thi đã kết thúc vào lúc <strong>{times.closeTime.toLocaleString()}</strong>. Cổng nộp bài đã đóng.
                      </div>
                    );
                  }

                  if (!userEntry) {
                    return (
                      <div className="alert alert-warning" style={{ margin: 0, fontSize: '0.8rem', padding: '0.75rem', lineHeight: '1.4' }}>
                        <strong>Chưa đăng ký:</strong> Bạn chưa đăng ký tham gia hoặc không thuộc đội thi hợp lệ. Vui lòng đăng ký tham gia trước khi nộp bài.
                      </div>
                    );
                  }

                  const contract = contractForPhase(selectedTask, activePhase.is_final);
                  const examples = contract?.examples || [];

                  return (
                    <div className="flex flex-col gap-3">
                      <div style={{ padding: '0.6rem 0.8rem', backgroundColor: 'hsla(var(--primary), 0.05)', border: '1px solid hsl(var(--border-dark))', borderRadius: 'var(--radius)', fontSize: '0.785rem', color: 'hsl(var(--text-main))', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>Quy định tệp nộp:</div>
                        <div>{contract?.description || (activePhase.is_final ? 'Yêu cầu nộp checkpoint mô hình hoặc mã nguồn chạy.' : 'Yêu cầu nộp file kết quả dự đoán của bài tập.')}</div>
                        {examples.length > 0 && (
                          <div style={{ marginTop: '0.25rem', fontFamily: 'var(--font-mono)', opacity: 0.9 }}>
                            Ví dụ: {examples.join(', ')}
                          </div>
                        )}
                      </div>

                      {uploadError && (
                        <div className="alert alert-danger" style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', margin: 0 }}>
                          {uploadError}
                        </div>
                      )}

                      <div 
                        className="dropzone" 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '1.25rem 1rem', border: '2px dashed hsl(var(--border-dark))', borderRadius: 'var(--radius)', textAlign: 'center', cursor: 'pointer', backgroundColor: 'hsl(var(--background))' }}
                      >
                        <UploadCloud size={28} style={{ color: 'hsl(var(--text-muted))', margin: '0 auto 0.5rem auto' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 650, display: 'block', color: 'hsl(var(--text-main))' }}>
                          Chọn file bài làm của bạn
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem', display: 'block' }}>
                          Kéo thả hoặc click để duyệt file
                        </span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                      </div>

                      {selectedFile && (
                        <div style={{ padding: '0.6rem 0.75rem', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', backgroundColor: 'hsl(var(--panel))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span className="font-mono" style={{ fontSize: '0.785rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: 'hsl(var(--text-main))' }}>
                            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            onClick={triggerUpload}
                            className="btn btn-primary flex items-center gap-1"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', height: 'auto', borderRadius: '4px' }}
                            disabled={uploadProgress !== 'idle'}
                          >
                            <Play size={12} /> Nộp
                          </button>
                        </div>
                      )}

                      {uploadProgress !== 'idle' && (
                        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                          <div className="spinner" style={{ margin: '0 auto 0.4rem auto', width: '1.2rem', height: '1.2rem', borderWidth: '2px' }}></div>
                          <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                            Trạng thái: {uploadProgress.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="alert alert-danger" style={{ fontSize: '0.8rem', padding: '0.75rem', margin: 0 }}>
                    Không tìm thấy cấu hình vòng thi cho bài tập này.
                  </div>
                )}
              </div>
            )}

            {/* Submission History Box */}
            {selectedTask && (
              <div className="panel" style={{ padding: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 750, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Star size={18} style={{ color: 'hsl(var(--warning))' }} />
                  Lịch sử nộp bài
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                  {submissions.filter(s => s.task_id === selectedTaskId).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                      Chưa nộp bài giải cho thử thách này.
                    </div>
                  ) : (
                    submissions
                      .filter(s => s.task_id === selectedTaskId)
                      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                      .map(sub => (
                        <div 
                          key={sub.id} 
                          style={{ 
                            padding: '0.75rem', 
                            borderRadius: 'var(--radius)', 
                            border: '1px solid hsl(var(--border))', 
                            backgroundColor: sub.is_final ? 'hsl(var(--success-bg))' : 'hsl(var(--panel))',
                            borderLeft: sub.is_final ? '4px solid hsl(var(--success))' : '1px solid hsl(var(--border))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            transition: 'all 0.15s ease',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                              {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {new Date(sub.submitted_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                            </span>
                            {getStatusBadge(sub.status)}
                          </div>
                          
                          <div className="flex justify-between items-center" style={{ marginTop: '0.1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                              Điểm: <strong style={{ fontSize: '0.95rem', color: 'hsl(var(--text-main))' }}>
                                {sub.status === 'done' ? (sub.display_score || '0.00') : '-'}
                              </strong>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {sub.is_final ? (
                                <span 
                                  className="badge badge-success flex items-center gap-1" 
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}
                                >
                                  <Star size={8} fill="currentColor" /> Chính thức
                                </span>
                              ) : sub.status === 'done' ? (
                                <button
                                  onClick={() => markFinalMutation.mutate(sub.id)}
                                  className="btn btn-secondary"
                                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', height: 'auto' }}
                                  disabled={markFinalMutation.isPending}
                                >
                                  Chọn nộp
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header" style={{ padding: '1rem 1.5rem', marginBottom: 0 }}>
            <h3 style={{ margin: 0 }}>Your Submission History</h3>
            {submissions.some(s => ['uploaded', 'validating', 'queued', 'running'].includes(s.status)) && (
              <span className="flex items-center gap-2 text-muted" style={{ fontSize: '0.8rem' }}>
                <RefreshCw size={14} className="spinner" /> Polling queue...
              </span>
            )}
          </div>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none', borderRadius: 0, marginBottom: 0 }}>
            {submissions.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                You have not made any submissions in this contest yet.
              </div>
            ) : (
              <table className="oj-table">
                <thead>
                  <tr>
                    <th>Submitted At</th>
                    <th>Task ID</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Size</th>
                    <th>Finalist</th>
                    <th>Actions/Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id} style={{ opacity: sub.is_final ? 1 : 0.8 }}>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      <td>
                        {tasks.find(t => t.id === sub.task_id)?.title || sub.task_id}
                      </td>
                      <td>
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 'bold' }}>
                        {sub.status === 'done' ? (sub.display_score || '0.00') : '-'}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>
                        {(sub.total_size_bytes / 1024).toFixed(1)} KB
                      </td>
                      <td>
                        {sub.is_final ? (
                          <span className="badge badge-success flex items-center gap-1" style={{ width: 'fit-content' }}>
                            <Star size={12} fill="currentColor" /> Final
                          </span>
                        ) : (
                          <span className="text-muted font-mono" style={{ fontSize: '0.85rem' }}>Alternate</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {!sub.is_final && sub.status === 'done' && (
                            <button
                              onClick={() => markFinalMutation.mutate(sub.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              disabled={markFinalMutation.isPending}
                            >
                              Set as Final
                            </button>
                          )}
                          {sub.status === 'failed' && sub.error_message && (
                            <span className="text-danger" style={{ fontSize: '0.8rem', color: 'hsl(var(--danger))' }}>
                              {sub.error_message}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Standings Tab */}
      {activeTab === 'standings' && (
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header" style={{ padding: '1rem 1.5rem', marginBottom: 0 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>
                {standingsMode === 'task'
                  ? (selectedTask ? `${selectedTask.title} Leaderboard` : 'Task Leaderboard')
                  : 'Overall Phase Standings'}
              </span>
              <span className="badge badge-secondary" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                {leaderboardMode} Mode
              </span>
            </h3>
            <div className="flex gap-2">
              {(isAdmin || isJury) && activePhase && standingsMode === 'task' && (
                <button
                  onClick={() => {
                    if (activePhase.is_frozen) {
                      unfreezePhaseMutation.mutate(activePhase.id);
                    } else {
                      freezePhaseMutation.mutate(activePhase.id);
                    }
                  }}
                  className={`btn ${activePhase.is_frozen ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  disabled={freezePhaseMutation.isPending || unfreezePhaseMutation.isPending}
                >
                  {activePhase.is_frozen ? <Unlock size={14} /> : <Lock size={14} />}
                  {activePhase.is_frozen ? 'Unfreeze Standings' : 'Freeze Standings'}
                </button>
              )}

              {(isAdmin || isJury) && activePhase && standingsMode === 'task' && (
                <button
                  onClick={() => recomputeLeaderboardMutation.mutate(activePhase.id)}
                  className="btn btn-secondary flex items-center gap-2"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  disabled={recomputeLeaderboardMutation.isPending}
                >
                  <RefreshCw size={14} className={recomputeLeaderboardMutation.isPending ? 'spinner' : ''} />
                  Recompute Task Board
                </button>
              )}

              {(isAdmin || isJury) && standingsMode === 'overall' && currentDef && (
                <button
                  onClick={() => recomputeOverallLeaderboardMutation.mutate()}
                  className="btn btn-secondary flex items-center gap-2"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  disabled={recomputeOverallLeaderboardMutation.isPending}
                >
                  <RefreshCw size={14} className={recomputeOverallLeaderboardMutation.isPending ? 'spinner' : ''} />
                  Recompute Overall Board
                </button>
              )}
            </div>
          </div>

          {/* Standings Mode Switcher */}
          <div className="flex flex-wrap gap-2 justify-between items-center" style={{ borderBottom: '1px solid hsl(var(--border))', padding: '0.75rem 1.5rem', backgroundColor: 'var(--background)', rowGap: '0.5rem' }}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStandingsMode('overall')}
                className={`btn ${standingsMode === 'overall' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                Overall Standing
              </button>
              {tasks.filter(t => !!taskPhasesMap[t.id]).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setStandingsMode('task');
                  }}
                  className={`btn ${standingsMode === 'task' && selectedTaskId === t.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {t.title}
                </button>
              ))}
            </div>

            {/* Filter by Entry Mode (Official, Virtual, Practice) */}
            <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Standings Group:</span>
              <div className="flex gap-1" style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '0.15rem', backgroundColor: 'var(--background)' }}>
                {(['official', 'virtual', 'practice'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setLeaderboardMode(mode)}
                    className={`btn`}
                    style={{
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                      border: 'none',
                      backgroundColor: leaderboardMode === mode ? 'hsl(var(--primary))' : 'transparent',
                      color: leaderboardMode === mode ? 'white' : 'var(--text)',
                      boxShadow: 'none'
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Freeze Warning */}
          {standingsMode === 'task' && activePhase?.is_frozen && (
            <div className="alert alert-warning flex items-center gap-2" style={{ margin: '1rem 1.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <ShieldAlert size={16} />
              <span><strong>Standings Frozen:</strong> The jury has frozen this task board. Submissions are still accepted, but public rankings will not update.</span>
            </div>
          )}

          <div className="table-container" style={{ border: 'none', boxShadow: 'none', borderRadius: 0, marginBottom: 0 }}>
            {((standingsMode === 'task' ? leaderboard : overallLeaderboard).length === 0) ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No score rankings compiled yet for this standings view.
              </div>
            ) : (
              <table className="oj-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Participant</th>
                    <th className="font-mono">Score</th>
                    <th style={{ width: '120px' }}>Run Count</th>
                    <th>Last Upload</th>
                  </tr>
                </thead>
                <tbody>
                  {(standingsMode === 'task' ? leaderboard : overallLeaderboard).map((row, index) => {
                    const isCurrentUser = row.user_emails?.includes(user?.email || '') || row.display_name === user?.full_name;
                    return (
                      <tr key={index} style={{ backgroundColor: isCurrentUser ? 'hsla(var(--primary), 0.04)' : undefined }}>
                        <td className="font-mono" style={{ fontWeight: 'bold' }}>{row.rank}</td>
                        <td style={{ fontWeight: 600 }}>{formatParticipantName(row)}</td>
                        <td className="font-mono" style={{ fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                          {Number(row.score || 0).toFixed(6)}
                        </td>
                        <td className="font-mono">{row.entries_count}</td>
                        <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(row.updated_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Clarifications Tab */}
      {activeTab === 'clarifications' && (
        <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Thread list */}
          <div className="panel">
            <h3 style={{ marginBottom: '1.25rem' }}>Clarification History</h3>
            <div className="flex flex-col gap-4">
              {clarifications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No clarifications requested yet.</p>
              ) : (
                clarifications.map(c => (
                  <div key={c.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '1rem', backgroundColor: '#fdfdfd' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {c.task_id ? (tasks.find(t => t.id === c.task_id)?.title || 'Task Specific') : 'General'}
                      </span>
                      <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(c.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="message-thread">
                      <div className="bubble bubble-question">
                        <strong>Q: </strong> {c.question}
                      </div>

                      {c.answer ? (
                        <div className="bubble bubble-answer">
                          <strong>Jury Reply: </strong> {c.answer}
                        </div>
                      ) : (
                        <div className="text-muted" style={{ fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: '1rem' }}>
                          Pending response from the jury.
                        </div>
                      )}
                    </div>

                    {/* Admin Answer Box */}
                    {(isAdmin || isJury) && !c.answer && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.75rem' }}>
                        {answeringId === c.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              className="form-input"
                              value={qaAnswer}
                              onChange={(e) => setQaAnswer(e.target.value)}
                              placeholder="Type response here..."
                            />
                            <div className="flex justify-between items-center">
                              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <input
                                  type="checkbox"
                                  checked={isPublicAnswer}
                                  onChange={(e) => setIsPublicAnswer(e.target.checked)}
                                />
                                Make Public Announcement
                              </label>
                              <div className="flex gap-2">
                                <button onClick={() => setAnsweringId(null)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                  Cancel
                                </button>
                                <button onClick={() => handleAnswerSubmit(c.id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                  Send Answer
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAnsweringId(c.id);
                              setQaAnswer('');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Answer Question
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ask question form */}
          {!(isAdmin || isJury) && (
            <div className="panel">
              <h3 style={{ marginBottom: '1rem' }}>Ask Clarification</h3>
              {qaError && <div className="alert alert-danger" style={{ fontSize: '0.8rem' }}>{qaError}</div>}
              <form onSubmit={handleQaSubmit}>
                <div className="form-group">
                  <label className="form-label">Task Context</label>
                  <select
                    className="form-input"
                    value={qaTaskId}
                    onChange={(e) => setQaTaskId(e.target.value)}
                  >
                    <option value="">General / None</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Question *</label>
                  <textarea
                    className="form-input"
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    placeholder="Describe your issue or question clearly..."
                    required
                    style={{ height: '120px', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={createQaMutation.isPending}
                >
                  {createQaMutation.isPending ? 'Sending...' : 'Submit Question'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        (isAdmin || isJury) ? (
          <div className="panel flex flex-col items-center justify-center text-center" style={{ minHeight: '300px', borderStyle: 'dashed' }}>
            <Settings size={48} className="text-warning" style={{ color: 'hsl(var(--warning))', marginBottom: '1rem', opacity: 0.8 }} />
            <h3>Administrative Support Dispatcher</h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0.5rem auto 1.5rem auto', lineHeight: '1.5' }}>
              You are logged in with organizer privileges. To assign, status-track, or resolve contestant technical tickets, please proceed to the Admin Panel.
            </p>
            <Link to={`/admin/contests/${contestId}/setup`} className="btn btn-primary flex items-center gap-2">
              <Settings size={16} /> Go to Admin Setup (Tickets)
            </Link>
          </div>
        ) : (
          <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
            {/* My Support Tickets List */}
            <div className="panel">
              <h3 style={{ marginBottom: '1.25rem' }}>Support Ticket History</h3>
              <div className="flex flex-col gap-4">
                {myTickets.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No support tickets submitted yet.</p>
                ) : (
                  myTickets.map(ticket => (
                    <div key={ticket.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: '1rem', backgroundColor: '#fdfdfd' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-info" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {ticket.category}
                          </span>
                          <span className={`badge ${
                            ticket.priority === 'urgent' || ticket.priority === 'high' ? 'badge-danger' : 'badge-secondary'
                          }`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {ticket.priority}
                          </span>
                        </div>
                        <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(ticket.created_at).toLocaleString()}
                        </span>
                      </div>

                      <h4 style={{ margin: '0.25rem 0', fontSize: '1rem' }}>{ticket.subject}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'pre-line', margin: '0.5rem 0' }}>
                        {ticket.description}
                      </p>

                      {ticket.submission_id && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          <strong>Associated Submission:</strong> <code className="font-mono" style={{ fontSize: '0.7rem' }}>{ticket.submission_id}</code>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                        <div>
                          <strong>Status:</strong>{' '}
                          <span className={`badge ${
                            ticket.status === 'resolved' ? 'badge-success' : ticket.status === 'rejected' ? 'badge-danger' : ticket.status === 'in_progress' ? 'badge-info' : 'badge-warning'
                          }`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-muted">
                          {ticket.assigned_to ? `Assigned to: ${ticket.assigned_to}` : 'Awaiting Assignment'}
                        </div>
                      </div>

                      {ticket.resolved_at && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'hsl(var(--success))', fontStyle: 'italic' }}>
                          Resolved at {new Date(ticket.resolved_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit New Ticket Form */}
            <div className="panel">
              <h3 style={{ marginBottom: '1rem' }}>Submit Ticket</h3>
              
              {ticketError && (
                <div className="alert alert-danger" style={{ fontSize: '0.8rem', padding: '0.5rem', marginBottom: '1rem' }}>
                  {ticketError}
                </div>
              )}
              
              {ticketSuccess && (
                <div className="alert alert-success" style={{ fontSize: '0.8rem', padding: '0.5rem', marginBottom: '1rem' }}>
                  {ticketSuccess}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                setTicketError(null);
                setTicketSuccess(null);
                if (!userEntry) {
                  setTicketError('You must register for this contest to submit tickets.');
                  return;
                }
                if (!ticketSubject.trim() || !ticketDescription.trim()) {
                  setTicketError('Subject and Description are required.');
                  return;
                }
                createTicketMutation.mutate({
                  contest_entry_id: userEntry.id,
                  category: ticketCategory,
                  subject: ticketSubject,
                  description: ticketDescription,
                  submission_id: ticketSubmissionId || null
                });
              }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                  >
                    <option value="upload">Upload Issue</option>
                    <option value="judge">Jury Judge Issue</option>
                    <option value="score">Scoring Inconsistency</option>
                    <option value="system">General System Bug</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Linked Submission (Optional)</label>
                  <select
                    className="form-input"
                    value={ticketSubmissionId}
                    onChange={(e) => setTicketSubmissionId(e.target.value)}
                  >
                    <option value="">-- No Submission Linked --</option>
                    {submissions.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {new Date(sub.submitted_at).toLocaleTimeString()} - {tasks.find(t => t.id === sub.task_id)?.title || sub.task_id} (Score: {sub.display_score ?? 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Summarize the technical issue..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description *</label>
                  <textarea
                    className="form-input"
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Provide precise details, steps to reproduce, or error messages..."
                    required
                    style={{ height: '120px', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
};
