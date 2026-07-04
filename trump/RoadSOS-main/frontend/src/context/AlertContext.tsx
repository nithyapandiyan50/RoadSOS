import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Accident {
  id: string;
  latitude: number;
  longitude: number;
  locationName: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Detected' | 'Alert Sent' | 'Rescue Dispatched' | 'Resolved';
  source: 'Camera' | 'IoT' | 'Mobile' | 'GPS Device';
  timestamp: string;
  description: string;
  photoUrl: string;
  dispatchedTeams: string[];
  confidence?: number;
}

export interface EmergencyTeam {
  id: string;
  name: string;
  type: 'Ambulance' | 'Rescue Team' | 'Police';
  status: 'Available' | 'Dispatched' | 'On Break';
  location: { latitude: number; longitude: number };
  contact: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
}

interface AlertContextType {
  accidents: Accident[];
  teams: EmergencyTeam[];
  notifications: ToastNotification[];
  isLoading: boolean;
  error: string | null;
  reportAccident: (data: Partial<Accident>) => Promise<Accident>;
  updateAccident: (id: string, data: Partial<Accident>) => Promise<Accident>;
  deleteAccident: (id: string) => Promise<boolean>;
  updateTeamStatus: (id: string, status: EmergencyTeam['status']) => Promise<EmergencyTeam>;
  createTeam: (data: Partial<EmergencyTeam>) => Promise<EmergencyTeam>;
  dismissNotification: (id: string) => void;
  triggerAIAnalysis: (imageType: string, imageBase64?: string) => Promise<any>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const API_BASE = "https://roadsos-b9sv.onrender.com";

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [teams, setTeams] = useState<EmergencyTeam[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Play audio alert on new accidents
  const playAlertSound = (severity: string) => {
    try {
      // Standard audio synthesis since physical audio files might not be present
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (severity === 'Critical') {
        // High pitched alarm pulse
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.stop(ctx.currentTime + 0.8);
      } else {
        // Shorter softer alert
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn("Audio context not allowed yet by user interaction", e);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [accRes, teamRes] = await Promise.all([
        fetch(`${API_BASE}/api/accidents`),
        fetch(`${API_BASE}/api/teams`)
      ]);

      if (!accRes.ok || !teamRes.ok) throw new Error("Failed to fetch initial data from server");

      const accData = await accRes.json();
      const teamData = await teamRes.json();

      setAccidents(accData);
      setTeams(teamData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load database content");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchInitialData();

    // Setup Socket.IO for real-time events
    console.log('[Socket.IO] Connecting...');
    const socket: Socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket.IO] Disconnected:', reason);
    });

    socket.on('realtime_event', (payload: { type: string; data: any }) => {
      console.log('[Socket.IO Event]', payload);

      if (payload.type === 'NEW_ACCIDENT') {
        const acc = payload.data as Accident;
        setAccidents(prev => [acc, ...prev]);

        const newNotif: ToastNotification = {
          id: `notif_${Date.now()}`,
          title: `New Accident Detected [${acc.severity}]`,
          message: acc.locationName,
          severity: acc.severity,
          timestamp: new Date().toLocaleTimeString()
        };
        setNotifications(prev => [newNotif, ...prev]);
        playAlertSound(acc.severity);
      }

      else if (payload.type === 'UPDATE_ACCIDENT') {
        const updatedAcc = payload.data as Accident;
        setAccidents(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));

        if (updatedAcc.status === 'Rescue Dispatched') {
          const newNotif: ToastNotification = {
            id: `notif_${Date.now()}`,
            title: 'Emergency Rescue Dispatched',
            message: `Responders deployed to: ${updatedAcc.locationName}`,
            severity: updatedAcc.severity,
            timestamp: new Date().toLocaleTimeString()
          };
          setNotifications(prev => [newNotif, ...prev]);
          playAlertSound('Medium');
        }
      }

      else if (payload.type === 'DELETE_ACCIDENT') {
        const deleted = payload.data as { id: string };
        setAccidents(prev => prev.filter(a => a.id !== deleted.id));
      }

      else if (payload.type === 'UPDATE_TEAM') {
        const team = payload.data as EmergencyTeam;
        setTeams(prev => prev.map(t => t.id === team.id ? team : t));
      }

      else if (payload.type === 'NEW_TEAM') {
        const team = payload.data as EmergencyTeam;
        setTeams(prev => [...prev, team]);
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
    });

    return () => {
      console.log('[Socket.IO] Disconnecting...');
      socket.disconnect();
    };
  }, []);

  const reportAccident = async (data: Partial<Accident>): Promise<Accident> => {
    const res = await fetch(`${API_BASE}/api/accidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to submit accident report");
    }
    return await res.json();
  };

  const updateAccident = async (id: string, data: Partial<Accident>): Promise<Accident> => {
    const res = await fetch(`${API_BASE}/api/accidents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update accident");
    }
    return await res.json();
  };

  const deleteAccident = async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/api/accidents/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete accident");
    }
    const result = await res.json();
    return result.success;
  };

  const updateTeamStatus = async (id: string, status: EmergencyTeam['status']): Promise<EmergencyTeam> => {
    const res = await fetch(`${API_BASE}/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update responder status");
    }
    return await res.json();
  };

  const createTeam = async (data: Partial<EmergencyTeam>): Promise<EmergencyTeam> => {
    const res = await fetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to register new team");
    }
    return await res.json();
  };

  const triggerAIAnalysis = async (imageType: string, imageBase64?: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/ai/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageType, imageBase64 })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "AI detection simulation failed");
    }
    return await res.json();
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AlertContext.Provider
      value={{
        accidents,
        teams,
        notifications,
        isLoading,
        error,
        reportAccident,
        updateAccident,
        deleteAccident,
        updateTeamStatus,
        createTeam,
        dismissNotification,
        triggerAIAnalysis
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
