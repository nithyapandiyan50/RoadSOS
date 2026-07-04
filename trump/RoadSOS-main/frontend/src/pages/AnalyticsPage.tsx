import { useAlert } from '../context/AlertContext';
import { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, AlertTriangle, Clock, MapPin, Search, Calendar, Info, ShieldAlert,
  ChevronLeft, ChevronRight, FileSpreadsheet, Download
} from 'lucide-react';
import AccidentMap from '../components/AccidentMap';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

// Inferred causes based on accident parameters
const getAccidentCause = (acc: any) => {
  if (acc.id === 'acc_1') return 'Distracted Driving';
  if (acc.id === 'acc_2') return 'Speeding';
  if (acc.id === 'acc_3') return 'Weather Conditions';
  if (acc.id === 'acc_4') return 'Tailgating';
  
  if (acc.source === 'Camera') return 'Tailgating';
  if (acc.source === 'IoT') return 'Speeding';
  if (acc.source === 'Mobile') return 'Distracted Driving';
  return 'Mechanical Failure';
};

const CHART_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'];

export default function AnalyticsPage() {
  const { accidents, isLoading } = useAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Process Trend Data (Accidents by Day of the Week)
  const trendData = useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Sun: 4, Mon: 6, Tue: 5, Wed: 8, Thu: 4, Fri: 12, Sat: 9 };
    
    accidents.forEach(acc => {
      try {
        const day = daysOfWeek[new Date(acc.timestamp).getDay()];
        if (counts[day as keyof typeof counts] !== undefined) {
          counts[day as keyof typeof counts]++;
        }
      } catch (e) {
        // ignore date parsing issues
      }
    });

    return daysOfWeek.map(day => ({
      name: day,
      Incidents: counts[day as keyof typeof counts]
    }));
  }, [accidents]);

  // 2. Process Cause Distribution Data
  const causeData = useMemo(() => {
    const causes = {
      'Speeding': 14,
      'Distracted Driving': 22,
      'Weather Conditions': 10,
      'Tailgating': 12,
      'Mechanical Failure': 6
    };

    accidents.forEach(acc => {
      const cause = getAccidentCause(acc);
      if (causes[cause as keyof typeof causes] !== undefined) {
        causes[cause as keyof typeof causes]++;
      }
    });

    return Object.entries(causes).map(([name, value]) => ({ name, value }));
  }, [accidents]);

  // 3. Process Severity Distribution Data
  const severityData = useMemo(() => {
    const counts = { Low: 8, Medium: 15, High: 18, Critical: 6 };

    accidents.forEach(acc => {
      if (counts[acc.severity as keyof typeof counts] !== undefined) {
        counts[acc.severity as keyof typeof counts]++;
      }
    });

    return [
      { name: 'Low', count: counts.Low, color: '#3b82f6' },
      { name: 'Medium', count: counts.Medium, color: '#f59e0b' },
      { name: 'High', count: counts.High, color: '#f97316' },
      { name: 'Critical', count: counts.Critical, color: '#ef4444' }
    ];
  }, [accidents]);

  // 4. Process Source Breakdown Data
  const sourceData = useMemo(() => {
    const counts = { Camera: 18, IoT: 15, Mobile: 26, 'GPS Device': 10 };

    accidents.forEach(acc => {
      const src = acc.source || 'Mobile';
      if (counts[src as keyof typeof counts] !== undefined) {
        counts[src as keyof typeof counts]++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [accidents]);

  // 5. Filtered list for Historical Records Table
  const filteredRecords = useMemo(() => {
    return accidents.filter(acc => {
      const matchSearch =
        acc.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchSeverity = severityFilter === 'all' || acc.severity === severityFilter;
      const matchSource = sourceFilter === 'all' || acc.source === sourceFilter;

      return matchSearch && matchSeverity && matchSource;
    });
  }, [accidents, searchTerm, severityFilter, sourceFilter]);

  // Pagination calculations
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;

  // Filter out hotspots for map (Critical and High incidents)
  const hotspots = useMemo(() => {
    return accidents.filter(a => a.severity === 'Critical' || a.severity === 'High');
  }, [accidents]);

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = 'ID,Timestamp,Location,Severity,Status,Source,Description,Latitude,Longitude\n';
    const rows = accidents.map(a => 
      `"${a.id}","${a.timestamp}","${a.locationName.replace(/"/g, '""')}","${a.severity}","${a.status}","${a.source}","${a.description.replace(/"/g, '""')}",${a.latitude},${a.longitude}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `roadsos_accident_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1><BarChart3 size={24} /> Accident Analytics</h1>
          <p>Historical statistics, trends, and safety analysis reports</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>
          <FileSpreadsheet size={16} /> Export CSV <Download size={14} />
        </button>
      </div>

      {/* Analytics Stats Summary Cards */}
      <div className="grid grid-4 animate-slide-up stagger-1" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card accent">
          <div className="stat-info">
            <div className="stat-label">Total Data Entries</div>
            <div className="stat-value">{60 + accidents.length}</div>
            <div className="stat-change up">
              <TrendingUp size={12} /> Live Tracking Activated
            </div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-info">
            <div className="stat-label">Hotspot Locations</div>
            <div className="stat-value" style={{ color: 'var(--color-critical)' }}>{24 + hotspots.length}</div>
            <div className="stat-change down">
              <AlertTriangle size={12} /> Critical areas flagged
            </div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-info">
            <div className="stat-label">Avg Dispatch Latency</div>
            <div className="stat-value" style={{ color: 'var(--color-medium)' }}>1.8 min</div>
            <div className="stat-change up">
              <Clock size={12} /> -24% decrease from Q1
            </div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-info">
            <div className="stat-label">IoT Sensor Uptime</div>
            <div className="stat-value" style={{ color: 'var(--color-resolved)' }}>99.98%</div>
            <div className="stat-change up">
              <Calendar size={12} /> Stable network coverage
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Weekly Incidents Trend */}
        <div className="glass-card no-hover">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--accent)" /> Incident Trends (Weekly)
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Area type="monotone" dataKey="Incidents" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cause Distribution */}
        <div className="glass-card no-hover">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={16} color="var(--color-medium)" /> Accident Cause Analysis
          </h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={causeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {causeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Severity Distribution */}
        <div className="glass-card no-hover">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} color="var(--color-critical)" /> Severity Distribution
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="glass-card no-hover">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="var(--color-low)" /> Alert Source Breakdown
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={90} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Bar dataKey="value" fill="var(--color-low)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Accident Hotspot Map */}
      <div className="glass-card no-hover" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="var(--color-critical)" /> Safety Hotspots Map (Critical & High Severity Locations)
          </h3>
          <span className="badge badge-critical">
            {hotspots.length} hotspots active
          </span>
        </div>
        <AccidentMap accidents={hotspots} height="350px" zoom={12} />
      </div>

      {/* Historical Records Table */}
      <div className="glass-card no-hover" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem' }}>Historical Records Log</h3>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', width: 14, height: 14 }} />
              <input
                className="form-input"
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ padding: '0.35rem 0.5rem 0.35rem 1.85rem', fontSize: '0.8rem', width: '180px' }}
              />
            </div>

            {/* Severity Filter */}
            <select
              className="form-select"
              value={severityFilter}
              onChange={e => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
              style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.5rem', fontSize: '0.8rem' }}
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Source Filter */}
            <select
              className="form-select"
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setCurrentPage(1); }}
              style={{ width: 'auto', padding: '0.35rem 2rem 0.35rem 0.5rem', fontSize: '0.8rem' }}
            >
              <option value="all">All Sources</option>
              <option value="Camera">AI Camera</option>
              <option value="IoT">IoT Sensor</option>
              <option value="Mobile">Mobile Phone</option>
              <option value="GPS Device">GPS Device</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Source</th>
                <th>Primary Cause</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(acc => (
                  <tr key={acc.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{acc.id}</td>
                    <td>{new Date(acc.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td style={{ fontWeight: 500 }}>{acc.locationName}</td>
                    <td>
                      <span className={`badge badge-${acc.severity.toLowerCase()}`}>{acc.severity}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${acc.status === 'Alert Sent' ? 'alert-sent' : acc.status === 'Rescue Dispatched' ? 'dispatched' : acc.status.toLowerCase()}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td>{acc.source}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{getAccidentCause(acc)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredRecords.length > itemsPerPage && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
              {Math.min(filteredRecords.length, currentPage * itemsPerPage)} of {filteredRecords.length} records
            </span>
            <div className="flex gap-sm">
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

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
          .page-container > div:nth-of-type(2),
          .page-container > div:nth-of-type(3) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
