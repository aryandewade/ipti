import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ipti@admin2026';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ipti_secure_jwt_secret_token_2026';

// Ensure data storage directory exists (supports local disk or Vercel serverless /tmp)
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const dataDir = isVercel ? '/tmp' : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const enquiriesFile = path.join(dataDir, 'enquiries.json');
const programsFile = path.join(dataDir, 'programs.json');

// Initial default training programs
const defaultPrograms = [
  {
    id: "prog_automation_1",
    title: "Industrial Automation & Robotics (PLC/SCADA)",
    category: "automation",
    badge: "Core Automation",
    icon: "fa-gears",
    description: "Comprehensive hands-on training on Siemens, Allen-Bradley, Mitsubishi PLCs, SCADA visualization, VFD drives, panel designing, and Industrial IoT integration.",
    duration: "4 Months",
    labHours: "120+ Hrs Lab",
    mode: "Classroom / Hybrid",
    credentials: "ISO Certification",
    techTags: ["Siemens TIA Portal", "Wonderware SCADA", "VFD & Servo", "Robotics PLC"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog_embedded_2",
    title: "Embedded Systems & IoT Engineering",
    category: "embedded",
    badge: "Hardware & Firmware",
    icon: "fa-microchip",
    description: "From bare-metal C programming to FreeRTOS on 32-bit ARM Cortex-M microcontrollers, PCB design in KiCAD, communication protocols (CAN, I2C, SPI), and cloud IoT telemetry.",
    duration: "4 Months",
    labHours: "130+ Hrs Lab",
    mode: "Classroom / Hybrid",
    credentials: "4 Hardware Comps",
    techTags: ["STM32 / ARM", "FreeRTOS", "Embedded C", "MQTT / BLE"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog_mechanical_3",
    title: "CAD / CAM & Mechanical Product Design",
    category: "mechanical",
    badge: "Product Engineering",
    icon: "fa-cube",
    description: "Master parametric 3D solid modeling, sheet metal, surface modeling, GD&T standards, plastic part design, and finite element stress analysis using Dassault & Autodesk tools.",
    duration: "3 Months",
    labHours: "100+ Hrs CAD",
    mode: "Studio Lab",
    credentials: "ASME Y14.5",
    techTags: ["SolidWorks", "CATIA V5", "Ansys FEA", "GD&T"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog_software_4",
    title: "Full-Stack Software Engineering",
    category: "software",
    badge: "Modern Web & Cloud",
    icon: "fa-code",
    description: "Full-cycle engineering covering modern JavaScript/TypeScript, React 19, Node.js microservices, PostgreSQL relational modeling, Docker containers, and CI/CD pipelines.",
    duration: "4 Months",
    labHours: "140+ Hrs Coding",
    mode: "Online / Offline",
    credentials: "Production SaaS",
    techTags: ["React & Next.js", "Node / Express", "PostgreSQL", "AWS Cloud"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog_ai_5",
    title: "AI, Machine Learning & Vision Systems",
    category: "software",
    badge: "Frontier Technology",
    icon: "fa-brain",
    description: "Practical deep learning, computer vision for industrial defect detection, PyTorch neural networks, edge inference on NVIDIA Jetson, and modern generative AI models.",
    duration: "3.5 Months",
    labHours: "110+ Hrs",
    mode: "Live Interactive",
    credentials: "PyTorch & OpenCV",
    techTags: ["Python 3.11", "PyTorch", "OpenCV", "Edge AI"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prog_ev_6",
    title: "Electric Vehicle (EV) Systems & BMS",
    category: "mechanical",
    badge: "Green Mobility",
    icon: "fa-car-battery",
    description: "Battery pack configuration, thermal management systems, Battery Management System (BMS) logic development, traction motor controls, and MATLAB/Simulink simulations.",
    duration: "3 Months",
    labHours: "90+ Hrs",
    mode: "Classroom / Hybrid",
    credentials: "MATLAB / Simulink",
    techTags: ["EV Architecture", "BMS Hardware", "CAN Protocol", "Motor Inverters"],
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

if (!fs.existsSync(programsFile)) {
  fs.writeFileSync(programsFile, JSON.stringify(defaultPrograms, null, 2), 'utf-8');
}

function readPrograms() {
  try {
    const raw = fs.readFileSync(programsFile, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    return parsed.length > 0 ? parsed : defaultPrograms;
  } catch (err) {
    console.error('Error reading programs database:', err);
    return defaultPrograms;
  }
}

function writePrograms(programs) {
  try {
    fs.writeFileSync(programsFile, JSON.stringify(programs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving programs to database:', err);
    return false;
  }
}

// Initialize database with sample entries if empty
if (!fs.existsSync(enquiriesFile)) {
  const initialData = [
    {
      id: "ipti_enq_sample_1",
      trackingId: "IPTI-2026-1042",
      fullName: "Rahul V. Sharma",
      email: "rahul.sharma@example.com",
      phone: "+91 98230 45671",
      whatsapp: "+91 98230 45671",
      course: "Industrial Automation & Robotics (PLC/SCADA)",
      learningMode: "Offline Classroom Training",
      experience: "Final Year B.Tech (Electrical / Mechatronics)",
      message: "Interested in the 4-month practical cohort. Requesting curriculum details and weekend batch timings.",
      status: "New",
      priority: "High",
      source: "Website Hero Quick Form",
      notes: [
        {
          note: "Inquiry received from website. Candidate interested in upcoming batch starting next month.",
          author: "System",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "ipti_enq_sample_2",
      trackingId: "IPTI-2026-1088",
      fullName: "Pooja Deshmukh",
      email: "pooja.d@example.com",
      phone: "+91 99750 12894",
      whatsapp: "+91 99750 12894",
      course: "Embedded Systems & IoT Engineering",
      learningMode: "Weekend Professional Hybrid",
      experience: "Working Professional (1-2 Years)",
      message: "Working as a junior hardware engineer, want to upgrade firmware development and RTOS skills.",
      status: "Contacted",
      priority: "Medium",
      source: "Course Brochure Download",
      notes: [
        {
          note: "Called candidate, shared complete syllabus on WhatsApp.",
          author: "Admin Counselor",
          timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 18).toISOString()
    },
    {
      id: "ipti_enq_sample_3",
      trackingId: "IPTI-2026-1120",
      fullName: "Anand K. Kulkarni",
      email: "anand.kulkarni@example.com",
      phone: "+91 94220 89123",
      whatsapp: "+91 94220 89123",
      course: "CAD/CAM & Mechanical Product Design",
      learningMode: "Offline Classroom Training",
      experience: "Diploma in Mechanical Engineering",
      message: "Looking for CATIA, SolidWorks & GD&T industry certification with placement support.",
      status: "Enrolled",
      priority: "High",
      source: "Admissions Modal",
      notes: [
        {
          note: "Document verification completed. Seat confirmed for upcoming batch.",
          author: "Admissions Team",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ];
  fs.writeFileSync(enquiriesFile, JSON.stringify(initialData, null, 2), 'utf-8');
}

// Database helper functions
function readEnquiries() {
  try {
    const raw = fs.readFileSync(enquiriesFile, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading enquiries database:', err);
    return [];
  }
}

function writeEnquiries(enquiries) {
  try {
    fs.writeFileSync(enquiriesFile, JSON.stringify(enquiries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving enquiries to database:', err);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(express.static(__dirname));

// Simple token generator & validator
function generateToken(username) {
  const payload = `${username}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyToken(token) {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, timestamp, signature] = decoded.split(':');
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(`${username}:${timestamp}`).digest('hex');
    
    if (signature !== expectedSig) return false;
    
    // Check expiration (24 hours)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 24 * 60 * 60 * 1000) return false;
    
    return { username };
  } catch (e) {
    return false;
  }
}

// Auth Middleware for protected admin routes
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }

  req.admin = user;
  next();
}

// =========================================================================
// API ROUTES
// =========================================================================

// 1. Health check
app.get('/api/health', (req, res) => {
  const count = readEnquiries().length;
  res.json({
    status: 'online',
    institution: 'IPTI - Institute of Professional Training & Innovation',
    database: 'Local Persistent JSON Storage (data/enquiries.json)',
    totalEnquiries: count,
    timestamp: new Date().toISOString()
  });
});

// 2. Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        username,
        role: 'Administrator',
        institution: 'IPTI'
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please verify your admin username and password.'
    });
  }
});

// 3. Admin Verify Session
app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;
  const user = verifyToken(token);
  if (user) {
    return res.json({ success: true, valid: true, user });
  } else {
    return res.status(401).json({ success: false, valid: false, error: 'Token is invalid or expired' });
  }
});

// 4. Submit Enquiry (Public)
app.post('/api/enquiries', (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      whatsapp,
      course,
      learningMode,
      experience,
      message,
      source
    } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Full Name, Email Address, and Phone Number are required.'
      });
    }

    const enquiries = readEnquiries();
    const year = new Date().getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `IPTI-${year}-${randomCode}`;
    const timestamp = new Date().toISOString();

    const newEnquiry = {
      id: `ipti_enq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      trackingId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      whatsapp: (whatsapp || phone).trim(),
      course: course || 'General Professional Training',
      learningMode: learningMode || 'Offline Classroom Training',
      experience: experience || 'Not specified',
      message: message ? message.trim() : '',
      status: 'New',
      priority: 'High',
      source: source || 'Website Enquiry Form',
      notes: [
        {
          note: `Inquiry submitted via ${source || 'Website'}.`,
          author: 'System',
          timestamp
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    enquiries.unshift(newEnquiry);
    writeEnquiries(enquiries);

    res.status(201).json({
      success: true,
      message: 'Enquiry registered successfully. Our academic counselor will reach out shortly!',
      trackingId: newEnquiry.trackingId,
      data: newEnquiry
    });
  } catch (err) {
    console.error('Enquiry submission error:', err);
    res.status(500).json({ success: false, error: 'Internal server error while saving enquiry' });
  }
});

// 5. Get Enquiries (Protected Admin)
app.get('/api/enquiries', requireAdmin, (req, res) => {
  try {
    const { status, course, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    let list = readEnquiries();

    // Filter by status
    if (status && status !== 'All') {
      list = list.filter(item => item.status && item.status.toLowerCase() === status.toLowerCase());
    }

    // Filter by course
    if (course && course !== 'All') {
      list = list.filter(item => item.course && item.course.toLowerCase().includes(course.toLowerCase()));
    }

    // Search query (name, email, phone, trackingId)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(item => 
        (item.fullName && item.fullName.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.trackingId && item.trackingId.toLowerCase().includes(q)) ||
        (item.course && item.course.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (order === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Enquiries Analytics & Stats (Protected Admin)
app.get('/api/enquiries/stats', requireAdmin, (req, res) => {
  try {
    const list = readEnquiries();
    const today = new Date().toISOString().slice(0, 10);

    const stats = {
      total: list.length,
      today: list.filter(i => (i.createdAt || '').slice(0, 10) === today).length,
      new: list.filter(i => (i.status || '').toLowerCase() === 'new').length,
      contacted: list.filter(i => (i.status || '').toLowerCase() === 'contacted').length,
      inDiscussion: list.filter(i => (i.status || '').toLowerCase() === 'counseling scheduled').length,
      enrolled: list.filter(i => (i.status || '').toLowerCase() === 'enrolled').length,
      archived: list.filter(i => (i.status || '').toLowerCase() === 'archived').length,
      coursesBreakdown: {}
    };

    list.forEach(i => {
      const c = i.course || 'Other';
      stats.coursesBreakdown[c] = (stats.coursesBreakdown[c] || 0) + 1;
    });

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Get Single Enquiry (Protected Admin)
app.get('/api/enquiries/:id', requireAdmin, (req, res) => {
  const list = readEnquiries();
  const found = list.find(item => item.id === req.params.id || item.trackingId === req.params.id);
  if (!found) {
    return res.status(404).json({ success: false, error: 'Enquiry record not found' });
  }
  res.json({ success: true, data: found });
});

// 8. Update Enquiry Status & Notes (Protected Admin)
app.patch('/api/enquiries/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, newNote } = req.body;

    const list = readEnquiries();
    const index = list.findIndex(item => item.id === id || item.trackingId === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const item = list[index];
    const timestamp = new Date().toISOString();

    if (status) item.status = status;
    if (priority) item.priority = priority;

    if (newNote && newNote.trim()) {
      if (!Array.isArray(item.notes)) item.notes = [];
      item.notes.unshift({
        note: newNote.trim(),
        author: req.admin.username || 'Admin',
        timestamp
      });
    }

    item.updatedAt = timestamp;
    list[index] = item;
    writeEnquiries(list);

    res.json({ success: true, message: 'Enquiry updated successfully', data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Delete Enquiry (Protected Admin)
app.delete('/api/enquiries/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let list = readEnquiries();
    const originalLength = list.length;
    list = list.filter(item => item.id !== id && item.trackingId !== id);

    if (list.length === originalLength) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    writeEnquiries(list);
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Export Enquiries as CSV (Protected Admin or authorized token in query)
app.get('/api/enquiries/export/csv', (req, res) => {
  try {
    const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    const valid = verifyToken(token);
    if (!valid) {
      return res.status(401).send('Unauthorized: Valid token required for CSV download');
    }

    const list = readEnquiries();

    // CSV Headers
    const headers = [
      'Tracking ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'WhatsApp Number',
      'Program / Course',
      'Learning Mode',
      'Experience Level',
      'Status',
      'Priority',
      'Source',
      'Message / Requirements',
      'Created Date'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map(item => [
      escapeCsv(item.trackingId),
      escapeCsv(item.fullName),
      escapeCsv(item.email),
      escapeCsv(item.phone),
      escapeCsv(item.whatsapp),
      escapeCsv(item.course),
      escapeCsv(item.learningMode),
      escapeCsv(item.experience),
      escapeCsv(item.status),
      escapeCsv(item.priority),
      escapeCsv(item.source),
      escapeCsv(item.message),
      escapeCsv(new Date(item.createdAt).toLocaleString('en-IN'))
    ].join(','));

    // UTF-8 BOM for Microsoft Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    const fileName = `IPTI_Enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).send('Error generating CSV export: ' + err.message);
  }
});

// =========================================================================
// TRAINING PROGRAMS API ROUTES & ANALYTICS
// =========================================================================

// 1. Get All Programs (Public)
app.get('/api/programs', (req, res) => {
  try {
    const { all } = req.query;
    let list = readPrograms();
    if (all !== 'true') {
      list = list.filter(p => p.active !== false);
    }
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Program Analytics Endpoint (Admin Protected - must come before :id route)
app.get('/api/programs/analytics', requireAdmin, (req, res) => {
  try {
    const programs = readPrograms();
    const enquiries = readEnquiries();
    const totalEnquiries = enquiries.length;

    // Helper to match enquiry course with program title or keywords
    const programAnalytics = programs.map(prog => {
      const pTitle = (prog.title || '').toLowerCase();
      
      // Match enquiries that mention this program
      const matchingEnquiries = enquiries.filter(enq => {
        const eCourse = (enq.course || '').toLowerCase();
        if (!eCourse) return false;
        return eCourse.includes(pTitle) || pTitle.includes(eCourse) ||
               (pTitle.includes('automation') && eCourse.includes('automation')) ||
               (pTitle.includes('embedded') && eCourse.includes('embedded')) ||
               (pTitle.includes('cad') && (eCourse.includes('cad') || eCourse.includes('mechanical'))) ||
               (pTitle.includes('full-stack') && (eCourse.includes('full-stack') || eCourse.includes('software'))) ||
               (pTitle.includes('ai') && (eCourse.includes('ai') || eCourse.includes('machine learning'))) ||
               (pTitle.includes('electric vehicle') && (eCourse.includes('electric') || eCourse.includes('ev')));
      });

      const count = matchingEnquiries.length;
      const share = totalEnquiries > 0 ? Math.round((count / totalEnquiries) * 100) : 0;

      // Mode distribution for this program
      const modes = {
        classroom: matchingEnquiries.filter(e => (e.learningMode || '').toLowerCase().includes('classroom')).length,
        online: matchingEnquiries.filter(e => (e.learningMode || '').toLowerCase().includes('online')).length,
        hybrid: matchingEnquiries.filter(e => (e.learningMode || '').toLowerCase().includes('hybrid') || (e.learningMode || '').toLowerCase().includes('weekend')).length
      };

      const lastEnquiry = matchingEnquiries.length > 0 ? matchingEnquiries[0].createdAt : null;

      return {
        id: prog.id,
        title: prog.title,
        category: prog.category,
        duration: prog.duration,
        active: prog.active !== false,
        enquiriesCount: count,
        sharePercentage: share,
        modes,
        lastEnquiryDate: lastEnquiry
      };
    });

    // Sort by enquiries count descending
    programAnalytics.sort((a, b) => b.enquiriesCount - a.enquiriesCount);

    const topProgram = programAnalytics.length > 0 ? programAnalytics[0] : null;

    res.json({
      success: true,
      analytics: {
        totalPrograms: programs.length,
        totalEnquiries,
        topProgram: topProgram ? { title: topProgram.title, count: topProgram.enquiriesCount } : null,
        programsBreakdown: programAnalytics
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Single Program (Public)
app.get('/api/programs/:id', (req, res) => {
  try {
    const list = readPrograms();
    const found = list.find(p => p.id === req.params.id);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }
    res.json({ success: true, data: found });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Add New Program (Admin Protected)
app.post('/api/programs', requireAdmin, (req, res) => {
  try {
    const {
      title,
      category,
      badge,
      icon,
      description,
      duration,
      labHours,
      mode,
      credentials,
      techTags
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Program Title and Description are required.'
      });
    }

    const programs = readPrograms();
    const timestamp = new Date().toISOString();
    const id = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Parse tech tags if passed as comma-separated string or array
    let parsedTags = [];
    if (Array.isArray(techTags)) {
      parsedTags = techTags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof techTags === 'string') {
      parsedTags = techTags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const newProgram = {
      id,
      title: title.trim(),
      category: (category || 'automation').toLowerCase().trim(),
      badge: badge ? badge.trim() : 'Specialized Track',
      icon: icon ? icon.trim() : 'fa-graduation-cap',
      description: description.trim(),
      duration: duration ? duration.trim() : '3 Months',
      labHours: labHours ? labHours.trim() : '100+ Hrs Lab',
      mode: mode ? mode.trim() : 'Classroom / Hybrid',
      credentials: credentials ? credentials.trim() : 'ISO Certification',
      techTags: parsedTags.length > 0 ? parsedTags : ['Hands-on Lab', 'Industry Project'],
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    programs.unshift(newProgram);
    writePrograms(programs);

    res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      data: newProgram
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update Program (Admin Protected)
app.put('/api/programs/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const programs = readPrograms();
    const index = programs.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    const current = programs[index];
    const timestamp = new Date().toISOString();

    const {
      title,
      category,
      badge,
      icon,
      description,
      duration,
      labHours,
      mode,
      credentials,
      techTags,
      active
    } = req.body;

    let parsedTags = current.techTags;
    if (Array.isArray(techTags)) {
      parsedTags = techTags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof techTags === 'string') {
      parsedTags = techTags.split(',').map(t => t.trim()).filter(Boolean);
    }

    programs[index] = {
      ...current,
      title: title !== undefined ? title.trim() : current.title,
      category: category !== undefined ? category.toLowerCase().trim() : current.category,
      badge: badge !== undefined ? badge.trim() : current.badge,
      icon: icon !== undefined ? icon.trim() : current.icon,
      description: description !== undefined ? description.trim() : current.description,
      duration: duration !== undefined ? duration.trim() : current.duration,
      labHours: labHours !== undefined ? labHours.trim() : current.labHours,
      mode: mode !== undefined ? mode.trim() : current.mode,
      credentials: credentials !== undefined ? credentials.trim() : current.credentials,
      techTags: parsedTags,
      active: active !== undefined ? Boolean(active) : current.active,
      updatedAt: timestamp
    };

    writePrograms(programs);

    res.json({
      success: true,
      message: 'Program updated successfully',
      data: programs[index]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete Program (Admin Protected)
app.delete('/api/programs/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let programs = readPrograms();
    const origCount = programs.length;
    programs = programs.filter(p => p.id !== id);

    if (programs.length === origCount) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    writePrograms(programs);
    res.json({ success: true, message: 'Program deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server (when running locally / standalone)
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  IPTI Official Portal & Server Running on Port ${PORT}`);
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log(`  Admin Portal: http://localhost:${PORT}/admin.html`);
    console.log(`  Health API: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

export default app;
