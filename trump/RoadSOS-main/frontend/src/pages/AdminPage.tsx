import { useAlert } from '../context/AlertContext';
import { useState } from 'react';
import {
  Settings, AlertTriangle, Truck, Database, Users, Trash2, Edit2, Plus, Check, CheckCircle, Info, Copy
} from 'lucide-react';

const mockUsers = [
  { id: 'usr_1', name: 'Nithya Sharma', email: 'nithya@roadsos.io', role: 'System Admin', department: 'IT Ops', status: 'Active' },
  { id: 'usr_2', name: 'James Carter', email: 'j.carter@roadsos.io', role: 'Emergency Dispatcher', department: 'Emergency Response Control', status: 'Active' },
  { id: 'usr_3', name: 'Aisha K.', email: 'a.k@roadsos.io', role: 'Traffic Dispatcher', department: 'AI Operations Center', status: 'Active' },
  { id: 'usr_4', name: 'Officer Miller', email: 'm.miller@patrol.gov', role: 'Emergency Responder', department: 'Highway Patrol Unit', status: 'On Duty' },
];

export default function AdminPage() {
  const { accidents, teams, updateAccident, deleteAccident, createTeam, updateTeamStatus } = useAlert();
  const [activeTab, setActiveTab] = useState<'accidents' | 'teams' | 'database' | 'users'>('accidents');

  // Accidents Manager Edit State
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingSeverity, setEditingSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [editingStatus, setEditingStatus] = useState<'Detected' | 'Alert Sent' | 'Rescue Dispatched' | 'Resolved'>('Detected');

  // Teams Manager Create State
  const [newTeam, setNewTeam] = useState({ name: '', type: 'Ambulance', contact: '', latitude: '', longitude: '' });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Copy-to-clipboard state
  const [copiedSchema, setCopiedSchema] = useState<string | null>(null);

  const handleEditSave = async (id: string) => {
    try {
      await updateAccident(id, { severity: editingSeverity, status: editingStatus });
      setEditingAccId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (acc: any) => {
    setEditingAccId(acc.id);
    setEditingSeverity(acc.severity);
    setEditingStatus(acc.status);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete/archive this accident report?")) {
      try {
        await deleteAccident(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name || !newTeam.contact) return;
    setIsCreatingTeam(true);
    try {
      await createTeam({
        name: newTeam.name,
        type: newTeam.type as any,
        contact: newTeam.contact,
        location: {
          latitude: parseFloat(newTeam.latitude) || 37.7749,
          longitude: parseFloat(newTeam.longitude) || -122.4194
        }
      });
      setNewTeam({ name: '', type: 'Ambulance', contact: '', latitude: '', longitude: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSchema(label);
    setTimeout(() => setCopiedSchema(null), 2000);
  };

  const mongoDBSchemaText = `// ==========================================
// MONGODB SCHEMAS (MONGOOSE / NODEJS)
// ==========================================
import mongoose from 'mongoose';

// 1. Accident Schema
const AccidentSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  locationName: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Detected', 'Alert Sent', 'Rescue Dispatched', 'Resolved'], 
    default: 'Detected' 
  },
  source: { 
    type: String, 
    enum: ['Camera', 'IoT', 'Mobile', 'GPS Device'], 
    default: 'Mobile' 
  },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
  photoUrl: { type: String },
  dispatchedTeams: [{ type: String }],
  confidence: { type: Number, default: 1.0 }
});

export const Accident = mongoose.model('Accident', AccidentSchema);

// 2. Emergency Response Team Schema
const EmergencyTeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Ambulance', 'Rescue Team', 'Police'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Available', 'Dispatched', 'On Break'], 
    default: 'Available' 
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  contact: { type: String, required: true }
});

export const EmergencyTeam = mongoose.model('EmergencyTeam', EmergencyTeamSchema);`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Settings size={24} /> Admin Panel</h1>
        <p>Manage reports, dispatchers, responder teams, and databases</p>
      </div>

      {/* Admin Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab ${activeTab === 'accidents' ? 'active' : ''}`} onClick={() => setActiveTab('accidents')}>
          <AlertTriangle size={15} /> Accident Reports
        </button>
        <button className={`tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
          <Truck size={15} /> Responder Teams
        </button>
        <button className={`tab ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
          <Database size={15} /> Database & Integration
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={15} /> User Directory
        </button>
      </div>

      {/* 1. Accident Reports Tab */}
      {activeTab === 'accidents' && (
        <div className="glass-card no-hover animate-scale-in" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem' }}>Active Accident Reports Management</h3>
            <p style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>View, edit severity levels, update status, and archive records.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location Name</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No reports in system.</td>
                  </tr>
                ) : (
                  accidents.map(acc => (
                    <tr key={acc.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{acc.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{acc.locationName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Lat: {acc.latitude.toFixed(4)}, Lng: {acc.longitude.toFixed(4)}
                        </div>
                      </td>
                      <td>
                        {editingAccId === acc.id ? (
                          <select className="form-select" value={editingSeverity} onChange={e => setEditingSeverity(e.target.value as any)} style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', fontSize: '0.78rem' }}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${acc.severity.toLowerCase()}`}>{acc.severity}</span>
                        )}
                      </td>
                      <td>
                        {editingAccId === acc.id ? (
                          <select className="form-select" value={editingStatus} onChange={e => setEditingStatus(e.target.value as any)} style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', fontSize: '0.78rem' }}>
                            <option value="Detected">Detected</option>
                            <option value="Alert Sent">Alert Sent</option>
                            <option value="Rescue Dispatched">Rescue Dispatched</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${acc.status === 'Alert Sent' ? 'alert-sent' : acc.status === 'Rescue Dispatched' ? 'dispatched' : acc.status.toLowerCase()}`}>{acc.status}</span>
                        )}
                      </td>
                      <td>{acc.source}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(acc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-xs">
                          {editingAccId === acc.id ? (
                            <>
                              <button className="btn btn-primary btn-sm btn-icon" onClick={() => handleEditSave(acc.id)} title="Save changes">
                                <Check size={14} />
                              </button>
                              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditingAccId(null)} title="Cancel">
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleStartEdit(acc)} title="Edit status">
                                <Edit2 size={13} />
                              </button>
                              <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(acc.id)} title="Archive report">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Responder Teams Tab */}
      {activeTab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem' }} className="animate-scale-in">
          {/* Add Team form */}
          <div className="glass-card no-hover">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Register New Responder Team</h3>
            <form onSubmit={handleAddTeam}>
              <div className="form-group">
                <label className="form-label">Team/Unit Name</label>
                <input className="form-input" required value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Highway Patrol 4" />
              </div>
              <div className="form-group">
                <label className="form-label">Responder Type</label>
                <select className="form-select" value={newTeam.type} onChange={e => setNewTeam(p => ({ ...p, type: e.target.value }))}>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Rescue Team">Rescue Team</option>
                  <option value="Police">Police Patrol</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Line (Phone)</label>
                <input className="form-input" required value={newTeam.contact} onChange={e => setNewTeam(p => ({ ...p, contact: e.target.value }))} placeholder="+1 (555) 911-0000" />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-input" type="number" step="0.0001" value={newTeam.latitude} onChange={e => setNewTeam(p => ({ ...p, latitude: e.target.value }))} placeholder="37.7749" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-input" type="number" step="0.0001" value={newTeam.longitude} onChange={e => setNewTeam(p => ({ ...p, longitude: e.target.value }))} placeholder="-122.4194" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isCreatingTeam}>
                <Plus size={16} /> Register Team
              </button>
            </form>
          </div>

          {/* Teams Table */}
          <div className="glass-card no-hover" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem' }}>Active Emergency Responders Registry</h3>
              <p style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>Coordinate response teams and override duty statuses.</p>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th>Type</th>
                  <th>Location (Lat, Lng)</th>
                  <th>Emergency Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Duty Shift Toggle</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <tr key={team.id}>
                    <td style={{ fontWeight: 700 }}>{team.name}</td>
                    <td>{team.type}</td>
                    <td style={{ fontFamily: 'monospace' }}>{team.location.latitude.toFixed(4)}, {team.location.longitude.toFixed(4)}</td>
                    <td style={{ fontWeight: 500 }}>{team.contact}</td>
                    <td>
                      <span className={`badge badge-${team.status === 'Available' ? 'available' : team.status === 'Dispatched' ? 'dispatched' : 'on-break'}`}>
                        {team.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-xs">
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={team.status === 'Available'}
                          onClick={() => updateTeamStatus(team.id, 'Available')}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          Available
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={team.status === 'On Break'}
                          onClick={() => updateTeamStatus(team.id, 'On Break')}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                        >
                          On Break
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Database Schema Recommendations Tab */}
      {activeTab === 'database' && (
        <div className="grid grid-2 animate-scale-in">
          {/* Schema Snippet */}
          <div className="glass-card no-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={16} color="var(--accent)" /> Suggested MongoDB Schemas
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => copyToClipboard(mongoDBSchemaText, 'mongoose')}
                style={{ gap: '0.35rem' }}
              >
                {copiedSchema === 'mongoose' ? <Check size={14} color="var(--color-resolved)" /> : <Copy size={13} />}
                {copiedSchema === 'mongoose' ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              overflowX: 'auto',
              maxHeight: '400px',
              border: '1px solid var(--border-color)'
            }}>
              <code>{mongoDBSchemaText}</code>
            </pre>
          </div>

          {/* Database Setup Guidelines */}
          <div className="glass-card no-hover" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} color="var(--color-medium)" /> MongoDB Connection Status & Setup
            </h3>
            
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
              <CheckCircle size={28} color="var(--color-resolved)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Local Storage Database Operational</div>
                <p style={{ fontSize: '0.75rem' }}>System currently writing state updates to local fallback JSON file successfully.</p>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: '0.5rem' }}><strong>How to connect to your live MongoDB server:</strong></p>
              <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Configure the environment variables in a <code>.env</code> file in the backend folder:
                  <pre style={{ margin: '0.25rem 0', padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    MONGO_URI=mongodb+srv://&lt;user&gt;:&lt;pwd&gt;@cluster0.mongodb.net/roadsos
                  </pre>
                </li>
                <li>Launch the Express backend. The server script <code>db.js</code> automatically detects the Mongoose connection string and overrides local JSON queries:
                  <pre style={{ margin: '0.25rem 0', padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    npm run dev # inside backend
                  </pre>
                </li>
                <li>Mongoose schemas enforce structure, validation, indexing on latitude/longitude (GeoJSON) for rapid radius searches.</li>
              </ol>
            </div>
            
            <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(99,102,241,0.06)' }}>
              <Info size={16} color="var(--accent)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Highway Safety Alert System:</strong> The database records include a <code>source</code> indicator (e.g. <code>IoT</code>, <code>Mobile</code>, <code>GPS Device</code>). Alerts from vehicles are ingested uniformly via the accident reporting API endpoint (POST <code>/api/accidents</code>) and displayed immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. User Directory Tab */}
      {activeTab === 'users' && (
        <div className="glass-card no-hover animate-scale-in" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem' }}>Active Operators & Dispatchers</h3>
              <p style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>Manage account registrations, roles, permissions, and security policies.</p>
            </div>
            <button className="btn btn-secondary btn-sm">
              <Plus size={14} /> Invite Admin
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Operator ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role/Department</th>
                <th>Security Level</th>
                <th>Uptime Status</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map(usr => (
                <tr key={usr.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{usr.id}</td>
                  <td style={{ fontWeight: 700 }}>{usr.name}</td>
                  <td>{usr.email}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{usr.role}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{usr.department}</div>
                  </td>
                  <td>
                    <span className={`badge ${usr.role.includes('Admin') ? 'badge-critical' : usr.role.includes('Dispatcher') ? 'badge-medium' : 'badge-low'}`}>
                      {usr.role.includes('Admin') ? 'Tier 3 (Full)' : usr.role.includes('Dispatcher') ? 'Tier 2 (Dispatch)' : 'Tier 1 (Read)'}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-xs">
                      <span className="status-dot available" />
                      {usr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }
        .admin-table th {
          background: rgba(255,255,255,0.02);
          padding: 0.85rem 1.25rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          border-bottom: 1px solid var(--border-color);
        }
        .admin-table td {
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .admin-table tr:hover {
          background: rgba(255, 255, 255, 0.015);
        }
        @media (max-width: 992px) {
          .page-container > div:last-of-type {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
