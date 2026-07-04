import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'data', 'db.json');

// Ensure database directory and file exist
const ensureDbFile = () => {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    const initialData = {
      accidents: [
        {
          id: "acc_1",
          latitude: 37.7749,
          longitude: -122.4194,
          locationName: "Highway 101 Northbound, Near Exit 433",
          severity: "Critical",
          status: "Rescue Dispatched",
          source: "Camera",
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
          description: "Major collision involving a SUV and a sedan. Airbags deployed. Vehicle rollover detected by roadside camera AI.",
          photoUrl: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=600",
          dispatchedTeams: ["team_1"],
          confidence: 0.94
        },
        {
          id: "acc_2",
          latitude: 37.7891,
          longitude: -122.4014,
          locationName: "Embarcadero St & Broadway",
          severity: "High",
          status: "Alert Sent",
          source: "IoT",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
          description: "Impact sensor alert from connected vehicle. High G-force impact detected on front bumper.",
          photoUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=600",
          dispatchedTeams: [],
          confidence: 0.88
        },
        {
          id: "acc_3",
          latitude: 37.7699,
          longitude: -122.4468,
          locationName: "Market St & Castro St",
          severity: "Medium",
          status: "Detected",
          source: "Mobile",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
          description: "Multiple pedestrian reports of a motorcycle slide. Rider is awake but injured.",
          photoUrl: "",
          dispatchedTeams: [],
          confidence: 0.75
        },
        {
          id: "acc_4",
          latitude: 37.7599,
          longitude: -122.4348,
          locationName: "24th St & Mission St",
          severity: "Low",
          status: "Resolved",
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
          source: "Mobile",
          description: "Minor fender bender blocking right lane. Both parties exchanging information. No injuries reported.",
          photoUrl: "",
          dispatchedTeams: ["team_4"],
          confidence: 1.0
        }
      ],
      teams: [
        {
          id: "team_1",
          name: "Ambulance Unit Alpha",
          type: "Ambulance",
          status: "Dispatched",
          location: { latitude: 37.7760, longitude: -122.4150 },
          contact: "+1 (555) 911-0101"
        },
        {
          id: "team_2",
          name: "Ambulance Unit Beta",
          type: "Ambulance",
          status: "Available",
          location: { latitude: 37.7850, longitude: -122.4300 },
          contact: "+1 (555) 911-0102"
        },
        {
          id: "team_3",
          name: "Rescue Squad 5",
          type: "Rescue Team",
          status: "Available",
          location: { latitude: 37.7700, longitude: -122.4400 },
          contact: "+1 (555) 911-0205"
        },
        {
          id: "team_4",
          name: "Highway Patrol 12",
          type: "Police",
          status: "Available",
          location: { latitude: 37.7600, longitude: -122.4300 },
          contact: "+1 (555) 911-0312"
        },
        {
          id: "team_5",
          name: "Trauma Med-Evac 1",
          type: "Ambulance",
          status: "Available",
          location: { latitude: 37.8000, longitude: -122.4100 },
          contact: "+1 (555) 911-0401"
        }
      ]
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2));
  }
};

ensureDbFile();

// In-Memory Fallback State Management
class LocalDb {
  constructor() {
    this.readData();
  }

  readData() {
    try {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
      this.data = JSON.parse(content);
    } catch (err) {
      console.error("Error reading JSON database file, re-initializing...", err);
      this.data = { accidents: [], teams: [] };
    }
  }

  writeData() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error("Error writing to JSON database:", err);
    }
  }

  getAccidents() {
    this.readData();
    // Sort accidents by timestamp descending
    return [...this.data.accidents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getAccidentById(id) {
    this.readData();
    return this.data.accidents.find(a => a.id === id);
  }

  createAccident(accident) {
    this.readData();
    const newAccident = {
      id: `acc_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dispatchedTeams: [],
      status: "Detected",
      confidence: accident.confidence || 1.0,
      photoUrl: accident.photoUrl || "",
      ...accident
    };
    this.data.accidents.push(newAccident);
    this.writeData();
    return newAccident;
  }

  updateAccident(id, updates) {
    this.readData();
    const idx = this.data.accidents.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.accidents[idx] = { ...this.data.accidents[idx], ...updates };
      this.writeData();
      return this.data.accidents[idx];
    }
    return null;
  }

  deleteAccident(id) {
    this.readData();
    const initialLength = this.data.accidents.length;
    this.data.accidents = this.data.accidents.filter(a => a.id !== id);
    if (this.data.accidents.length !== initialLength) {
      this.writeData();
      return true;
    }
    return false;
  }

  getTeams() {
    this.readData();
    return this.data.teams;
  }

  updateTeamStatus(id, status) {
    this.readData();
    const idx = this.data.teams.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.teams[idx].status = status;
      this.writeData();
      return this.data.teams[idx];
    }
    return null;
  }

  createTeam(team) {
    this.readData();
    const newTeam = {
      id: `team_${Date.now()}`,
      status: "Available",
      ...team
    };
    this.data.teams.push(newTeam);
    this.writeData();
    return newTeam;
  }
}

const localDbInstance = new LocalDb();

// Attempt MongoDB Connection
let isMongoConnected = false;
const mongoUri = process.env.MONGO_URI;

if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log("Successfully connected to MongoDB.");
      isMongoConnected = true;
    })
    .catch((err) => {
      console.warn("MongoDB connection failed. Falling back to local JSON database.", err.message);
    });
} else {
  console.log("No MONGO_URI specified in environment. Using local JSON database.");
}

export const db = {
  isMongoConnected: () => isMongoConnected,
  getAccidents: async () => {
    return localDbInstance.getAccidents();
  },
  getAccidentById: async (id) => {
    return localDbInstance.getAccidentById(id);
  },
  createAccident: async (data) => {
    return localDbInstance.createAccident(data);
  },
  updateAccident: async (id, data) => {
    return localDbInstance.updateAccident(id, data);
  },
  deleteAccident: async (id) => {
    return localDbInstance.deleteAccident(id);
  },
  getTeams: async () => {
    return localDbInstance.getTeams();
  },
  updateTeamStatus: async (id, status) => {
    return localDbInstance.updateTeamStatus(id, status);
  },
  createTeam: async (data) => {
    return localDbInstance.createTeam(data);
  }
};
