'use client';

import { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import InputArea from './InputArea';
import { Message } from '@/types/chat';

interface DocumentStatus {
  has_document: boolean;
  document_name: string | null;
  vector_count: number;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>({
    has_document: false,
    document_name: null,
    vector_count: 0
  });
  const [useRAG, setUseRAG] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check document status on component mount
  useEffect(() => {
    checkDocumentStatus();
  }, []);

  const checkDocumentStatus = async () => {
    try {
      const backendUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';
      const response = await fetch(`${backendUrl}/document-status`);
      if (response.ok) {
        const status = await response.json();
        setDocumentStatus(status);
      }
    } catch (error) {
      console.error('Error checking document status:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);

    try {
      // Use the correct backend URL for local development
      const backendUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';
      const response = await fetch(`${backendUrl}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      await checkDocumentStatus(); // Refresh document status
      
      // Add success message to chat
      const successMessage: Message = {
        id: Date.now().toString(),
        content: `✅ PDF "${result.document_name}" uploaded and indexed successfully! (${result.chunks_count} chunks)`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !apiKey.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const backendUrl = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api';
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: content,
          model: 'gpt-4o-mini',
          api_key: apiKey,
          use_rag: useRAG,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get response: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        fullContent += chunk;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullContent }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        role: 'assistant',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      {/* API Key Input and Controls */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 transition-colors">
        <div className="space-y-4">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-orange-50 dark:bg-orange-900/20 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm transition-colors"
            />
          </div>

          {/* PDF Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Upload PDF Document
            </label>
            <div className="flex items-center space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!apiKey.trim() || isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Choose PDF'}
              </button>
              {documentStatus.has_document && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  📄 {documentStatus.document_name} ({documentStatus.vector_count} chunks)
                </span>
              )}
            </div>
          </div>

          {/* RAG Toggle */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useRAG}
                onChange={(e) => setUseRAG(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Use RAG (Answer from uploaded document)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">AI Chat with RAG</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Upload a PDF document to chat with it using RAG, or chat normally with the AI
            </p>
            <div className="text-sm text-slate-400 dark:text-slate-500 space-y-1">
              <p>• Enter your OpenAI API key above</p>
              <p>• Upload a PDF to enable document-based Q&A</p>
              <p>• Toggle RAG on/off as needed</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 transition-colors">
        <InputArea onSendMessage={handleSendMessage} disabled={isLoading || !apiKey.trim()} />
      </div>
    </div>
  );
}