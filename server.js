import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import mongoose from 'mongoose';

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
const certificatesFile = path.join(dataDir, 'certificates.json');
const candidatesFile = path.join(dataDir, 'candidates.json');

// Uploads Directories
const uploadsDir = path.join(__dirname, 'uploads');
const syllabusDir = path.join(uploadsDir, 'syllabus');
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(syllabusDir)) fs.mkdirSync(syllabusDir, { recursive: true });
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const LEARNER_SECRET_KEY = process.env.LEARNER_SECRET_KEY || 'ipti_learner_secret_jwt_key_2026';

// =========================================================================
// MONGODB ATLAS INTEGRATION & SCHEMAS
// =========================================================================
const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

// 1. Enquiry Schema (Leads / Enquiries submitted on site)
const enquirySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  trackingId: { type: String, index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, default: '' },
  course: { type: String, required: true },
  learningMode: { type: String, default: 'Classroom Training' },
  message: { type: String, default: '' },
  status: { type: String, default: 'New', index: true },
  interest: { type: String, default: 'Pending', index: true },
  notes: { type: Array, default: [] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { collection: 'enquiries', timestamps: true });

// 2. Candidate Schema (Enrolled Students & LMS Ledger)
const candidateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  whatsapp: { type: String, default: '' },
  program: { type: String, required: true },
  batch: { type: String, default: 'Morning Cohort' },
  admissionDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  learningMode: { type: String, default: 'Classroom Training' },
  totalFees: { type: Number, default: 0 },
  paidFees: { type: Number, default: 0 },
  balanceFees: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Pending', index: true },
  paymentHistory: { type: Array, default: [] },
  eligibleForCertificate: { type: Boolean, default: false, index: true },
  certificateIssued: { type: Boolean, default: false },
  certificateId: { type: String, default: '' },
  attendance: { type: Number, default: 0 },
  projectTitle: { type: String, default: '' },
  password: { type: String, default: 'ipti@123' },
  hasChangedPassword: { type: Boolean, default: false },
  photoUrl: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, { collection: 'candidates', timestamps: true });

// 3. Certificate Schema (Issued Credentials & Diplomas)
const certificateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  certId: { type: String, required: true, unique: true, index: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true, index: true },
  studentPhone: { type: String, default: '' },
  program: { type: String, required: true },
  issueDate: { type: String, required: true },
  grade: { type: String, default: 'Grade A+' },
  verified: { type: Boolean, default: true },
  score: { type: Number, default: 95 },
  issuedBy: { type: String, default: 'IPTI Academic Council' },
  downloadUrl: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { collection: 'certificates', timestamps: true });

// 4. Program Schema (Training Programs)
const programSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, default: 'automation' },
  badge: { type: String, default: '' },
  icon: { type: String, default: 'fa-gears' },
  description: { type: String, default: '' },
  duration: { type: String, default: '3 Months' },
  labHours: { type: String, default: '100+ Hrs Lab' },
  mode: { type: String, default: 'Classroom / Hybrid' },
  credentials: { type: String, default: 'ISO Certification' },
  techTags: { type: [String], default: [] },
  syllabusUrl: { type: String, default: '' },
  syllabusFilename: { type: String, default: '' },
  active: { type: Boolean, default: true },
  curriculum: { type: Array, default: [] },
  enrolledStudentsCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }
}, { collection: 'programs', timestamps: true });

const EnquiryModel = mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
const CandidateModel = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
const CertificateModel = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
const ProgramModel = mongoose.models.Program || mongoose.model('Program', programSchema);

async function initDatabase() {
  if (!MONGODB_URI) {
    console.log('📦 [Database Mode] Local persistent JSON files (data/) active.');
    return;
  }

  if (MONGODB_URI.includes('<db_password>')) {
    console.log('\n================================================================');
    console.log('⚠️  [MongoDB Atlas Notice] Placeholder <db_password> detected.');
    console.log('⚠️  Please replace <db_password> in your .env file with your actual MongoDB Atlas password.');
    console.log('📁  Local persistent JSON storage (data/) is active and serving data.');
    console.log('================================================================\n');
    return;
  }

  try {
    console.log('⏳ [MongoDB Atlas] Connecting to cluster...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'ipti_db',
      serverSelectionTimeoutMS: 8000
    });
    isMongoConnected = true;
    console.log('🍃 [MongoDB Atlas] Connected successfully to cluster (database: ipti_db)');
    await migrateLocalDataToMongo();
  } catch (err) {
    console.error('❌ [MongoDB Atlas Connection Failed]:', err.message);
    console.log('📁 Continuing with local persistent JSON files.\n');
    isMongoConnected = false;
  }
}

async function migrateLocalDataToMongo() {
  try {
    // 1. Sync Enquiries
    const enqCount = await EnquiryModel.countDocuments();
    if (enqCount === 0) {
      const local = readEnquiries();
      if (local.length > 0) {
        await EnquiryModel.insertMany(local);
        console.log(`✅ [MongoDB Seeder] Migrated ${local.length} enquiries to MongoDB Atlas.`);
      }
    } else {
      const docs = await EnquiryModel.find().lean();
      if (docs.length > 0) {
        const cleaned = docs.map(({ _id, __v, ...rest }) => rest);
        fs.writeFileSync(enquiriesFile, JSON.stringify(cleaned, null, 2), 'utf-8');
      }
    }

    // 2. Sync Candidates
    const candCount = await CandidateModel.countDocuments();
    if (candCount === 0) {
      const local = readCandidates();
      if (local.length > 0) {
        await CandidateModel.insertMany(local);
        console.log(`✅ [MongoDB Seeder] Migrated ${local.length} candidates to MongoDB Atlas.`);
      }
    } else {
      const docs = await CandidateModel.find().lean();
      if (docs.length > 0) {
        const cleaned = docs.map(({ _id, __v, ...rest }) => rest);
        fs.writeFileSync(candidatesFile, JSON.stringify(cleaned, null, 2), 'utf-8');
      }
    }

    // 3. Sync Certificates
    const certCount = await CertificateModel.countDocuments();
    if (certCount === 0) {
      const local = readCertificates();
      if (local.length > 0) {
        await CertificateModel.insertMany(local);
        console.log(`✅ [MongoDB Seeder] Migrated ${local.length} certificates to MongoDB Atlas.`);
      }
    }

    // 4. Sync Programs
    const progCount = await ProgramModel.countDocuments();
    if (progCount === 0) {
      const local = readPrograms();
      if (local.length > 0) {
        await ProgramModel.insertMany(local);
        console.log(`✅ [MongoDB Seeder] Migrated ${local.length} programs to MongoDB Atlas.`);
      }
    }
  } catch (err) {
    console.error('⚠️ [MongoDB Initial Migration Error]:', err.message);
  }
}

// Background sync helpers
async function syncEnquiriesToMongo(enquiries) {
  if (!isMongoConnected || !Array.isArray(enquiries)) return;
  try {
    const ops = enquiries.map(e => ({
      updateOne: {
        filter: { id: e.id },
        update: { $set: e },
        upsert: true
      }
    }));
    await EnquiryModel.bulkWrite(ops);
  } catch (err) {
    console.error('⚠️ [MongoDB Sync Enquiries Error]:', err.message);
  }
}

async function syncCandidatesToMongo(candidates) {
  if (!isMongoConnected || !Array.isArray(candidates)) return;
  try {
    const ops = candidates.map(c => ({
      updateOne: {
        filter: { id: c.id },
        update: { $set: c },
        upsert: true
      }
    }));
    await CandidateModel.bulkWrite(ops);
  } catch (err) {
    console.error('⚠️ [MongoDB Sync Candidates Error]:', err.message);
  }
}

