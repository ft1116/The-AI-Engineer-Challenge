# AI Chat Assistant Frontend

A sleek, modern frontend for the AI Chat Assistant built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Clean Design**: Minimalist, distraction-free interface with a simple color scheme
- 💬 **Real-time Chat**: Streaming responses from OpenAI's API
- 🔧 **Configurable**: Customizable system messages and model selection
- 📱 **Responsive**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast**: Built with Next.js 14 and optimized for performance

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend Integration**: FastAPI (Python)

## Getting Started

### Prerequisites

- Node.js 16+ (though 18+ is recommended)
- npm or yarn
- Running FastAPI backend on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Enter your OpenAI API Key** in the settings panel
2. **Customize the system message** (optional)
3. **Start chatting** with the AI assistant

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts    # API proxy to FastAPI backend
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── ChatInterface.tsx    # Main chat component
│   ├── Header.tsx           # App header
│   ├── InputArea.tsx        # Message input
│   └── MessageBubble.tsx    # Individual message display
└── types/
    └── chat.ts              # TypeScript interfaces
```

## Design Philosophy

This frontend follows a **distraction-free design** approach:

- **Simple Color Palette**: Primarily slate grays with blue accents
- **Clean Typography**: Clear, readable fonts with proper spacing
- **Minimal UI Elements**: Only essential components visible
- **Smooth Animations**: Subtle transitions for better UX
- **Responsive Layout**: Adapts to any screen size

## API Integration

The frontend communicates with the FastAPI backend through:

- **Chat Endpoint**: `/api/chat` for streaming responses
- **Health Check**: `/api/health` for backend status
- **CORS Enabled**: Backend configured to accept frontend requests

## Deployment

This frontend is configured for Vercel deployment with the existing `vercel.json` configuration.

## Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Keep components small and focused
4. Maintain the clean, minimal design aesthetic