# 🤝 VolunteerConnect AI

VolunteerConnect AI is an AI-powered volunteer management platform that connects volunteers with organizations through intelligent matching, performance tracking, and sentiment analysis.

---

# Features

## Volunteer

- User Registration & Login
- Edit Profile
- Browse Events
- Register for Events
- AI Recommended Events
- Performance Score
- Feedback Submission
- Certificate Download (Upcoming)
- AI Chatbot (Upcoming)

---

## Organization

- Organization Registration
- Create Events
- Manage Events
- Approve/Reject Volunteers
- AI Volunteer Matching
- Event Completion
- Feedback Sentiment Analysis

---

## Admin

- Verify Organizations
- View Volunteers
- Search Users
- Dashboard Analytics

---

# Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- Axios
- React Router

## Backend

- Node.js
- Express.js
- MongoDB
- JWT Authentication

## AI

- Anthropic Claude API
- Sentiment Analysis
- AI Volunteer Matching
- Performance Scoring

---

# Project Structure

```
volunteerconnect
│
├── frontend
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── context
│   │   ├── routes
│   │   └── api.js
│
└── backend
    ├── config
    ├── controllers
    ├── middleware
    ├── models
    ├── routes
    ├── services
    └── server.js
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/rukshanasafrin/volunteerconnect-ai.git

cd volunteerconnect-ai
```

---

## Backend

```bash
cd backend

npm install
```

Create a `.env` file inside the backend folder.

```
PORT=8000

MONGO_URI=mongodb://localhost:27017/volunteerconnect

JWT_SECRET=volunteerconnect_super_secret_key_2026

ANTHROPIC_API_KEY=YOUR_API_KEY
```

Start Backend

```bash
npm run dev
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Application URLs

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:8000
```

---

# Current Progress

## Phase 1 – Fix & Polish

- ✅ Completed

## Phase 2 – UI Overhaul

- ✅ Completed

## Phase 3 – AI Features

- ✅ AI Volunteer Matching
- ✅ Volunteer Performance Score
- ✅ Sentiment Analysis
- 🔄 Smart Certificate Generator
- 🔄 AI Chatbot

## Phase 4 – Live Notifications

- ⏳ Pending

## Phase 5 – Leaderboard & Badges

- ⏳ Pending

## Phase 6 – Deployment

- ⏳ Pending

---

# Upcoming Features

- PDF Certificate Generator
- AI Chatbot
- Socket.IO Notifications
- Volunteer Leaderboard
- Achievement Badges
- Render Deployment

---

# Environment Variables

Backend requires:

```
PORT

MONGO_URI

JWT_SECRET

ANTHROPIC_API_KEY
```

---


# Future Improvements

- Email Notifications
- Mobile Responsive Enhancements
- Calendar Integration
- Analytics Dashboard
- Multi-language Support
- Cloud Deployment
- Resume Parsing
- Volunteer Recommendation Improvements

---
