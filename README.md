E‑Waste Management System (Hackathon Project)

A secure, scalable web-based system for electronic waste management. The project focuses on responsible disposal, bin tracking, and admin monitoring, while strictly following industry‑standard security practices.

🚀 Project Overview

Electronic waste is one of the fastest-growing waste streams. This project aims to:

Help users locate nearby e‑waste bins

Allow admins to manage bin locations and monitor collected waste

Promote safe, responsible disposal of electronics

The system is built with a FastAPI backend and a modern frontend (React/Next.js), keeping security, scalability, and clarity in mind.

🧱 Tech Stack
Backend

FastAPI (Python)

Uvicorn (ASGI server)

Google Cloud / Firebase (optional, for production features)

Frontend

React / Next.js

Other

Git & GitHub

Environment variables for secrets

🔐 Security First (IMPORTANT)

This repository intentionally does NOT include:

.env files

serviceAccountKey.json

Any API keys, tokens, or credentials

🚨 Why?

GitHub blocks secret files automatically (Push Protection)

Exposing credentials is unsafe and unprofessional

Real-world projects never commit secrets

This is expected behavior, not a bug.

📂 Project Structure (Simplified)
HAXPLORE-3/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   └── ...
│
├── .gitignore
├── .env.example
└── README.md

Ignored (local only):

venv/, .venv/

node_modules/

__pycache__/

.env

serviceAccountKey.json

⚙️ Backend Setup (Local)
1️⃣ Clone / Fork the Repository
git clone <repo-url>
cd HAXPLORE-3
2️⃣ Create & Activate Virtual Environment

Windows

python -m venv venv
venv\Scripts\activate

Linux / macOS

python3 -m venv venv
source venv/bin/activate
3️⃣ Install Dependencies
pip install -r backend/requirements.txt
4️⃣ Run Backend Server

From project root:

uvicorn backend.main:app --reload

OR

cd backend
uvicorn main:app --reload

Backend will be available at:

http://127.0.0.1:8000

☁️ Cloud / Firebase Features (Optional)

Some features (database, admin analytics, authentication) require Google Cloud / Firebase.

These features will NOT work by default, and that is intentional.

🔑 How to Enable Cloud Features (For Judges / Advanced Users)

Create a Google Cloud project

Enable required services (Firestore / Firebase)

Create a Service Account

Download serviceAccountKey.json

DO NOT place it inside the repo

Instead, set an environment variable:

GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
🧪 Why Forked Repos May Not Fully Work

If someone forks this repo:

✅ Backend server will start ✅ Local APIs will work ❌ Cloud/database features will fail

This is correct and secure behavior.

Secrets are user-specific and must never be shared via GitHub.

📄 .env.example

This repo includes a template only:

GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json
FIREBASE_PROJECT_ID=your-project-id

Users must create their own .env locally.

🧠 Professional Best Practices Followed

No secrets in Git

Environment-based configuration

Clean commit history

Hackathon & recruiter safe

GitHub Push Protection compliant


🤝 Contribution

Feel free to fork, explore, and improve. For full functionality, set up your own cloud credentials.

📜 License

This project is for educational and hackathon use.

If you have questions or need setup help, feel free to ask 🚀