async function syncCertificatesToMongo(certificates) {
  if (!isMongoConnected || !Array.isArray(certificates)) return;
  try {
    const ops = certificates.map(c => ({
      updateOne: {
        filter: { id: c.id },
        update: { $set: c },
        upsert: true
      }
    }));
    await CertificateModel.bulkWrite(ops);
  } catch (err) {
    console.error('⚠️ [MongoDB Sync Certificates Error]:', err.message);
  }
}

async function syncProgramsToMongo(programs) {
  if (!isMongoConnected || !Array.isArray(programs)) return;
  try {
    const ops = programs.map(p => ({
      updateOne: {
        filter: { id: p.id },
        update: { $set: p },
        upsert: true
      }
    }));
    await ProgramModel.bulkWrite(ops);
  } catch (err) {
    console.error('⚠️ [MongoDB Sync Programs Error]:', err.message);
  }
}

// Trigger initial DB connection
initDatabase().catch(err => console.error('[DB Initialization Error]:', err.message));

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
    if (isMongoConnected) {
      syncProgramsToMongo(programs);
    }
    return true;
  } catch (err) {
    console.error('Error saving programs to database:', err);
    return false;
  }
}

const defaultCertificates = [
  {
    id: "cert_1795427001042_a1b2",
    certId: "IPTI-CERT-2026-1042",
    studentName: "Rahul V. Sharma",
    studentEmail: "rahul.sharma@example.com",
    studentPhone: "+91 98230 45671",
    program: "Industrial Automation & Robotics (PLC/SCADA)",
    grade: "Distinction (Grade A+ • 96%)",
    issueDate: "2026-02-18",
    standard: "ISO 9001:2015 Accredited",
    status: "Verified",
    notes: "Completed 120+ hours of physical PLC/SCADA benchwork and Automated Sorting Line capstone.",
    createdAt: "2026-02-18T10:00:00.000Z"
  },
  {
    id: "cert_1795427001088_c3d4",
    certId: "IPTI-CERT-2026-1088",
    studentName: "Pooja Deshmukh",
    studentEmail: "pooja.d@example.com",
    studentPhone: "+91 99750 12894",
    program: "Embedded Systems & IoT Engineering",
    grade: "Grade A (89%)",
    issueDate: "2026-01-25",
    standard: "ISO 9001:2015 Accredited",
    status: "Verified",
    notes: "Built FreeRTOS sensor telemetry rig with CAN 2.0B bus integration.",
    createdAt: "2026-01-25T11:30:00.000Z"
  },
  {
    id: "cert_1795427001120_e5f6",
    certId: "IPTI-CERT-2026-1120",
    studentName: "Amitesh Kulkarni",
    studentEmail: "amitesh.k@example.com",
    studentPhone: "+91 97640 88219",
    program: "CAD / CAM & Mechanical Product Design",
    grade: "Distinction (Grade A+ • 94%)",
    issueDate: "2026-03-02",
    standard: "ISO 9001:2015 Accredited",
    status: "Verified",
    notes: "Completed Automotive Transmission casing parametric design with GD&T and 5-axis CAM.",
    createdAt: "2026-03-02T09:15:00.000Z"
  },
  {
    id: "cert_1795427001205_g7h8",
    certId: "IPTI-CERT-2026-1205",
    studentName: "Neha S. Patil",
    studentEmail: "neha.patil@example.com",
    studentPhone: "+91 98901 23456",
    program: "AI, Machine Learning & Vision Systems",
    grade: "Distinction (Grade A+ • 97%)",
    issueDate: "2026-03-10",
    standard: "ISO 9001:2015 Accredited",
    status: "Verified",
    notes: "Delivered production-grade defect detection vision pipeline using TensorRT.",
    createdAt: "2026-03-10T14:20:00.000Z"
  }
];

