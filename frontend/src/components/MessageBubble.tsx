'use client';

import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
          : isError
          ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
      } shadow-sm transition-colors`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <div className={`text-xs mt-2 ${
          isUser ? 'text-blue-100' : isError ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
        }`}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}