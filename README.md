Smart Campus AI 🎓🤖

An AI-powered digital university management platform that centralizes classroom operations, attendance analytics, department management, real-time alerts, and AI-assisted academic support into one smart ecosystem.

🚀 Features
🔐 Role-Based Authentication
Student Login
Faculty Login
Admin Login
JWT Authentication
bcrypt Password Hashing
Protected APIs
🏫 Classroom Hub
Assignments Upload
Notes & PPT Upload
Timetable Management
Classroom Alerts
Faculty Content Management
Student Resource Access
📊 Attendance Management
Faculty Attendance Marking
Student Attendance View
Attendance Percentage
Attendance Analytics
Admin Excel-Style Reports
Role-Based Analytics Access
🧠 AI Chatbot (GPT + RAG)
University-specific AI assistant
Assignment assistance
Notes summarization
Timetable retrieval
Attendance queries
Academic resource support
Technologies Used:
OpenAI GPT API
LangChain
FAISS Vector Database
🏢 Department Module
Department-wise Classrooms
HOD Management
Faculty & Student Mapping
Department Events
Workshops & Seminars
🚀 Event & Hackathon System
Event Creation & Management
Faculty Task Assignment
Student Volunteer System
Event Status Tracking
🔔 Real-Time Alert System
Instant Notifications
Popup Alerts
Beep Notifications
Socket.IO Integration
🎨 UI/UX Features
Light Theme
Dark Theme
Eye-Save Warm Theme
Animated Components
Hover Effects
Floating AI Chatbot
Responsive Design
🛠️ Tech Stack
Frontend
React.js
Tailwind CSS
Framer Motion
Backend
Node.js
Express.js
Database
SQLite
Prisma ORM
AI & Chatbot
OpenAI GPT API
LangChain
FAISS
Realtime
Socket.IO
🧠 AI Chatbot Architecture

The chatbot uses:

RAG (Retrieval-Augmented Generation)
Workflow:

User Query → LangChain → FAISS Retrieval → OpenAI GPT → Response Generation

📂 Project Structure
smart-campus-ai/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   └── services/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   ├── services/
│   └── utils/
│
├── chatbot/
│   ├── embeddings/
│   ├── vector-db/
│   ├── rag-pipeline/
│   └── prompts/
│
└── README.md
⚙️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/vishakha0534/smart-campus-ai.git
2️⃣ Install Frontend Dependencies
cd frontend
npm install
3️⃣ Install Backend Dependencies
cd backend
npm install
🗄️ Prisma Setup
Generate Prisma Client
npx prisma generate
Run Migrations
npx prisma migrate dev
▶️ Run Frontend
npm run dev
▶️ Run Backend
npm start
🔐 Environment Variables

Create .env file in backend:

DATABASE_URL="file:./dev.db"

JWT_SECRET=your_secret_key

OPENAI_API_KEY=your_openai_api_key
📊 Attendance Analytics

Attendance analytics uses:

SQL Aggregation
Percentage Calculation
Role-Based Filtering
Time-Series Attendance Data

Formula:

Attendance Percentage =
(Present Days / Total Classes) × 100
🧠 Why LangChain?

LangChain is used to:

connect GPT with university data
process contextual retrieval
manage RAG pipelines
integrate vector search
🧠 Why FAISS?

FAISS enables:

semantic search
note retrieval
assignment search
contextual AI responses
🔐 Security Features
JWT Authentication
bcrypt Password Hashing
Middleware-Based Authorization
Protected Routes
Role-Based Access Control
🚀 Future Scope
PostgreSQL Migration
Pinecone Vector Database
Cloud Deployment
Mobile Application
Voice Assistant
Facial Attendance System
Predictive Analytics
📸 Screenshots

Add your project screenshots here.

Example:

Login Page
Dashboard
Classroom Hub
Attendance Analytics
Chatbot UI
👩‍💻 Developed By
Vishakha Solanki

B.Tech CSE-AIML

🌟 Project Vision

Smart Campus AI aims to transform traditional educational systems into intelligent digital campus ecosystems powered by AI, analytics, and real-time communication.

📄 License

This project is developed for educational and research purposes.
