'use client';

import ChatInterface from '@/components/ChatInterface';
import Header from '@/components/Header';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-slate-800 dark:text-slate-200 mb-4 transition-colors">
              AI Chat with RAG
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
              Upload a PDF document to chat with it using RAG, or chat normally with the AI.
              Clean, fast, and distraction-free with dark mode support.
            </p>
          </div>
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
