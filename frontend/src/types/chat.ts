export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isError?: boolean;
}

export interface ChatRequest {
  developer_message: string;
  user_message: string;
  model?: string;
  api_key: string;
}