function readCertificates() {
  try {
    if (!fs.existsSync(certificatesFile)) {
      writeCertificates(defaultCertificates);
      return defaultCertificates;
    }
    const raw = fs.readFileSync(certificatesFile, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    return parsed.length > 0 ? parsed : defaultCertificates;
  } catch (err) {
    console.error('Error reading certificates database:', err);
    return defaultCertificates;
  }
}

function writeCertificates(certificates) {
  try {
    fs.writeFileSync(certificatesFile, JSON.stringify(certificates, null, 2), 'utf-8');
    if (isMongoConnected) {
      syncCertificatesToMongo(certificates);
    }
    return true;
  } catch (err) {
    console.error('Error writing certificates database:', err);
    return false;
  }
}

// Initial default converted candidates
const defaultCandidates = [
  {
    id: "cand_2026_stu_01",
    studentId: "IPTI-2026-STU-01",
    fullName: "Rahul V. Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98230 45671",
    whatsapp: "+91 98230 45671",
    program: "Industrial Automation & Robotics (PLC/SCADA)",
    batch: "Morning Cohort (09:00 AM - 01:00 PM)",
    admissionDate: "2026-01-10",
    learningMode: "Classroom Training",
    totalFees: 35000,
    paidFees: 35000,
    balanceFees: 0,
    paymentStatus: "Paid",
    paymentHistory: [
      { id: "pay_101", date: "2026-01-10", amount: 20000, method: "UPI / Net Banking", receiptNo: "REC-2026-101", notes: "Admission seat booking & 1st installment" },
      { id: "pay_102", date: "2026-01-25", amount: 15000, method: "Bank Transfer", receiptNo: "REC-2026-145", notes: "Final fee clearance (100% paid)" }
    ],
    eligibleForCertificate: true,
    certificateIssued: true,
    certificateId: "IPTI-CERT-2026-1042",
    attendance: 96,
    projectTitle: "Automated Sorting Line & SCADA Telemetry Rig",
    password: "ipti@123",
    hasChangedPassword: false,
    notes: "Distinction student. All lab benchmarks and capstone project completed.",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-25T14:00:00.000Z"
  },
  {
    id: "cand_2026_stu_02",
    studentId: "IPTI-2026-STU-02",
    fullName: "Pooja Deshmukh",
    email: "pooja.d@example.com",
    phone: "+91 99750 12894",
    whatsapp: "+91 99750 12894",
    program: "Embedded Systems & IoT Engineering",
    batch: "Weekend Executive Batch (10:00 AM - 04:00 PM)",
    admissionDate: "2026-01-15",
    learningMode: "Weekend Professional Hybrid",
    totalFees: 38000,
    paidFees: 25000,
    balanceFees: 13000,
    paymentStatus: "Partial",
    paymentHistory: [
      { id: "pay_201", date: "2026-01-15", amount: 25000, method: "Credit Card", receiptNo: "REC-2026-118", notes: "Registration & 1st installment" }
    ],
    eligibleForCertificate: false,
    certificateIssued: false,
    certificateId: "",
    attendance: 88,
    projectTitle: "STM32 FreeRTOS CAN 2.0B Telemetry Node",
    password: "ipti@123",
    hasChangedPassword: false,
    notes: "Second installment of ₹13,000 pending before certificate eligibility.",
    createdAt: "2026-01-15T09:30:00.000Z",
    updatedAt: "2026-01-15T09:30:00.000Z"
  },
  {
    id: "cand_2026_stu_03",
    studentId: "IPTI-2026-STU-03",
    fullName: "Amitesh Kulkarni",
    email: "amitesh.k@example.com",
    phone: "+91 97640 88219",
    whatsapp: "+91 97640 88219",
    program: "CAD / CAM & Mechanical Product Design",
    batch: "Daily Fast-Track Cohort",
    admissionDate: "2026-01-20",
    learningMode: "Classroom Training",
    totalFees: 32000,
    paidFees: 32000,
    balanceFees: 0,
    paymentStatus: "Paid",
    paymentHistory: [
      { id: "pay_301", date: "2026-01-20", amount: 32000, method: "NEFT Transfer", receiptNo: "REC-2026-130", notes: "Full upfront fee payment" }
    ],
    eligibleForCertificate: true,
    certificateIssued: true,
    certificateId: "IPTI-CERT-2026-1120",
    attendance: 94,
    projectTitle: "Automotive Transmission Casing Parametric Design (GD&T)",
    password: "ipti@123",
    hasChangedPassword: false,
    notes: "ISO Certificate issued. 100% attendance in SolidWorks module.",
    createdAt: "2026-01-20T11:00:00.000Z",
    updatedAt: "2026-03-02T09:15:00.000Z"
  },
  {
    id: "cand_2026_stu_04",
    studentId: "IPTI-2026-STU-04",
    fullName: "Neha S. Patil",
    email: "neha.patil@example.com",
    phone: "+91 98901 23456",
    whatsapp: "+91 98901 23456",
    program: "AI, Machine Learning & Vision Systems",
    batch: "Evening Cohort (06:00 PM - 09:00 PM)",
    admissionDate: "2026-02-01",
    learningMode: "Online Live Interactive",
    totalFees: 42000,
    paidFees: 42000,
    balanceFees: 0,
    paymentStatus: "Paid",
    paymentHistory: [
      { id: "pay_401", date: "2026-02-01", amount: 42000, method: "Razorpay / UPI", receiptNo: "REC-2026-172", notes: "Full program fee paid" }
    ],
    eligibleForCertificate: true,
    certificateIssued: true,
    certificateId: "IPTI-CERT-2026-1205",
    attendance: 97,
    projectTitle: "Edge AI Industrial Defect Detection with TensorRT",
    password: "ipti@123",
    hasChangedPassword: false,
    notes: "Top scorer in cohort. Successfully verified diploma.",
    createdAt: "2026-02-01T14:20:00.000Z",
    updatedAt: "2026-03-10T14:20:00.000Z"
  },
  {
    id: "cand_2026_stu_05",
    studentId: "IPTI-2026-STU-05",
    fullName: "Aryan Dewade",
    email: "aryandewade1214@gmail.com",
    phone: "+91 92729 02182",
    whatsapp: "+91 92729 02182",
    program: "AI, Machine Learning & Vision Systems",
    batch: "Morning Cohort (09:00 AM - 01:00 PM)",
    admissionDate: "2026-11-20",
    learningMode: "Classroom Training",
    totalFees: 40000,
    paidFees: 40000,
    balanceFees: 0,
    paymentStatus: "Paid",
    paymentHistory: [
      { id: "pay_501", date: "2026-11-20", amount: 40000, method: "UPI Transfer", receiptNo: "REC-2026-210", notes: "Full upfront cohort registration" }
    ],
    eligibleForCertificate: true,
    certificateIssued: false,
    certificateId: "",
    attendance: 95,
    projectTitle: "Computer Vision Automated Quality Inspection",
    password: "ipti@123",
    hasChangedPassword: false,
    notes: "Ready for certificate issuance. Capstone reviewed by industry lead.",
    createdAt: "2026-11-20T09:00:00.000Z",
    updatedAt: "2026-11-20T09:00:00.000Z"
  }
];

function readCandidates() {
  try {
    if (!fs.existsSync(candidatesFile)) {
      writeCandidates(defaultCandidates);
      return defaultCandidates;
    }
    const raw = fs.readFileSync(candidatesFile, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    return parsed.length > 0 ? parsed : defaultCandidates;
  } catch (err) {
    console.error('Error reading candidates database:', err);
    return defaultCandidates;
  }
}

function writeCandidates(candidates) {
  try {
    fs.writeFileSync(candidatesFile, JSON.stringify(candidates, null, 2), 'utf-8');
    if (isMongoConnected) {
      syncCandidatesToMongo(candidates);
    }
    return true;
  } catch (err) {
    console.error('Error writing candidates database:', err);
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
    if (isMongoConnected) {
      syncEnquiriesToMongo(enquiries);
    }
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

// Defensive HTTP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  next();
});

// Sensitive Static Route & System File Shielding
// Completely blocks direct web requests to /data JSON files, server source code, packages & configs
app.use((req, res, next) => {
  const normalizedPath = (req.path || '').toLowerCase().replace(/\\/g, '/');
  const blockedPatterns = [
    /^\/data(\/|$)/,
    /^\/server\.js(\/|$)/,
    /^\/package\.json(\/|$)/,
    /^\/package-lock\.json(\/|$)/,
    /^\/test-suite\.js(\/|$)/,
    /^\/\.env(\/|$)/,
    /^\/\.git(\/|$)/
  ];

  if (blockedPatterns.some(pattern => pattern.test(normalizedPath))) {
    return res.status(403).json({ success: false, error: 'Access forbidden: Protected system resource' });
  }
  next();
});

// Safe Static Asset Serving (whitelist /assets, /uploads and safe public files, ignoring dotfiles)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname, {
  dotfiles: 'ignore',
  index: ['index.html']
}));

