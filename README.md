# BrainVision — Automated Brain Tumor MRI Classifier

A full-stack, production-ready web application for AI-powered brain tumor classification from MRI scans, using an **InceptionV3** deep learning model (97.12% accuracy on the Kaggle Brain Tumor MRI Dataset).

---

## Features

### Backend (Python / FastAPI)
- **InceptionV3** model inference with confidence scores for 4 tumor classes
- **Demo mode** — works without a model file (returns plausible simulated predictions)
- **Batch processing** — upload up to 10 MRI images at once
- **PostgreSQL** database for persistent prediction history
- **JWT authentication** (signup, login, protected endpoints)
- **PDF report generation** with medical context per prediction
- **Swagger / OpenAPI** docs at `/docs`
- Alembic database migrations
- GZip compression, CORS, structured logging

### Frontend (React)
- Custom professional design (navy + purple + teal palette)
- **Drag-and-drop** MRI image upload with live preview
- Real-time prediction results with animated confidence bars
- **Dashboard** with interactive Recharts visualizations (pie + bar charts)
- **History** page with search, filtering by class, pagination, delete
- **PDF report download** per prediction
- JWT-protected routes with auto-logout on token expiry
- Fully responsive (mobile + desktop)

---

## Supported Tumor Classes

| Class | Description |
|-------|-------------|
| **Glioma** | Fast-growing tumor arising from glial cells |
| **Meningioma** | Slow-growing tumor from the meninges, usually benign |
| **Pituitary** | Tumor of the pituitary gland, affects hormones |
| **No Tumor** | Normal brain tissue, no tumor detected |

---

## Quick Start (Docker)

### Prerequisites
- Docker + Docker Compose
- *(Optional)* Pre-trained InceptionV3 weights file (`.h5`)

### 1. Clone and configure

```bash
git clone https://github.com/AryanNayak2486/BrainVision-Automated-Brain-Tumor-MRI-Classifier.git
cd BrainVision-Automated-Brain-Tumor-MRI-Classifier

cp .env.example .env
# Edit .env with your passwords and a strong SECRET_KEY
```

### 2. Add model weights (optional)

Place your trained InceptionV3 model file at:
```
./backend/models/inception_v3_brain_tumor.h5
```

> **Note:** Without the model file, the app runs in **Demo Mode** — predictions are simulated for demonstration purposes. The UI remains fully functional.

To train/obtain the model, use the [Kaggle Brain Tumor MRI Dataset](https://www.kaggle.com/datasets/masoudnickparvar/brain-tumor-mri-dataset) with:
```python
from tensorflow.keras.applications import InceptionV3
# Fine-tune with 4-class softmax head
```

### 3. Launch

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Development Setup (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env — set DATABASE_URL to your local PostgreSQL

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install

# Set API URL for local dev (optional)
echo "REACT_APP_API_URL=http://localhost:8000/api/v1" > .env.local

npm start
```

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── config.py            # Settings (env vars, pydantic-settings)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── user.py          # User ORM model
│   │   │   └── prediction.py    # Prediction ORM model
│   │   ├── routes/
│   │   │   ├── auth.py          # /auth/signup, /auth/login, /auth/me
│   │   │   ├── predict.py       # /predict/ (single + batch + report)
│   │   │   └── history.py       # /history/ (list, stats, delete)
│   │   ├── services/
│   │   │   ├── auth_service.py  # User CRUD, JWT helpers
│   │   │   └── ml_service.py    # InceptionV3 inference + demo mode
│   │   └── utils/
│   │       ├── image_utils.py   # Preprocessing, validation
│   │       ├── jwt_utils.py     # Token encode/decode
│   │       └── report_utils.py  # PDF generation (reportlab)
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── App.js               # Router + auth guards
│   │   ├── services/
│   │   │   ├── api.js           # Axios API client
│   │   │   └── AuthContext.js   # React auth context
│   │   ├── components/
│   │   │   ├── AppShell.js      # Sidebar layout
│   │   │   └── AppShell.css
│   │   ├── pages/
│   │   │   ├── Login.js / Auth.css
│   │   │   ├── Signup.js
│   │   │   ├── Dashboard.js / Dashboard.css
│   │   │   ├── Predict.js / Predict.css
│   │   │   └── History.js / History.css
│   │   └── styles/
│   │       └── global.css       # Design system / variables
│   ├── public/index.html
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/signup` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login (returns JWT) |
| `GET`  | `/api/v1/auth/me` | Get current user info |
| `POST` | `/api/v1/predict/` | Analyze single MRI image |
| `POST` | `/api/v1/predict/batch` | Analyze up to 10 images |
| `GET`  | `/api/v1/predict/{id}/report` | Download PDF report |
| `GET`  | `/api/v1/history/` | Get paginated history |
| `GET`  | `/api/v1/history/stats` | Get statistics |
| `DELETE` | `/api/v1/history/{id}` | Delete a record |

Full interactive API documentation: **http://localhost:8000/docs**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| ML Model | TensorFlow / Keras — InceptionV3 |
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose, passlib/bcrypt) |
| PDF | ReportLab |
| Frontend | React 18, React Router 6 |
| Charts | Recharts |
| Upload | react-dropzone |
| Containerization | Docker, Docker Compose, Nginx |

---

## Disclaimer

> This application is intended for **research and educational purposes only**. It is not a certified medical device and must not be used as a substitute for professional medical diagnosis. Always consult a qualified healthcare professional.
