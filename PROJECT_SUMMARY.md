# AI Engineer Challenge - Project Summary

## 🎯 **Project Overview**
A full-stack AI chat application with RAG (Retrieval-Augmented Generation) functionality that allows users to upload PDF documents and chat with them using AI.

## 🚀 **Live Application**
- **Production URL:** https://the-ai-engineer-challenge-oeef1ni5q-franks-projects-4efc5c97.vercel.app
- **Chat Interface:** https://the-ai-engineer-challenge-oeef1ni5q-franks-projects-4efc5c97.vercel.app/chat

## 🛠️ **Tech Stack**

### Backend (FastAPI)
- **Framework:** FastAPI with Python
- **AI Integration:** OpenAI API for chat completions and embeddings
- **PDF Processing:** PyPDF2 for text extraction
- **Vector Database:** Custom in-memory vector store with cosine similarity
- **RAG Implementation:** Document chunking and semantic search

### Frontend (Next.js)
- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS with dark mode support
- **UI Components:** Custom React components
- **File Upload:** PDF upload with progress indication

### Deployment
- **Platform:** Vercel
- **Configuration:** vercel.json for routing
- **Environment:** Production-ready with CORS configuration

## ✨ **Key Features**

### 1. **PDF Upload & Processing**
- Upload PDF documents through web interface
- Automatic text extraction and chunking
- Vector embedding generation using OpenAI
- Unicode character handling for international documents

### 2. **RAG (Retrieval-Augmented Generation)**
- Document-based Q&A system
- Semantic search using vector similarity
- Context-aware responses from uploaded documents
- Toggle between RAG and general chat modes

### 3. **Modern UI/UX**
- Responsive design for all devices
- Dark/light mode toggle
- Orange API key input for better visibility
- Real-time streaming chat responses
- Document status indicators

### 4. **API Endpoints**
- `POST /api/upload-pdf` - Upload and process PDF documents
- `POST /api/chat` - Chat with AI (with or without RAG)
- `GET /api/document-status` - Check uploaded document status
- `GET /api/health` - Health check endpoint

## 🔧 **Recent Fixes & Improvements**

### Unicode Support
- Fixed ASCII encoding errors for PDFs with emojis and special characters
- Added UTF-8 encoding/decoding with error handling
- Improved text processing for international documents

### UI Improvements
- Changed API key input background to orange for better visibility
- Fixed PDF upload routing between frontend and backend
- Added proper navigation links to chat interface
- Improved error handling and user feedback

### Deployment
- Fixed CORS configuration for local and production environments
- Updated Vercel routing for proper API handling
- Self-contained RAG implementation (no external dependencies)

## 📁 **Project Structure**
```
The-AI-Engineer-Challenge/
├── api/
│   ├── app.py              # FastAPI backend with RAG
│   ├── requirements.txt    # Python dependencies
│   └── README.md          # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx   # Landing page
│   │   │   ├── chat/      # Chat interface route
│   │   │   └── layout.tsx # Root layout
│   │   └── components/
│   │       ├── ChatInterface.tsx    # Main chat component
│   │       ├── MessageBubble.tsx    # Message display
│   │       ├── InputArea.tsx        # Message input
│   │       └── LandingHeader.tsx    # Navigation header
│   ├── package.json       # Frontend dependencies
│   └── README.md         # Frontend documentation
├── vercel.json           # Deployment configuration
└── README.md            # Project documentation
```

## 🎮 **How to Use**

### Local Development
1. **Backend:** `cd api && python app.py` (runs on http://localhost:8000)
2. **Frontend:** `cd frontend && npm run dev` (runs on http://localhost:3000)
3. **Access:** http://localhost:3000/chat

### Production
1. **Visit:** https://the-ai-engineer-challenge-oeef1ni5q-franks-projects-4efc5c97.vercel.app
2. **Click:** "Launch Chat App" or go to `/chat`
3. **Enter:** Your OpenAI API key
4. **Upload:** A PDF document
5. **Chat:** Ask questions about your document

## 🔑 **API Key Setup**
- Get your OpenAI API key from https://platform.openai.com/api-keys
- Enter it in the orange input field in the chat interface
- Required for both PDF processing and chat functionality

## 📊 **Performance Features**
- Streaming responses for real-time chat
- Efficient vector similarity search
- Optimized PDF chunking (1000 chars with 200 overlap)
- In-memory vector storage for fast retrieval

## 🛡️ **Security & Privacy**
- API keys handled client-side (not stored)
- CORS properly configured
- Input validation and error handling
- Secure file upload processing

## 🎯 **Use Cases**
- Document Q&A and analysis
- Research assistance with uploaded papers
- Educational content exploration
- Business document analysis
- Technical documentation queries

---

**Built with ❤️ using FastAPI, Next.js, and OpenAI**
**Deployed on Vercel with full RAG functionality**
