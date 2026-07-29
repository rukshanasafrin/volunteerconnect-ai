# 🤝 VolunteerConnect AI

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?logo=tailwindcss" />
</p>

VolunteerConnect AI is a modern AI-powered volunteer management platform that connects volunteers with organizations through intelligent event matching, performance tracking, sentiment analysis, and streamlined event management.

The platform enables volunteers to discover meaningful opportunities while helping organizations efficiently manage volunteers and events through AI-assisted features.

---

# 🌟 Key Features

## 👤 Volunteer

- Secure Registration & Login
- Profile Management
- Browse & Search Events
- Register for Volunteer Events
- Volunteer Performance Score
- Feedback Submission
- Certificate Download
- AI Chat Assistant 
- Skill Gap Growth Advisor

---

## 🏢 Organization

- Organization Registration
- Event Creation & Management
- Volunteer Approval / Rejection
- AI Volunteer Matching
- Event Completion Tracking
- Feedback Sentiment Analysis
- Volunteer Analytics
- AI Dream Team Builder
- AI Impact Story Generator

---

## 🛡️ Admin

- Organization Verification
- Volunteer Management
- Organization Management
- Event Monitoring
- Search Users
- Dashboard Analytics
- Platform Statistics

---

# 🤖 AI Features

- AI Volunteer Recommendation Engine
- Volunteer Performance Scoring
- Feedback Sentiment Analysis
- Smart Event Matching
- AI Chat Assistant
- Certificate Generation 

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- React Router DOM
- Lucide React

---

## Backend

- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Bcrypt
- Mongoose

---

## Artificial Intelligence

- Anthropic Claude API
- Sentiment Analysis
- AI Volunteer Matching
- Recommendation Engine

---

# 📂 Project Structure

```
volunteerconnect-ai
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── api
│   │   ├── assets
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── routes
│   │   ├── hooks
│   │   └── utils
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   ├── package.json
│   └── server.js
│
└── README.md
```

---

# 🚀 Getting Started

## 1️⃣ Clone Repository

```bash
git clone https://github.com/rukshanasafrin/volunteerconnect-ai.git

cd volunteerconnect-ai
```

---

# ⚙ Backend Setup

```bash
cd backend

npm install
```

Create a `.env` file inside the backend folder.

```env
PORT=PORT_NUMBER

MONGO_URI=YOUR_MONGODB_URL

JWT_SECRET=YOUR_JWT_KEY

ANTHROPIC_API_KEY=YOUR_API_KEY

GROQ_API_KEY=YOUR_GRQO_API_KEY
```

Start the backend server

```bash
npm run dev
```

Backend runs at

```
http://localhost:8000
```

---

# 💻 Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# 🔐 Authentication

The platform uses

- JWT Authentication
- Password Hashing using Bcrypt
- Protected Routes
- Role-Based Authorization

Supported roles

- Volunteer
- Organization
- Admin

---


# 🚀 Future Enhancements

- Socket.IO Real-Time Notifications
- Achievement Badges
- Calendar Integration
- Resume Parsing
- Email Notifications
- Analytics Dashboard
- Multi-language Support
- Cloud Deployment
- Mobile App

---
