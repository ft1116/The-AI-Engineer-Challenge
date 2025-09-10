'use client';

import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">AI</span>
            </div>
            <h1 className="text-xl font-medium text-slate-800 dark:text-slate-200 transition-colors">Chat Assistant</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400 transition-colors">Online</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}