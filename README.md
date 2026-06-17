<div align="center">
  <img src="frontend/public/favicon.png" alt="ScamShield Logo" width="120" />
  <h1>ScamShield — AI-Powered Job Fraud Detection</h1>
  <p>Protect your career with real-time global telemetry and advanced ML inference. Catch fake job postings and scam recruiters instantly.</p>
</div>

<br />

<div align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Machine%20Learning-scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="scikit-learn" />
</div>

<br />

## 🌟 Overview

Fraudulent job postings are designed to look legitimate, deceiving thousands of professionals daily. **ScamShield** uses advanced Natural Language Processing (NLP) and heuristics to detect subtle anomalies in job descriptions, compensation structures, and recruiter behaviors that humans often miss.

Our models continuously learn from thousands of endpoints to protect the global workforce across major portals including LinkedIn, Indeed, Glassdoor, Wellfound, Naukri, and Monster.

## ✨ Key Features

- 🛡️ **Deep Learning Scam Checker**: Analyze job postings using NLP with 99.4% detection accuracy on known scam vectors.
- 🏢 **Recruiter Verification**: Verify recruiter emails and company domains against our live trust-scoring database.
- 📄 **ATS Score Checker**: Upload your resume to evaluate how well Applicant Tracking Systems can parse it, complete with formatting and keyword match scores.
- 📊 **Active Telemetry Dashboard**: View global real-time tracking of suspicious opportunities and verified recruiters.
- 🚨 **Community Reporting**: Submit suspicious postings to help improve our fraud database and protect others.

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Vite (Build Tool & Dev Server)
- Vercel Web Analytics & Speed Insights

**Backend:**
- Python 3
- FastAPI & Uvicorn
- Supabase (Database & Authentication)
- Scikit-learn, Pandas, SciPy (Machine Learning & NLP)
- JWT & Bcrypt (Security)

## 📂 Project Structure

```
fake_job_scam_system/
├── backend/          # FastAPI server, endpoints, and services
├── frontend/         # Vite-powered frontend application
├── models/           # Pre-trained ML models and NLP pipelines
├── archive/          # Archived assets and references
├── src/              # Additional source scripts
└── requirements.txt  # Python dependencies
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### Backend Setup
1. Clone the repository and navigate to the project directory.
2. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.
5. This is the live link of this project : https://fake-internship-detector-olps.vercel.app/

## 🔐 Environment Variables

This project requires environment variables for connecting to Supabase and managing JWT secrets. 

> **Note:** For security reasons, all `.env` files are restricted from being pushed to GitHub. Make sure you create a local `.env` file in the root directory and do not commit it.

Create a `.env` file with the following placeholders:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Security
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---
<div align="center">
  <p>Built with ❤️ to ensure transparency in the global job market.</p>
</div>