// Route Aliases
app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, 'verify.html')));
app.get('/verify-certificate', (req, res) => res.sendFile(path.join(__dirname, 'verify.html')));
app.get('/learner', (req, res) => res.sendFile(path.join(__dirname, 'learner.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

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

// Learner Token Generator & Validator
function generateLearnerToken(studentId) {
  const payload = `${studentId}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', LEARNER_SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyLearnerToken(token) {
  try {
    if (!token) return false;
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [studentId, timestamp, signature] = decoded.split(':');
    const expectedSig = crypto.createHmac('sha256', LEARNER_SECRET_KEY).update(`${studentId}:${timestamp}`).digest('hex');
    
    if (signature !== expectedSig) return false;
    
    // Check expiration (7 days for learner portal)
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 7 * 24 * 60 * 60 * 1000) return false;
    
    return { studentId };
  } catch (e) {
    return false;
  }
}

// Auth Middleware for protected learner routes
function requireLearner(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Learner authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const learner = verifyLearnerToken(token);
  if (!learner) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired learner session' });
  }

  req.learner = learner;
  next();
}

// =========================================================================
// DEFENSIVE SECURITY & CRYPTOGRAPHY UTILITIES
// =========================================================================

// In-Memory Sliding-Window Rate Limiter for Authentication Endpoints (Brute-force protection)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const MAX_LOGIN_ATTEMPTS = 25; // 25 attempts per IP per 15 minutes

function authRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };

  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    record.count = 1;
    record.firstAttempt = now;
  } else {
    record.count += 1;
  }
  loginAttempts.set(ip, record);

  if (record.count > MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    });
  }
  next();
}

// Constant-time string comparison helper to prevent timing side channels
function safeStringCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Password Hashing & Verification Utilities (Node.js Native scrypt + salt)
function hashPassword(plain) {
  if (!plain) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plain, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(plain, stored) {
  if (!stored || !plain) return false;
  if (!stored.startsWith('scrypt:')) {
    // Backward compatibility with initial plaintext seeds (e.g. ipti@123)
    return plain === stored;
  }
  try {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    const keyBuffer = Buffer.from(hash, 'hex');
    const derivedKey = crypto.scryptSync(plain, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
}

// Candidate Payload Sanitizer (Redacts password / hash from all outgoing API responses)
function sanitizeCandidate(cand) {
  if (!cand || typeof cand !== 'object') return cand;
  const { password, ...safe } = cand;
  return safe;
}

// =========================================================================
// API ROUTES
// =========================================================================

// 1. Health check & Database Status
app.get('/api/health', (req, res) => {
  const count = readEnquiries().length;
  res.json({
    status: 'online',
    institution: 'IPTI - Institute of Professional Training & Innovation',
    database: isMongoConnected ? 'MongoDB Atlas (ipti_db)' : 'Local Persistent JSON Storage (data/*.json)',
    mongoConnected: isMongoConnected,
    totalEnquiries: count,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/database/status', (req, res) => {
  res.json({
    success: true,
    connected: isMongoConnected,
    mode: isMongoConnected ? 'MongoDB Atlas Cloud' : 'Local Persistent JSON Storage',
    database: isMongoConnected ? 'ipti_db' : 'Local data/*.json files',
    hasPasswordPlaceholder: Boolean(MONGODB_URI && MONGODB_URI.includes('<db_password>')),
    message: isMongoConnected
      ? 'Connected and synchronized with MongoDB Atlas cluster.'
      : (MONGODB_URI && MONGODB_URI.includes('<db_password>'))
        ? 'Placeholder <db_password> detected in MONGODB_URI. Please replace with your actual password in .env.'
        : 'Running on local persistent JSON database.',
    stats: {
      enquiries: readEnquiries().length,
      candidates: readCandidates().length,
      certificates: readCertificates().length,
      programs: readPrograms().length
    }
  });
});

// 2. Admin Login
const handleAdminLogin = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  if (safeStringCompare(username, ADMIN_USERNAME) && safeStringCompare(password, ADMIN_PASSWORD)) {
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
};

app.post('/api/auth/login', authRateLimiter, handleAdminLogin);
app.post('/api/admin/login', authRateLimiter, handleAdminLogin);

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
      interest: 'Pending',
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
    const { status, interest, course, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    let list = readEnquiries();

    // Filter by status
    if (status && status !== 'All') {
      list = list.filter(item => item.status && item.status.toLowerCase() === status.toLowerCase());
    }

    // Filter by interest
    if (interest && interest !== 'All') {
      list = list.filter(item => (item.interest || 'Pending').toLowerCase() === interest.toLowerCase());
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
      interested: list.filter(i => (i.interest || '').toLowerCase() === 'interested').length,
      converted: list.filter(i => (i.interest || '').toLowerCase() === 'converted').length,
      notInterested: list.filter(i => (i.interest || '').toLowerCase() === 'not interested').length,
      pending: list.filter(i => (i.interest || 'pending').toLowerCase() === 'pending').length,
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
    const { status, priority, interest, newNote } = req.body;

    const list = readEnquiries();
    const index = list.findIndex(item => item.id === id || item.trackingId === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const item = list[index];
    const timestamp = new Date().toISOString();

    if (status) item.status = status;
    if (priority) item.priority = priority;
    if (interest) item.interest = interest;

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

// 2. Program Analytics Endpoint (Must come before :id route)
app.get('/api/programs/analytics', (req, res) => {
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

// 2.5. Upload Syllabus Document for Program (Admin Protected)
app.post('/api/programs/upload-syllabus', requireAdmin, (req, res) => {
  try {
    const { filename, fileData } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ success: false, error: 'Filename and file data are required.' });
    }

    const ext = path.extname(filename) || '.pdf';
    const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `${cleanBase}_${Date.now()}${ext}`;
    const filePath = path.join(syllabusDir, safeName);

    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/uploads/syllabus/${safeName}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      originalName: filename
    });
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
      techTags,
      syllabusUrl,
      syllabusFilename
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
      syllabusUrl: syllabusUrl ? String(syllabusUrl).trim() : '',
      syllabusFilename: syllabusFilename ? String(syllabusFilename).trim() : '',
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
      syllabusUrl,
      syllabusFilename,
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
      syllabusUrl: syllabusUrl !== undefined ? String(syllabusUrl).trim() : (current.syllabusUrl || ''),
      syllabusFilename: syllabusFilename !== undefined ? String(syllabusFilename).trim() : (current.syllabusFilename || ''),
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

// =========================================================================
// CERTIFICATES REST API
// =========================================================================

// 1. Get All Certificates (Admin protected)
app.get('/api/certificates', requireAdmin, (req, res) => {
  try {
    const { program, search, status } = req.query;
    let list = readCertificates();

    if (program && program !== 'All') {
      list = list.filter(c => (c.program || '').toLowerCase().includes(program.toLowerCase()));
    }

    if (status && status !== 'All') {
      list = list.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => 
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        (c.certId && c.certId.toLowerCase().includes(q)) ||
        (c.studentEmail && c.studentEmail.toLowerCase().includes(q)) ||
        (c.program && c.program.toLowerCase().includes(q))
      );
    }

    // Sort by issue date descending
    list.sort((a, b) => new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt));

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Certificate Stats (Admin protected)
app.get('/api/certificates/stats', requireAdmin, (req, res) => {
  try {
    const list = readCertificates();
    const verified = list.filter(c => (c.status || '').toLowerCase() === 'verified').length;
    
    // Top program
    const programCounts = {};
    list.forEach(c => {
      programCounts[c.program] = (programCounts[c.program] || 0) + 1;
    });
    let topProg = 'Industrial Automation & Robotics';
    let max = 0;
    for (const [k, v] of Object.entries(programCounts)) {
      if (v > max) { max = v; topProg = k; }
    }

    res.json({
      success: true,
      stats: {
        total: list.length,
        verified,
        topProgram: topProg
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Verify Certificate & Credential (Public Anti-Fraud Endpoint)
// Rule: When verifying through Student ID, ensure the certificate has actually been generated first!
// If generated -> returns verified certificate & hash.
// If not generated -> explicitly alerts that the certificate must be generated first before verification.
app.get('/api/certificates/verify/:query', (req, res) => {
  try {
    let rawQuery = (req.params.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ success: false, error: 'Certificate ID or Student Unique ID is required' });
    }

    // Clean URL query parameters if pasted by user
    if (rawQuery.includes('?id=')) {
      rawQuery = rawQuery.split('?id=')[1].split('&')[0];
    } else if (rawQuery.includes('?certId=')) {
      rawQuery = rawQuery.split('?certId=')[1].split('&')[0];
    } else if (rawQuery.includes('/verify/')) {
      rawQuery = rawQuery.split('/verify/')[1].split('?')[0];
    }

    const cleanQuery = decodeURIComponent(rawQuery).trim();
    const upperQuery = cleanQuery.toUpperCase();
    const alphaNumQuery = upperQuery.replace(/[^A-Z0-9]/g, '');

    const certs = readCertificates();
    const candidates = readCandidates();

    // -------------------------------------------------------------------------
    // A. CHECK IF QUERY IS SPECIFICALLY A STUDENT ID (e.g. IPTI-2026-STU-XX or STU-XX)
    // -------------------------------------------------------------------------
    const studentCandidate = candidates.find(c => {
      if (!c.studentId) return false;
      const sId = c.studentId.toUpperCase();
      const sAlpha = sId.replace(/[^A-Z0-9]/g, '');
      return sId === upperQuery || (alphaNumQuery.length >= 4 && sAlpha === alphaNumQuery);
    });

    if (studentCandidate) {
      // REQUIREMENT: Make sure certificate is generated first, then verify it!
      const hasGeneratedCert = Boolean(
        studentCandidate.certificateIssued && 
        studentCandidate.certificateId && 
        certs.some(c => c.certId && c.certId.toUpperCase() === studentCandidate.certificateId.toUpperCase())
      );

      if (!hasGeneratedCert) {
        // Certificate is NOT generated yet for this Student ID!
        return res.json({
          success: false,
          type: 'certificate_not_generated',
          status: 'not_generated',
          candidate: {
            studentId: studentCandidate.studentId,
            fullName: studentCandidate.fullName,
            program: studentCandidate.program,
            batch: studentCandidate.batch,
            learningMode: studentCandidate.learningMode || 'Classroom Training',
            admissionDate: studentCandidate.admissionDate,
            eligibleForCertificate: Boolean(studentCandidate.eligibleForCertificate),
            certificateIssued: false,
            message: `Learner record authenticated (${studentCandidate.fullName} • ${studentCandidate.studentId}). However, the official completion certificate has NOT been generated yet. Please generate/issue the certificate through the IPTI Admin Portal first before it can be verified.`
          },
          error: `Certificate has not been generated yet for Student ID "${studentCandidate.studentId}". The certificate must be generated first before verification.`
        });
      }

      // Certificate HAS been generated for this Student ID! Proceed to verify it.
      const cert = certs.find(c => c.certId && c.certId.toUpperCase() === studentCandidate.certificateId.toUpperCase());
      const hashInput = `${cert.certId}:${cert.studentName}:${cert.issueDate}:IPTI_SECURE_REGISTRY_2026`;
      const verificationHash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 24).toUpperCase();

      return res.json({
        success: true,
        type: 'certificate',
        status: 'verified',
        certificate: {
          id: cert.id,
          certId: cert.certId,
          studentName: cert.studentName,
          studentEmail: cert.studentEmail || studentCandidate.email,
          program: cert.program,
          grade: cert.grade || 'Distinction (Grade A+)',
          issueDate: cert.issueDate,
          standard: cert.standard || 'ISO 9001:2015 Accredited Center of Excellence',
          status: cert.status || 'Verified',
          notes: cert.notes || '',
          studentId: studentCandidate.studentId,
          projectTitle: studentCandidate.projectTitle || cert.projectTitle || '',
          learningMode: studentCandidate.learningMode || 'Classroom & Hands-on Lab Practice',
          batch: studentCandidate.batch || '',
          verificationHash: `IPTI-${verificationHash.slice(0, 4)}-${verificationHash.slice(4, 8)}-${verificationHash.slice(8, 12)}`,
          verifiedAt: new Date().toISOString()
        }
      });
    }

    // -------------------------------------------------------------------------
    // B. CHECK DIRECT CERTIFICATE ID QUERY (e.g. IPTI-CERT-2026-XXXX, 5609, 1042)
    // -------------------------------------------------------------------------
    let cert = certs.find(c => {
      if (!c) return false;
      const cId = (c.certId || '').toUpperCase();
      const internalId = (c.id || '').toUpperCase();
      const cAlpha = cId.replace(/[^A-Z0-9]/g, '');

      // 1. Exact certId or internal ID
      if (cId === upperQuery || internalId === upperQuery) return true;
      // 2. Alphanumeric match (ignoring dashes/spaces)
      if (alphaNumQuery && cAlpha === alphaNumQuery) return true;
      // 3. Partial certId suffix (e.g. user typed "5609" or "CERT-2026-5609")
      if (alphaNumQuery.length >= 4 && (cAlpha.endsWith(alphaNumQuery) || cId.endsWith(upperQuery))) return true;

      return false;
    });

    if (cert) {
      // Find linked candidate for additional dossier context
      const linkedCandidate = candidates.find(c => 
        (c.certificateId && c.certificateId.toUpperCase() === cert.certId.toUpperCase()) ||
        (c.email && cert.studentEmail && c.email.toLowerCase() === cert.studentEmail.toLowerCase()) ||
        (c.fullName && cert.studentName && c.fullName.toLowerCase() === cert.studentName.toLowerCase())
      );

      const hashInput = `${cert.certId}:${cert.studentName}:${cert.issueDate}:IPTI_SECURE_REGISTRY_2026`;
      const verificationHash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 24).toUpperCase();

      return res.json({
        success: true,
        type: 'certificate',
        status: 'verified',
        certificate: {
          id: cert.id,
          certId: cert.certId,
          studentName: cert.studentName,
          studentEmail: cert.studentEmail || (linkedCandidate ? linkedCandidate.email : ''),
          program: cert.program,
          grade: cert.grade || 'Distinction (Grade A+)',
          issueDate: cert.issueDate,
          standard: cert.standard || 'ISO 9001:2015 Accredited Center of Excellence',
          status: cert.status || 'Verified',
          notes: cert.notes || '',
          studentId: linkedCandidate ? linkedCandidate.studentId : (cert.studentId || null),
          projectTitle: linkedCandidate ? linkedCandidate.projectTitle : (cert.projectTitle || ''),
          learningMode: linkedCandidate ? linkedCandidate.learningMode : 'Classroom & Hands-on Lab Practice',
          batch: linkedCandidate ? linkedCandidate.batch : '',
          verificationHash: `IPTI-${verificationHash.slice(0, 4)}-${verificationHash.slice(4, 8)}-${verificationHash.slice(8, 12)}`,
          verifiedAt: new Date().toISOString()
        }
      });
    }

    // -------------------------------------------------------------------------
    // C. CREDENTIAL NOT FOUND ANYWHERE (Anti-Fraud Warning)
    // -------------------------------------------------------------------------
    return res.status(404).json({
      success: false,
      status: 'not_found',
      error: `No credential or enrolled student record matches ID "${cleanQuery}" in the IPTI central academic registry.`
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Issue New Certificate (Admin protected)
app.post('/api/certificates', requireAdmin, (req, res) => {
  try {
    const { studentName, studentEmail, studentPhone, program, grade, issueDate, standard, notes, certId } = req.body;
    if (!studentName || !program) {
      return res.status(400).json({ success: false, error: 'Student name and program are required' });
    }

    const list = readCertificates();
    const timestamp = new Date().toISOString();
    const generatedCertId = certId && certId.trim() ? certId.trim() : `IPTI-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCert = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      certId: generatedCertId,
      studentName: studentName.trim(),
      studentEmail: studentEmail ? studentEmail.trim() : '',
      studentPhone: studentPhone ? studentPhone.trim() : '',
      program: program.trim(),
      grade: grade ? grade.trim() : 'Distinction (Grade A+)',
      issueDate: issueDate || timestamp.slice(0, 10),
      standard: standard ? standard.trim() : 'ISO 9001:2015 Accredited',
      status: 'Verified',
      notes: notes ? notes.trim() : '',
      createdAt: timestamp
    };

    list.unshift(newCert);
    writeCertificates(list);

    // Automatically synchronize and link candidate record if one matches this email or student name
    try {
      const candidates = readCandidates();
      const candIdx = candidates.findIndex(c =>
        (studentEmail && c.email && c.email.toLowerCase() === studentEmail.trim().toLowerCase()) ||
        (studentName && c.fullName && c.fullName.toLowerCase() === studentName.trim().toLowerCase())
      );
      if (candIdx !== -1) {
        candidates[candIdx].certificateIssued = true;
        candidates[candIdx].certificateId = generatedCertId;
        candidates[candIdx].eligibleForCertificate = true;
        candidates[candIdx].updatedAt = timestamp;
        writeCandidates(candidates);
      }
    } catch (candSyncErr) {
      console.warn('Candidate sync notice:', candSyncErr.message);
    }

    res.status(201).json({ success: true, message: 'Certificate issued successfully', data: newCert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Update Certificate (Admin protected)
app.put('/api/certificates/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const list = readCertificates();
    const index = list.findIndex(c => c.id === id || c.certId === id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    const { studentName, studentEmail, studentPhone, program, grade, issueDate, standard, status, notes } = req.body;
    const cert = list[index];

    if (studentName) cert.studentName = studentName.trim();
    if (studentEmail !== undefined) cert.studentEmail = studentEmail.trim();
    if (studentPhone !== undefined) cert.studentPhone = studentPhone.trim();
    if (program) cert.program = program.trim();
    if (grade) cert.grade = grade.trim();
    if (issueDate) cert.issueDate = issueDate;
    if (standard) cert.standard = standard.trim();
    if (status) cert.status = status.trim();
    if (notes !== undefined) cert.notes = notes.trim();

    cert.updatedAt = new Date().toISOString();
    list[index] = cert;
    writeCertificates(list);

    res.json({ success: true, message: 'Certificate updated successfully', data: cert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Delete / Revoke Certificate (Admin protected)
app.delete('/api/certificates/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let list = readCertificates();
    const originalLen = list.length;
    list = list.filter(c => c.id !== id && c.certId !== id);

    if (list.length === originalLen) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    writeCertificates(list);
    res.json({ success: true, message: 'Certificate revoked and deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// CONVERTED CANDIDATES (LMS DATABASE) API ROUTES
// =========================================================================

// 1. Get All Converted Candidates (Admin protected)
app.get('/api/candidates', requireAdmin, (req, res) => {
  try {
    const { search, program, paymentStatus, eligible } = req.query;
    let list = readCandidates();

    // Filter by program
    if (program && program !== 'All') {
      list = list.filter(c => c.program && c.program.toLowerCase().includes(program.toLowerCase()));
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== 'All') {
      list = list.filter(c => (c.paymentStatus || '').toLowerCase() === paymentStatus.toLowerCase());
    }

    // Filter by certificate eligibility
    if (eligible && eligible !== 'All') {
      if (eligible === 'true' || eligible === 'eligible') {
        list = list.filter(c => Boolean(c.eligibleForCertificate));
      } else if (eligible === 'false' || eligible === 'ineligible') {
        list = list.filter(c => !c.eligibleForCertificate);
      }
    }

    // Search query (name, email, phone, studentId, project)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.studentId && c.studentId.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.program && c.program.toLowerCase().includes(q)) ||
        (c.projectTitle && c.projectTitle.toLowerCase().includes(q))
      );
    }

    // Sort descending by admission / creation date
    list.sort((a, b) => new Date(b.admissionDate || b.createdAt || 0) - new Date(a.admissionDate || a.createdAt || 0));

    res.json({ success: true, count: list.length, data: list.map(sanitizeCandidate) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Candidate Database Stats & Financial Overview (Admin protected)
app.get('/api/candidates/stats', requireAdmin, (req, res) => {
  try {
    const list = readCandidates();

    const totalFees = list.reduce((sum, c) => sum + (Number(c.totalFees) || 0), 0);
    const feesCollected = list.reduce((sum, c) => sum + (Number(c.paidFees) || 0), 0);
    const feesPending = list.reduce((sum, c) => sum + (Math.max(0, (Number(c.totalFees) || 0) - (Number(c.paidFees) || 0))), 0);

    const stats = {
      total: list.length,
      totalFees,
      feesCollected,
      feesPending,
      fullyPaid: list.filter(c => (c.paymentStatus || '').toLowerCase() === 'paid').length,
      partialPaid: list.filter(c => (c.paymentStatus || '').toLowerCase() === 'partial').length,
      pendingPaid: list.filter(c => (c.paymentStatus || '').toLowerCase() === 'pending').length,
      eligibleForCertificate: list.filter(c => Boolean(c.eligibleForCertificate)).length,
      certificateIssued: list.filter(c => Boolean(c.certificateIssued)).length
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Single Candidate by ID (Admin protected)
app.get('/api/candidates/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const list = readCandidates();
    const candidate = list.find(c => c.id === id || c.studentId.toUpperCase() === id.toUpperCase());
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate record not found' });
    }
    res.json({ success: true, data: sanitizeCandidate(candidate) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create New Converted Candidate (Admin protected)
app.post('/api/candidates', requireAdmin, (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      whatsapp,
      program,
      batch,
      admissionDate,
      learningMode,
      totalFees,
      paidFees,
      eligibleForCertificate,
      projectTitle,
      attendance,
      notes
    } = req.body;

    if (!fullName || !email || !program) {
      return res.status(400).json({ success: false, error: 'Candidate Full Name, Email, and Program are required' });
    }

    const list = readCandidates();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    if (list.some(c => c.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ success: false, error: 'A student candidate with this email address already exists.' });
    }

    const year = new Date().getFullYear();
    const stuNum = String(list.length + 1).padStart(2, '0');
    const studentId = `IPTI-${year}-STU-${stuNum}`;
    const timestamp = new Date().toISOString();

    const tFees = Number(totalFees) || 0;
    const pFees = Number(paidFees) || 0;
    const bFees = Math.max(0, tFees - pFees);

    let paymentStatus = 'Pending';
    if (bFees === 0 && tFees > 0) paymentStatus = 'Paid';
    else if (pFees > 0) paymentStatus = 'Partial';

    const paymentHistory = [];
    if (pFees > 0) {
      paymentHistory.push({
        id: `pay_${Date.now()}`,
        date: admissionDate || timestamp.slice(0, 10),
        amount: pFees,
        method: 'Initial Payment / Net Banking',
        receiptNo: `REC-${year}-${Math.floor(100 + Math.random() * 900)}`,
        notes: 'Initial admission fee payment'
      });
    }

    const newCandidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      whatsapp: (whatsapp || phone || '').trim(),
      program: program.trim(),
      batch: batch || 'Morning Cohort (09:00 AM - 01:00 PM)',
      admissionDate: admissionDate || timestamp.slice(0, 10),
      learningMode: learningMode || 'Classroom Training',
      totalFees: tFees,
      paidFees: pFees,
      balanceFees: bFees,
      paymentStatus,
      paymentHistory,
      eligibleForCertificate: Boolean(eligibleForCertificate),
      certificateIssued: false,
      certificateId: '',
      attendance: Number(attendance) || 90,
      projectTitle: projectTitle ? projectTitle.trim() : 'Industrial Capstone Benchmark',
      password: hashPassword('ipti@123'),
      hasChangedPassword: false,
      notes: notes ? notes.trim() : 'Newly enrolled candidate.',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    list.unshift(newCandidate);
    writeCandidates(list);

    res.status(201).json({ success: true, message: 'Candidate enrolled successfully', data: sanitizeCandidate(newCandidate) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Update Candidate Details (Admin protected)
app.patch('/api/candidates/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const list = readCandidates();
    const index = list.findIndex(c => c.id === id || c.studentId.toUpperCase() === id.toUpperCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const cand = list[index];
    const {
      fullName,
      email,
      phone,
      whatsapp,
      program,
      batch,
      admissionDate,
      learningMode,
      totalFees,
      paidFees,
      eligibleForCertificate,
      certificateIssued,
      certificateId,
      attendance,
      projectTitle,
      notes
    } = req.body;

    if (fullName) cand.fullName = fullName.trim();
    if (email) cand.email = email.trim().toLowerCase();
    if (phone) cand.phone = phone.trim();
    if (whatsapp) cand.whatsapp = whatsapp.trim();
    if (program) cand.program = program.trim();
    if (batch) cand.batch = batch.trim();
    if (admissionDate) cand.admissionDate = admissionDate;
    if (learningMode) cand.learningMode = learningMode;
    if (notes !== undefined) cand.notes = notes.trim();
    if (projectTitle !== undefined) cand.projectTitle = projectTitle.trim();
    if (attendance !== undefined) cand.attendance = Number(attendance);

    if (eligibleForCertificate !== undefined) {
      cand.eligibleForCertificate = Boolean(eligibleForCertificate);
    }
    if (certificateIssued !== undefined) {
      cand.certificateIssued = Boolean(certificateIssued);
    }
    if (certificateId !== undefined) {
      cand.certificateId = certificateId.trim();
    }

    if (totalFees !== undefined || paidFees !== undefined) {
      const tFees = totalFees !== undefined ? Number(totalFees) : cand.totalFees;
      const pFees = paidFees !== undefined ? Number(paidFees) : cand.paidFees;
      cand.totalFees = tFees;
      cand.paidFees = pFees;
      cand.balanceFees = Math.max(0, tFees - pFees);

      if (cand.balanceFees === 0 && tFees > 0) cand.paymentStatus = 'Paid';
      else if (pFees > 0) cand.paymentStatus = 'Partial';
      else cand.paymentStatus = 'Pending';
    }

    cand.updatedAt = new Date().toISOString();
    list[index] = cand;
    writeCandidates(list);

    res.json({ success: true, message: 'Candidate details updated successfully', data: sanitizeCandidate(cand) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Toggle Certificate Eligibility for Candidate (Admin protected)
app.patch('/api/candidates/:id/toggle-eligibility', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const list = readCandidates();
    const index = list.findIndex(c => c.id === id || c.studentId.toUpperCase() === id.toUpperCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const cand = list[index];
    cand.eligibleForCertificate = !cand.eligibleForCertificate;
    cand.updatedAt = new Date().toISOString();

    list[index] = cand;
    writeCandidates(list);

    res.json({
      success: true,
      eligible: cand.eligibleForCertificate,
      message: cand.eligibleForCertificate
        ? `Candidate marked as ELIGIBLE for Certificate.`
        : `Certificate eligibility revoked for candidate.`,
      data: sanitizeCandidate(cand)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Record Fee Payment Installment (Admin protected)
app.post('/api/candidates/:id/payments', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method, receiptNo, date, notes } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
    }

    const list = readCandidates();
    const index = list.findIndex(c => c.id === id || c.studentId.toUpperCase() === id.toUpperCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const cand = list[index];
    if (!Array.isArray(cand.paymentHistory)) cand.paymentHistory = [];

    const newPayment = {
      id: `pay_${Date.now()}`,
      date: date || new Date().toISOString().slice(0, 10),
      amount: numAmount,
      method: method || 'UPI / Net Banking',
      receiptNo: receiptNo || `REC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      notes: notes ? notes.trim() : 'Course fee installment'
    };

    cand.paymentHistory.push(newPayment);
    cand.paidFees = (Number(cand.paidFees) || 0) + numAmount;
    cand.balanceFees = Math.max(0, (Number(cand.totalFees) || 0) - cand.paidFees);

    if (cand.balanceFees === 0 && cand.totalFees > 0) cand.paymentStatus = 'Paid';
    else if (cand.paidFees > 0) cand.paymentStatus = 'Partial';
    else cand.paymentStatus = 'Pending';

    cand.updatedAt = new Date().toISOString();
    list[index] = cand;
    writeCandidates(list);

    res.json({ success: true, message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully`, data: sanitizeCandidate(cand), payment: newPayment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Convert Enquiry Lead to Candidate (Admin protected)
app.post('/api/enquiries/:id/convert', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { totalFees, paidFees, batch, learningMode, notes } = req.body;

    const enquiries = readEnquiries();
    const enqIndex = enquiries.findIndex(e => e.id === id || e.trackingId === id);
    if (enqIndex === -1) {
      return res.status(404).json({ success: false, error: 'Enquiry lead not found' });
    }

    const enq = enquiries[enqIndex];
    const candidates = readCandidates();

    // Check if already converted
    const existingCand = candidates.find(c => c.email.toLowerCase() === enq.email.toLowerCase());
    if (existingCand) {
      // Mark enquiry as converted
      enq.interest = 'Converted';
      enq.status = 'Enrolled';
      enquiries[enqIndex] = enq;
      writeEnquiries(enquiries);
      return res.json({ success: true, message: 'Lead already enrolled as student candidate', data: sanitizeCandidate(existingCand) });
    }

    const year = new Date().getFullYear();
    const stuNum = String(candidates.length + 1).padStart(2, '0');
    const studentId = `IPTI-${year}-STU-${stuNum}`;
    const timestamp = new Date().toISOString();

    const tFees = Number(totalFees) || 35000;
    const pFees = Number(paidFees) || 0;
    const bFees = Math.max(0, tFees - pFees);

    let paymentStatus = 'Pending';
    if (bFees === 0 && tFees > 0) paymentStatus = 'Paid';
    else if (pFees > 0) paymentStatus = 'Partial';

    const paymentHistory = [];
    if (pFees > 0) {
      paymentHistory.push({
        id: `pay_${Date.now()}`,
        date: timestamp.slice(0, 10),
        amount: pFees,
        method: 'Admission Booking Payment',
        receiptNo: `REC-${year}-${Math.floor(100 + Math.random() * 900)}`,
        notes: 'Initial fee token on conversion from Enquiry CRM'
      });
    }

    const newCandidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      fullName: enq.fullName,
      email: enq.email.toLowerCase(),
      phone: enq.phone,
      whatsapp: enq.whatsapp || enq.phone,
      program: enq.course || 'Industrial Automation & Robotics (PLC/SCADA)',
      batch: batch || 'Morning Cohort (09:00 AM - 01:00 PM)',
      admissionDate: timestamp.slice(0, 10),
      learningMode: learningMode || enq.learningMode || 'Classroom Training',
      totalFees: tFees,
      paidFees: pFees,
      balanceFees: bFees,
      paymentStatus,
      paymentHistory,
      eligibleForCertificate: false,
      certificateIssued: false,
      certificateId: '',
      attendance: 90,
      projectTitle: 'Industrial Capstone Project',
      password: hashPassword('ipti@123'),
      hasChangedPassword: false,
      notes: notes ? notes.trim() : `Converted from enquiry (${enq.trackingId}).`,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    candidates.unshift(newCandidate);
    writeCandidates(candidates);

    // Update enquiry record
    enq.interest = 'Converted';
    enq.status = 'Enrolled';
    if (!Array.isArray(enq.notes)) enq.notes = [];
    enq.notes.unshift({
      note: `Lead successfully CONVERTED to Enrolled Student. Student ID: ${studentId}`,
      author: req.admin.username || 'Admin',
      timestamp
    });
    enquiries[enqIndex] = enq;
    writeEnquiries(enquiries);

    res.status(201).json({
      success: true,
      message: `Lead converted successfully! Assigned Student ID: ${studentId}`,
      data: sanitizeCandidate(newCandidate)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Delete Candidate Record (Admin protected)
app.delete('/api/candidates/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let list = readCandidates();
    const originalLen = list.length;
    list = list.filter(c => c.id !== id && c.studentId !== id);

    if (list.length === originalLen) {
      return res.status(404).json({ success: false, error: 'Candidate record not found' });
    }

    writeCandidates(list);
    res.json({ success: true, message: 'Candidate record removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Export Candidates as CSV (Admin protected or token in query)
app.get('/api/candidates/export/csv', (req, res) => {
  try {
    const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    const valid = verifyToken(token);
    if (!valid) {
      return res.status(401).send('Unauthorized: Valid token required for CSV download');
    }

    const list = readCandidates();

    const headers = [
      'Student ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Enrolled Program',
      'Batch Timing',
      'Admission Date',
      'Learning Mode',
      'Total Fees (INR)',
      'Paid Fees (INR)',
      'Balance Due (INR)',
      'Payment Status',
      'Eligible For Certificate',
      'Certificate Issued',
      'Certificate ID',
      'Attendance (%)',
      'Capstone Project'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map(c => [
      escapeCsv(c.studentId),
      escapeCsv(c.fullName),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.program),
      escapeCsv(c.batch),
      escapeCsv(c.admissionDate),
      escapeCsv(c.learningMode),
      escapeCsv(c.totalFees),
      escapeCsv(c.paidFees),
      escapeCsv(c.balanceFees),
      escapeCsv(c.paymentStatus),
      escapeCsv(c.eligibleForCertificate ? 'Yes' : 'No'),
      escapeCsv(c.certificateIssued ? 'Yes' : 'No'),
      escapeCsv(c.certificateId || 'N/A'),
      escapeCsv(`${c.attendance || 0}%`),
      escapeCsv(c.projectTitle)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const fileName = `IPTI_Converted_Candidates_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(200).send(csvContent);
  } catch (err) {
    res.status(500).send('Error generating CSV export: ' + err.message);
  }
});

// =========================================================================
// LEARNER CANDIDATE PORTAL API ROUTES (STUDENT LOGIN & PROFILE)
// =========================================================================

// 1. Learner Login (Public with Rate Limiting)
app.post('/api/learner/login', authRateLimiter, (req, res) => {
  try {
    const studentId = req.body.studentId || req.body.loginId || req.body.username || req.body.email;
    const password = req.body.password;

    if (!studentId || !password) {
      return res.status(400).json({ success: false, error: 'Student ID / Email and password are required' });
    }

    const list = readCandidates();
    const cleanId = studentId.trim();

    const candidateIndex = list.findIndex(c =>
      (c.studentId && c.studentId.toUpperCase() === cleanId.toUpperCase()) ||
      (c.email && c.email.toLowerCase() === cleanId.toLowerCase())
    );

    if (candidateIndex === -1) {
      return res.status(401).json({ success: false, error: 'No enrolled student record found for this Student ID or Email.' });
    }

    const candidate = list[candidateIndex];
    const currentPass = candidate.password || 'ipti@123';
    if (!verifyPassword(password.trim(), currentPass)) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Default initial password is ipti@123' });
    }

    // Transparently upgrade legacy plaintext password to secure scrypt hash on successful login
    if (!candidate.password || !candidate.password.startsWith('scrypt:')) {
      candidate.password = hashPassword(password.trim());
      list[candidateIndex] = candidate;
      writeCandidates(list);
    }

    const token = generateLearnerToken(candidate.studentId);

    res.json({
      success: true,
      message: 'Login successful. Welcome to IPTI Learner Portal!',
      token,
      student: {
        id: candidate.id,
        studentId: candidate.studentId,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        program: candidate.program,
        batch: candidate.batch,
        admissionDate: candidate.admissionDate,
        learningMode: learningModeSafe(candidate),
        hasChangedPassword: Boolean(candidate.hasChangedPassword)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function learningModeSafe(cand) {
  return cand.learningMode || 'Classroom Training';
}

// 2. Get Logged-In Learner Profile, Fees, & Certificate Status (Learner protected)
app.get('/api/learner/profile', requireLearner, (req, res) => {
  try {
    const { studentId } = req.learner;
    const candidates = readCandidates();
    const cand = candidates.find(c => c.studentId.toUpperCase() === studentId.toUpperCase());

    if (!cand) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    // Look for matching certificate in certificates database
    const certificates = readCertificates();
    const matchingCert = certificates.find(cert =>
      (cand.certificateId && cert.certId.toUpperCase() === cand.certificateId.toUpperCase()) ||
      cert.studentEmail.toLowerCase() === cand.email.toLowerCase() ||
      cert.studentName.toLowerCase() === cand.fullName.toLowerCase()
    );

    // Sanitize password out of response
    const safeStudent = sanitizeCandidate(cand);

    res.json({
      success: true,
      student: safeStudent,
      certificate: matchingCert || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Learner Change Password (Learner protected)
app.post('/api/learner/change-password', requireLearner, (req, res) => {
  try {
    const { studentId } = req.learner;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    const list = readCandidates();
    const index = list.findIndex(c => c.studentId.toUpperCase() === studentId.toUpperCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Student record not found' });
    }

    const cand = list[index];
    const actualCurrent = cand.password || 'ipti@123';

    if (!verifyPassword(currentPassword, actualCurrent)) {
      return res.status(400).json({ success: false, error: 'Current password does not match.' });
    }

    cand.password = hashPassword(newPassword.trim());
    cand.hasChangedPassword = true;
    cand.updatedAt = new Date().toISOString();

    list[index] = cand;
    writeCandidates(list);

    res.json({
      success: true,
      message: 'Password changed successfully! Please use your new password for all future logins.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Learner Profile Photo Upload (Learner protected)
app.post('/api/learner/photo', requireLearner, (req, res) => {
  try {
    const { studentId } = req.learner;
    const { photoData, filename } = req.body;
    if (!photoData) {
      return res.status(400).json({ success: false, error: 'Photo data is required' });
    }

    const ext = filename ? (path.extname(filename) || '.jpg') : '.jpg';
    const cleanId = studentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `avatar_${cleanId}_${Date.now()}${ext}`;
    const filePath = path.join(avatarsDir, safeName);

    const base64Data = photoData.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const publicUrl = `/uploads/avatars/${safeName}`;
    const candidates = readCandidates();
    const cand = candidates.find(c => c.studentId.toUpperCase() === studentId.toUpperCase());
    if (cand) {
      cand.photoUrl = publicUrl;
      cand.avatarUrl = publicUrl;
      cand.updatedAt = new Date().toISOString();
      writeCandidates(candidates);
    }

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      photoUrl: publicUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Learner Update Profile Details (Learner protected)
app.put('/api/learner/profile', requireLearner, (req, res) => {
  try {
    const { studentId } = req.learner;
    const { phone, whatsapp, photoUrl } = req.body;
    const candidates = readCandidates();
    const cand = candidates.find(c => c.studentId.toUpperCase() === studentId.toUpperCase());
    if (!cand) {
      return res.status(404).json({ success: false, error: 'Student record not found' });
    }

    if (phone !== undefined) cand.phone = String(phone).trim();
    if (whatsapp !== undefined) cand.whatsapp = String(whatsapp).trim();
    if (photoUrl !== undefined) {
      cand.photoUrl = String(photoUrl).trim();
      cand.avatarUrl = String(photoUrl).trim();
    }
    cand.updatedAt = new Date().toISOString();
    writeCandidates(candidates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      student: sanitizeCandidate(cand)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server (when running standalone directly, not when imported)
const isDirectRun = process.argv[1] && (fileURLToPath(import.meta.url) === process.argv[1] || process.argv[1].endsWith('server.js'));
if (!isVercel && isDirectRun) {
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
