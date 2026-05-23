# Smart Campus AI Implementation Plan

This plan outlines the architecture and setup for the Smart Campus AI application, including a React frontend, a Node.js backend, and a Python-based chatbot module.

## User Review Required

> [!IMPORTANT]  
> Please review the technology choices below. 
> - **Frontend**: React (via Vite) with Tailwind CSS.
> - **Backend**: Node.js + Express.
> - **Chatbot**: Python with FastAPI (or Flask). Do you have a preference for Python vs Node.js for the chatbot? I am proposing Python (FastAPI) as it is standard for AI applications, but we can easily use Node.js if you prefer to keep the stack uniform.
> - **AI Integration**: What AI service are you planning to use (e.g., OpenAI, Gemini, local model)?

## Open Questions

> [!WARNING]  
> - **Database Strategy**: We will proceed with using **SQLite** along with the **Prisma ORM** for the initial "university database". This approach provides a real database experience locally without any heavy setup, and makes it incredibly easy to switch to a production database (like PostgreSQL or MySQL) later when the college data is ready. Does this sound good?

## Proposed Changes

We will create three main directories in the project root: `frontend/`, `backend/`, and `chatbot/`.

### Root Directory

#### [NEW] [README.md](file:///c:/Users/visha/Desktop/minor project/README.md)
Contains clear setup and run instructions for the entire application.

---

### Frontend (React + Tailwind CSS)

We will use Vite to initialize the React application for fast development.

#### [NEW] [frontend/package.json](file:///c:/Users/visha/Desktop/minor project/frontend/package.json)
Dependencies including `axios` for backend communication, `react-router-dom` for routing, and Tailwind CSS configuration.

#### [NEW] [frontend/src/App.jsx](file:///c:/Users/visha/Desktop/minor project/frontend/src/App.jsx)
Main application component with routes and a clean modular architecture.

#### [NEW] [frontend/src/api/axios.js](file:///c:/Users/visha/Desktop/minor project/frontend/src/api/axios.js)
Axios instance configuration with the backend API base URL from environment variables.

#### [NEW] [frontend/.env](file:///c:/Users/visha/Desktop/minor project/frontend/.env)
Environment variables for the frontend (e.g., `VITE_API_BASE_URL`).

---

### Backend (Node.js + Express + Prisma/SQLite)

A RESTful API server with a mock university database.

#### [NEW] [backend/package.json](file:///c:/Users/visha/Desktop/minor project/backend/package.json)
Dependencies: `express`, `cors`, `dotenv`, `axios`, `@prisma/client`, and `prisma` (dev dependency).

#### [NEW] [backend/prisma/schema.prisma](file:///c:/Users/visha/Desktop/minor project/backend/prisma/schema.prisma)
Prisma schema file configuring the SQLite provider and defining the university database models (e.g., Students, Courses).

#### [NEW] [backend/server.js](file:///c:/Users/visha/Desktop/minor project/backend/server.js)
Main server entry point setting up middleware and routes.

#### [NEW] [backend/routes/chatbotRoutes.js](file:///c:/Users/visha/Desktop/minor project/backend/routes/chatbotRoutes.js)
Express routes for handling chatbot requests from the frontend and forwarding them to the AI module.

#### [NEW] [backend/.env](file:///c:/Users/visha/Desktop/minor project/backend/.env)
Environment variables for the backend (e.g., `PORT`, `CHATBOT_SERVICE_URL`).

---

### Chatbot (Python + FastAPI)

A standalone AI module that processes chatbot queries.

#### [NEW] [chatbot/requirements.txt](file:///c:/Users/visha/Desktop/minor project/chatbot/requirements.txt)
Python dependencies (e.g., `fastapi`, `uvicorn`, AI SDKs).

#### [NEW] [chatbot/main.py](file:///c:/Users/visha/Desktop/minor project/chatbot/main.py)
FastAPI application with endpoints to handle AI inference/chat logic.

#### [NEW] [chatbot/.env](file:///c:/Users/visha/Desktop/minor project/chatbot/.env)
Environment variables for the chatbot (e.g., API keys).

## Verification Plan

### Automated Tests
- Run `npm run lint` on frontend and backend if configured.
- Verify that each service starts successfully without errors.

### Manual Verification
1. Start the Chatbot service.
2. Start the Node.js backend.
3. Start the React frontend.
4. Open the frontend in the browser and test the communication flow: Frontend -> Backend -> Chatbot -> Backend -> Frontend.
