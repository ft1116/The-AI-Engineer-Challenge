'use client';

import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-slate-800 mb-4">
              AI Chat Assistant
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Experience seamless conversations with our AI-powered chat interface. 
              Clean, fast, and distraction-free.
            </p>
          </div>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}