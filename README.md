# TallAI

TallAI is an **AI-powered accounting application** designed for small businesses in India, offering intelligent double-entry bookkeeping, GST calculation, stock tracking, and natural language command processing.

---

## 🚀 Live Demo
Visit the live application at: **[https://tall-ai.vercel.app](https://tall-ai.vercel.app)**
* **Demo Login**: `demo@tallai.com`
* **Password**: `demo123`

---

## ✨ Key Features
* **AI Chat**: Interactive financial assistant that accepts conversational Hinglish and English commands to check outstandings, record payments, file expenses, and explain reports.
* **Invoices**: Create, edit, and print beautiful invoices with automated GST calculations and PDF download capability.
* **GST & ITC**: Automated GSTR-1 and GSTR-3B filings summary, Input Tax Credit (ITC) calculations, and upcoming tax deadline countdown.
* **Ledger**: Complete automated double-entry ledger bookkeeping mapping invoices, expenses, and payments.
* **Payments**: Record payments from customers and track real-time outstanding balances.
* **Stock & Inventory**: Keep track of item stocks, inventory movements, and minimum stock alerts.

---

## 🛠️ Tech Stack
* **Backend**: FastAPI (Python), SQLAlchemy, SQLite (production default), MySQL (supported)
* **Frontend**: React (Vite), TailwindCSS, Chart.js, Axios
* **AI Engine**: Google Gemini API (`gemini-2.5-flash`) for function calling and interactive reports explanation

---

## 📋 Environment Variables Needed

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory with the following variables:
```env
DATABASE_URL=sqlite:///./tallai.db
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
* Node.js (v18+)
* Python (v3.11+)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize and seed the local database:
   ```bash
   python seed_data.py
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install node packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

---

## 💻 Running the Application (Windows Shortcut)
You can launch both the frontend and backend servers simultaneously by double-clicking the `start.bat` file in the project root directory.
* Open your browser at: **http://localhost:5173**
