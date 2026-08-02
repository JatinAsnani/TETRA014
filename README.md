# 🛡️ FRIDAY — AI-Powered Invoice Risk & Anomaly Scanner
> **TetraTHON 2026 — Track C: FinTech (Problem Statement 1)**  
> *AI-Powered Invoice Risk Scanner & Reconciliation Platform for MSMEs and Audit Teams.*

---

## 🎯 Executive Overview & Hackathon Challenge

Small and Medium Enterprises (MSMEs) and audit teams process thousands of invoices, vouchers, and accounting entries across different file formats. Manual vouching is time-consuming and sample-based, leaving businesses exposed to **duplicate invoices**, **GSTIN validation errors**, **tax math discrepancies**, and **unsupported ledger mismatches**.

**FRIDAY** solves this challenge with an end-to-end AI Screening Engine that reads multi-format invoice documents (PDF, JPG/PNG, Excel, CSV, Word), extracts structured fields via Gemini Vision AI, cross-reconciles records against purchase ledgers & GSTIN vendor masters, and classifies risks into actionable audit buckets.

---

## ✨ Winning Features & Innovation Highlights

### ⚡ 1. Multi-Format AI Data Extraction Engine
- **Multi-File Ingestion**: Accepts `.pdf`, `.jpg`, `.png`, `.xlsx`, `.csv`, `.docx` documents.
- **Dual AI + OCR Pipeline**: Gemini 2.5 Flash Vision AI + OCR.space API fallback parser.
- **Post-Total Tender Truncation**: Ignores payment tender lines (`Cash Tendered`, `Change Given`, `Auth Codes`).

### 🔍 2. Automated Ledger & Vendor Master Reconciliation
- **GSTIN Master Verification**: 15-character checksum & format validator.
- **Duplicate Invoice Detector**: Scans session history and purchase ledger database for duplicate invoice numbers and vendor totals.
- **Math Discrepancy Engine**: Flags line item additions where `Taxable Value + GST != Total Amount`.
- **Vendor Cadence Anomaly**: Identifies sudden burst transactions (>3 invoices from the same vendor in 48 hours).

### 🚨 3. Prioritized Anomaly Classification & Audit Trail
- **Confidence-Weighted Risk Score**: 0 to 100 Risk Rating assigned to every flag.
- **3 Audit Buckets**:
  - 🔴 `VERIFIED_MISMATCH` (Duplicate invoices, verified math errors, wrong GSTINs).
  - 🟡 `UNRESOLVED_INCONSISTENCY` (Amount exceeds purchase ledger order).
  - ⚪ `MISSING_INFORMATION` (Missing GSTIN, unlinked vendor master).
- **Side-by-Side Audit Trail**: Direct visual verification modal comparing extracted fields against ledger snapshots.

### 📈 4. Audit Readiness Report & AI Follow-Up Generator
- **0–100% Audit Readiness Score**: Real-time compliance health summary for GST & IT filings.
- **Auto-Generated Follow-Up Questions**: 1-click ready-to-send copyable query text for vendors and accounts team.
- **⚡ 1-Click Synthetic Test Dataset**: Judges & evaluators can click 1 button to instantly pre-load 5 predefined test MSME invoices with all accounting exceptions and test the entire scanner pipeline immediately.

---

## 🛠️ Technology Architecture & Stack

```mermaid
graph TD
    A[Invoice File PDF / Image / Excel] -->|Upload| B[Vite React Frontend]
    B -->|REST API| C[FastAPI Python Backend]
    C -->|Vision Extraction| D[Google Gemini 2.5 Flash AI]
    C -->|Fallback OCR| E[OCR.space API]
    C -->|Reconcile & Audit Rules| F[Reconciliation Engine]
    F -->|SQLite / MongoDB Atlas| G[(Persistent DB Storage)]
    F -->|Risk Scoring & Classification| H[Audit Readiness Dashboard]
```

- **Frontend**: React 18, Vite, TailwindCSS, Chart.js, Axios, Dual Dark/Light Mode Design System
- **Backend**: FastAPI (Python 3.11), SQLAlchemy, PyMongo, Pydantic, Uvicorn
- **AI / OCR**: Google Gemini Vision API (`gemini-2.5-flash`), OCR.space Engine
- **Databases**: SQLite (`friday.db`), MongoDB Atlas Cloud Connection (`mongodb+srv://`)

---

## 📋 Environment Configuration

### Backend (`backend/.env`)
```env
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Authentication Secret Key
SECRET_KEY=change_this_to_a_secure_random_256_bit_secret_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database Configuration
USE_SQLITE=true
DATABASE_URL=sqlite:///./friday.db
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/friday?retryWrites=true&w=majority

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## ⚙️ Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)

### 1. Windows 1-Click Launch
Double click `start.bat` in the project root directory to launch both frontend and backend automatically:
- **Frontend App**: `http://localhost:5173`
- **FastAPI API Docs**: `http://localhost:8000/docs`

### 2. Manual Command Line Launch

**Backend Setup**:
```bash
cd backend
pip install -r requirements.txt
python seed_data.py
python -m uvicorn main:app --reload --port 8000
```

**Frontend Setup**:
```bash
cd frontend
npm install
npm run dev -- --port 5173
```

---

## 🚀 Deployment Guide (Vercel)

This repository includes root and subdirectory `vercel.json` configurations for instant deployment:

1. Import `JatinAsnani/TETRA014` into [Vercel Dashboard](https://vercel.com/dashboard).
2. Set Root Directory to `frontend`.
3. Set Environment Variable `VITE_API_BASE_URL` to your live FastAPI backend server URL.
4. Click **Deploy**!

---

## 👥 Authors & License
Developed for **TetraTHON 2026 — Track C (FinTech)**. All rights reserved.
