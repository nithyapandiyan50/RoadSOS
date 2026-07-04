import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // to support image upload in base64 if needed

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const broadcast = (type, data) => {
  const payload = { type, data, timestamp: new Date().toISOString() };
  console.log(`[Socket.IO Broadcast] Type: ${type}`);
  io.emit('realtime_event', payload);
};

// API Routes

// Get all accidents
app.get('/api/accidents', async (req, res) => {
  try {
    const list = await db.getAccidents();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single accident
app.get('/api/accidents/:id', async (req, res) => {
  try {
    const item = await db.getAccidentById(req.params.id);
    if (!item) return res.status(404).json({ error: "Accident not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Report an accident (Manually, GPS/IoT, or via SOS Button)
app.post('/api/accidents', async (req, res) => {
  try {
    const { latitude, longitude, locationName, severity, source, description, photoUrl, confidence } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude and Longitude are required." });
    }

    const newAccident = await db.createAccident({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      locationName: locationName || `Coordinate (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      severity: severity || "Medium",
      source: source || "Mobile",
      description: description || "Manual SOS report submitted.",
      photoUrl: photoUrl || "",
      confidence: confidence || 1.0
    });

    broadcast('NEW_ACCIDENT', newAccident);
    res.status(201).json(newAccident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an accident (e.g. status, severity, assigning responder teams)
app.put('/api/accidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await db.getAccidentById(id);
    if (!existing) {
      return res.status(404).json({ error: "Accident not found" });
    }

    const updated = await db.updateAccident(id, updates);
    broadcast('UPDATE_ACCIDENT', updated);

    // If teams were dispatched or released, update their statuses accordingly
    if (updates.dispatchedTeams) {
      const allTeams = await db.getTeams();
      for (const team of allTeams) {
        const isDispatchedToThis = updates.dispatchedTeams.includes(team.id);
        
        // If team is currently dispatched to this accident, mark as Dispatched
        if (isDispatchedToThis && team.status !== 'Dispatched') {
          const updatedTeam = await db.updateTeamStatus(team.id, 'Dispatched');
          broadcast('UPDATE_TEAM', updatedTeam);
        }
        // If team was dispatched to this accident, but is no longer in the list, set back to Available
        else if (!isDispatchedToThis && team.status === 'Dispatched' && existing.dispatchedTeams.includes(team.id)) {
          const updatedTeam = await db.updateTeamStatus(team.id, 'Available');
          broadcast('UPDATE_TEAM', updatedTeam);
        }
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/Archive accident report
app.delete('/api/accidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accident = await db.getAccidentById(id);
    
    if (!accident) {
      return res.status(404).json({ error: "Accident not found" });
    }

    // Release any teams assigned to this accident
    if (accident.dispatchedTeams && accident.dispatchedTeams.length > 0) {
      for (const teamId of accident.dispatchedTeams) {
        const updatedTeam = await db.updateTeamStatus(teamId, 'Available');
        broadcast('UPDATE_TEAM', updatedTeam);
      }
    }

    await db.deleteAccident(id);
    broadcast('DELETE_ACCIDENT', { id });
    res.json({ success: true, message: "Accident deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get emergency responder teams
app.get('/api/teams', async (req, res) => {
  try {
    const list = await db.getTeams();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update responder team status (Available, Dispatched, On Break)
app.put('/api/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updated = await db.updateTeamStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: "Team not found" });
    }

    broadcast('UPDATE_TEAM', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new responder team
app.post('/api/teams', async (req, res) => {
  try {
    const { name, type, contact, latitude, longitude } = req.body;
    if (!name || !type || !contact) {
      return res.status(400).json({ error: "Name, type, and contact are required." });
    }

    const newTeam = await db.createTeam({
      name,
      type,
      contact,
      location: {
        latitude: parseFloat(latitude) || 37.7749,
        longitude: parseFloat(longitude) || -122.4194
      }
    });

    broadcast('NEW_TEAM', newTeam);
    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Detection Mock Process
app.post('/api/ai/detect', async (req, res) => {
  try {
    const { imageType, imageBase64 } = req.body;

    // Simulate AI computing/processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Preset mock detection results based on selected standard types
    let severity = "High";
    let description = "AI Camera detection: Vehicle collision on Highway.";
    let confidence = 0.92;
    let label = "Multi-vehicle Collision";

    if (imageType === 'fire') {
      severity = "Critical";
      description = "AI Camera detection: Vehicle fire on expressway shoulder. High thermal heat detected.";
      confidence = 0.97;
      label = "Vehicle Fire / Explosion";
    } else if (imageType === 'rollover') {
      severity = "Critical";
      description = "AI Camera detection: Rollover collision. Car turned sideways on lane 2.";
      confidence = 0.89;
      label = "Rollover Accident";
    } else if (imageType === 'minor') {
      severity = "Low";
      description = "AI Camera detection: Minor rear-end collision on exit ramp. Traffic congestion forming.";
      confidence = 0.85;
      label = "Rear-end Collision";
    }

    // Set random coordinates around SF area for simulation
    const randLat = 37.75 + Math.random() * 0.05;
    const randLng = -122.45 + Math.random() * 0.05;

    const newAccident = await db.createAccident({
      latitude: parseFloat(randLat.toFixed(4)),
      longitude: parseFloat(randLng.toFixed(4)),
      locationName: `AI Cam Node ${Math.floor(Math.random() * 100) + 100} - SF Metro`,
      severity,
      source: "Camera",
      description: `${description} Confidence: ${(confidence * 100).toFixed(0)}%.`,
      photoUrl: imageBase64 || "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=600",
      confidence
    });

    broadcast('NEW_ACCIDENT', newAccident);

    res.json({
      success: true,
      detection: {
        label,
        confidence,
        boundingBox: [120, 80, 480, 360] // [x1, y1, x2, y2] simulated box coordinates
      },
      accident: newAccident
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server Start
httpServer.listen(PORT, () => {
  console.log(`[Express] Server running on port ${PORT}`);
});
