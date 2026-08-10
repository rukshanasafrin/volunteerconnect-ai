🤝 VolunteerConnect AI

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?logo=tailwindcss" />
</p>

### AI-Powered Volunteer–Organization Matching & Management Platform

VolunteerConnect AI is a full-stack platform that connects volunteers with organizations through **AI-assisted event matching, skill analysis, performance tracking, sentiment analysis, and intelligent volunteer management**.

Unlike a basic event management system, the platform uses volunteer profiles, skills, interests, event requirements, participation history, and feedback to provide personalized recommendations and decision-support features.

---

## 🌟 Key Features

### 👤 Volunteer

* Secure registration and login
* JWT authentication and role-based access
* Profile and skill management
* Browse, search, and filter events
* Register for volunteer opportunities
* AI-powered event recommendations
* Volunteer performance score
* Skill-gap analysis and growth advisor
* Feedback submission
* Certificate generation/download
* AI chat assistant
* Participation history

### 🏢 Organization

* Organization registration and profile
* Event creation and management
* Volunteer approval/rejection
* AI-powered volunteer matching
* Applicant performance insights
* Event completion tracking
* Feedback sentiment analysis
* Volunteer analytics
* AI Dream Team Builder
* AI Impact Story Generator

### 🛡️ Admin

* Organization verification
* Volunteer management
* Organization management
* Event monitoring
* User search
* Platform statistics
* Dashboard analytics

---

## 🤖 AI Features

### Intelligent Volunteer Matching

Matches volunteers with suitable events using factors such as:

* Skills
* Interests
* Event requirements
* Previous participation
* Performance

### Skill Gap Advisor

Compares volunteer skills with event requirements and identifies missing skills with improvement suggestions.

### Sentiment Analysis

Analyzes volunteer feedback to identify positive, negative, and neutral experiences.

### AI Dream Team Builder

Helps organizations identify suitable combinations of volunteers for an event.

### AI Impact Story Generator

Generates meaningful summaries from event and volunteer participation data.

### AI Chat Assistant

Provides contextual assistance for volunteers using the platform's features and opportunities.

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Framer Motion
* Axios
* React Router DOM
* Lucide React
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Socket.IO

### AI

* Anthropic Claude API
* Groq API
* AI Recommendation
* Sentiment Analysis
* AI Assistance

---

## 🏗️ Architecture

```text
React + Vite Frontend
        │
        │ REST API / Socket.IO
        ▼
Node.js + Express Backend
        │
        ├── Authentication & RBAC
        ├── Controllers
        ├── Services
        ├── AI Services
        └── Business Logic
        │
        ▼
MongoDB + Mongoose
```

AI services are integrated separately from the core business logic so that normal platform functionality does not depend entirely on AI availability.

---

## 🗄️ Database

The project uses **MongoDB with Mongoose**.

MongoDB is suitable because the platform handles flexible data such as:

* Volunteer profiles
* Skills and interests
* Organizations
* Events
* Applications
* Feedback
* Performance information
* AI-generated insights

MongoDB Atlas can be used for production deployment, while a local MongoDB instance can be used during development.

---

## 🔐 Security

The application implements:

* JWT authentication
* bcrypt password hashing
* Role-based authorization
* Protected routes
* Input validation
* CORS configuration
* Environment-based secrets
* Secure API key management

API keys and database credentials are stored in `.env` and should never be committed to GitHub.

---

## 📂 Project Structure

```text
volunteerconnect-ai/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── routes/
│       └── utils/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Clone

```bash
git clone https://github.com/rukshanasafrin/volunteerconnect-ai.git
cd volunteerconnect-ai
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend:

```text
http://localhost:8000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## ⚙️ Environment Variables

Create `backend/.env`:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
```

For production, replace `CLIENT_URL` with the deployed frontend URL.

---

## 🌐 Deployment

The application can be deployed as separate frontend and backend services:

```text
React/Vite
    ↓
Frontend Hosting
    ↓
Node.js + Express
    ↓
MongoDB Atlas
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

Deploy the generated `dist` directory using a suitable frontend hosting service.

### Backend

Deploy the `backend` directory as a Node.js service and configure:

```env
MONGO_URI
JWT_SECRET
ANTHROPIC_API_KEY
GROQ_API_KEY
CLIENT_URL
```

For production, use **MongoDB Atlas** instead of the local MongoDB instance.

---

## 🔮 Future Enhancements

* Advanced ML-based recommendation models
* Resume parsing and automatic skill extraction
* Calendar integration
* Email notifications
* Achievement badges
* Mobile application
* Geographic opportunity matching
* Predictive volunteer analytics

---
