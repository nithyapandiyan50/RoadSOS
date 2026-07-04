import { useState } from 'react';
import { Truck, Phone, MapPin, Plus, X, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

export default function ResponsePage() {
  const { teams, accidents, updateAccident, updateTeamStatus, createTeam } = useAlert();
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', type: 'Ambulance', contact: '', latitude: '', longitude: '' });

  const activeAccidents = accidents.filter(a => a.status !== 'Resolved');

  const handleDispatch = async (accidentId: string, teamId: string) => {
    const accident = accidents.find(a => a.id === accidentId);
    if (!accident) return;
    const updated = [...(accident.dispatchedTeams || []), teamId];
    await updateAccident(accidentId, { dispatchedTeams: updated, status: 'Rescue Dispatched' });
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTeam({
        name: newTeam.name,
        type: newTeam.type as any,
        contact: newTeam.contact,
        location: {
          latitude: parseFloat(newTeam.latitude) || 37.7749,
          longitude: parseFloat(newTeam.longitude) || -122.4194,
        },
      } as any);
      setNewTeam({ name: '', type: 'Ambulance', contact: '', latitude: '', longitude: '' });
      setShowAddTeam(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamTypeColors: Record<string, string> = {
    Ambulance: 'var(--color-ambulance)',
    'Rescue Team': 'var(--color-rescue)',
    Police: 'var(--color-police)',
  };

  const teamTypeEmoji: Record<string, string> = {
    Ambulance: '🚑',
    'Rescue Team': '🚒',
    Police: '🚔',
  };

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1><Truck size={24} /> Emergency Response</h1>
          <p>Manage and dispatch emergency response teams</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddTeam(true)} id="add-team-btn">
          <Plus size={16} /> Add Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Emergency Teams */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Response Teams ({teams.length})</h3>
          <div className="flex flex-col gap-sm">
            {teams.map(team => (
              <div key={team.id} className="glass-card" style={{ padding: '1rem' }}>
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-sm">
                    <span style={{ fontSize: '1.25rem' }}>{teamTypeEmoji[team.type] || '🚐'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</div>
                      <div style={{ fontSize: '0.75rem', color: teamTypeColors[team.type] || 'var(--text-muted)', fontWeight: 600 }}>{team.type}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${team.status === 'Available' ? 'available' : team.status === 'Dispatched' ? 'dispatched' : 'on-break'}`}>
                    <span className={`status-dot ${team.status === 'Available' ? 'available' : team.status === 'Dispatched' ? 'dispatched' : 'on-break'}`} />
                    {team.status}
                  </span>
                </div>
                <div className="flex items-center gap-md" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-xs"><Phone size={13} /> {team.contact}</span>
                  <span className="flex items-center gap-xs"><MapPin size={13} /> {team.location.latitude.toFixed(3)}, {team.location.longitude.toFixed(3)}</span>
                </div>
                <div className="flex gap-xs" style={{ marginTop: '0.75rem' }}>
                  {team.status !== 'Available' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => updateTeamStatus(team.id, 'Available')}>
                      Set Available
                    </button>
                  )}
                  {team.status !== 'On Break' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => updateTeamStatus(team.id, 'On Break')}>
                      Set On Break
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Incidents Needing Dispatch */}
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Active Incidents ({activeAccidents.length})</h3>
          {activeAccidents.length === 0 ? (
            <div className="glass-card empty-state">
              <p style={{ fontSize: '0.9rem' }}>🎉 No active incidents!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {activeAccidents.map(acc => {
                const availableTeams = teams.filter(t => t.status === 'Available' && !acc.dispatchedTeams.includes(t.id));
                return (
                  <div key={acc.id} className={`glass-card ${acc.severity === 'Critical' ? 'pulse-glow-border' : ''}`} style={{ padding: '1rem' }}>
                    <div className="flex items-center justify-between mb-sm">
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{acc.locationName}</div>
                      <span className={`badge badge-${acc.severity.toLowerCase()}`}>{acc.severity}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{acc.description.slice(0, 100)}...</p>
                    <div className="flex items-center gap-xs mb-sm" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span className={`badge badge-${acc.status === 'Alert Sent' ? 'alert-sent' : acc.status === 'Rescue Dispatched' ? 'dispatched' : acc.status.toLowerCase()}`}>
                        {acc.status}
                      </span>
                      <span>• {acc.source}</span>
                    </div>
                    {acc.dispatchedTeams.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DISPATCHED:</span>
                        <div className="flex gap-xs flex-wrap" style={{ marginTop: '0.25rem' }}>
                          {acc.dispatchedTeams.map(tid => {
                            const t = teams.find(t => t.id === tid);
                            return t ? (
                              <span key={tid} className="badge badge-dispatched">{teamTypeEmoji[t.type]} {t.name}</span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {availableTeams.length > 0 && (
                      <div className="flex gap-xs flex-wrap">
                        {availableTeams.slice(0, 3).map(t => (
                          <button key={t.id} className="btn btn-primary btn-sm" onClick={() => handleDispatch(acc.id, t.id)}>
                            {teamTypeEmoji[t.type]} Dispatch {t.name.split(' ').slice(0, 2).join(' ')}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-xs" style={{ marginTop: '0.5rem' }}>
                      {acc.status !== 'Resolved' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => updateAccident(acc.id, { status: 'Resolved' })}>
                          ✓ Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeam && (
        <div className="modal-backdrop" onClick={() => setShowAddTeam(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Emergency Team</h3>
              <button className="btn-icon btn-ghost" onClick={() => setShowAddTeam(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddTeam}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input className="form-input" required value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Ambulance Unit Gamma" id="team-name" />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={newTeam.type} onChange={e => setNewTeam(p => ({ ...p, type: e.target.value }))} id="team-type">
                    <option value="Ambulance">Ambulance</option>
                    <option value="Rescue Team">Rescue Team</option>
                    <option value="Police">Police</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact</label>
                  <input className="form-input" required value={newTeam.contact} onChange={e => setNewTeam(p => ({ ...p, contact: e.target.value }))} placeholder="+1 (555) 000-0000" id="team-contact" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddTeam(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                  Add Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 992px) {
          .page-container > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
        }
        .pulse-glow-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        @keyframes pulse-border {
          0%, 100% { border-color: var(--glass-border); }
          50% { border-color: var(--color-critical); box-shadow: 0 0 15px var(--color-critical-bg); }
        }
      `}</style>
    </div>
  );
}
