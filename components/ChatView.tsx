import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { startChat, sendMessage, sendFunctionResponse, availableFunctions } from '../services/geminiService';
import type { ChatMessage, ChartData } from '../types';
import { PulsingText } from './Spinner';
import { Chat } from '@google/genai';

const ThumbsUpIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
    </svg>
);
const ThumbsDownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.642a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-2.8A4 4 0 0014 9.667z" />
    </svg>
);

interface ExtendedChatMessage extends ChatMessage {
    component?: 'chart';
    chartData?: ChartData[];
    chartColor?: string;
}

const DataChart: React.FC<{data: ChartData[], color: string}> = ({ data, color }) => (
    <div className="h-48 w-full mt-2 bg-gray-100 p-2 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#374151', borderRadius: '0.5rem' }}
                />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const Message: React.FC<{ message: ExtendedChatMessage; onFeedback: (id: number, feedback: 'good' | 'bad') => void; }> = ({ message, onFeedback }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex flex-col items-start w-full ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
        <div
          className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary text-white rounded-br-none shadow-md'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <div className="prose prose-sm max-w-none prose-p:text-current">
              <ReactMarkdown>{message.text}</ReactMarkdown>
              {message.component === 'chart' && message.chartData && (
                <DataChart data={message.chartData} color={message.chartColor || '#8B5CF6'} />
              )}
          </div>
        </div>
      </div>
       {!isUser && (
        <div className="mt-2 ml-2 flex space-x-2">
            <button onClick={() => onFeedback(message.id, 'good')} className={`p-1 rounded-full transition-colors ${message.feedback === 'good' ? 'text-green-500 bg-gray-200' : 'text-gray-400 hover:bg-gray-200'}`}>
                <ThumbsUpIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onFeedback(message.id, 'bad')} className={`p-1 rounded-full transition-colors ${message.feedback === 'bad' ? 'text-red-500 bg-gray-200' : 'text-gray-400 hover:bg-gray-200'}`}>
                <ThumbsDownIcon className="w-4 h-4" />
            </button>
        </div>
      )}
    </div>
  );
};

const SuggestionButton: React.FC<{ text: string, onClick: (text: string) => void }> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-200 hover:text-gray-900 transition-colors border border-gray-300"
    >
        {text}
    </button>
);

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    { id: 0, role: 'model', text: "Hello! I'm the GenAiOps Hub assistant. I can answer questions about your project data, like 'what were the costs last week?' or 'show me the latency chart'." },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    chatRef.current = startChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFeedback = (id: number, feedback: 'good' | 'bad') => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === id ? { ...msg, feedback: msg.feedback === feedback ? undefined : feedback } : msg
      )
    );
  };

  const handleSend = async (messageText: string = userInput) => {
    if (!messageText.trim() || isLoading || !chatRef.current) return;
    
    const nextId = (messages[messages.length - 1]?.id ?? 0) + 1;
    const userMessage: ExtendedChatMessage = { id: nextId, role: 'user', text: messageText };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
        let response = await sendMessage(chatRef.current, messageText);
        
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const functionResult = availableFunctions[call.name]();
            
            setMessages(prev => [...prev, { id: nextId + 1, role: 'model', text: `*Calling tool: \`${call.name}\`...*`}]);

            response = await sendFunctionResponse(chatRef.current, call, functionResult);

            const finalMessage: ExtendedChatMessage = { id: nextId + 2, role: 'model', text: response.text };
            if (call.name === 'get_cost_data') {
                finalMessage.component = 'chart';
                finalMessage.chartData = functionResult;
                finalMessage.chartColor = '#06B6D4';
            } else if (call.name === 'get_latency_data') {
                finalMessage.component = 'chart';
                finalMessage.chartData = functionResult;
                finalMessage.chartColor = '#8B5CF6';
            }
             setMessages(prev => [...prev.slice(0, -1), finalMessage]);
        } else {
             const finalMessage: ExtendedChatMessage = { id: nextId + 1, role: 'model', text: response.text };
             setMessages(prev => [...prev, finalMessage]);
        }
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { id: nextId + 1, role: 'model', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = ["Show me the latency chart", "What were the costs last week?", "Summarize recent critical alerts"];

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh - 120px)] bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} onFeedback={handleFeedback} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="max-w-2xl px-4 py-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                <PulsingText text="Thinking..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        {!isLoading && messages.length <= 1 && (
            <div className="flex items-center space-x-2 mb-3">
                {suggestions.map(s => <SuggestionButton key={s} text={s} onClick={() => handleSend(s)} />)}
            </div>
        )}
        <div className="relative">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="w-full h-12 p-3 pr-20 bg-gray-100 text-gray-800 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 resize-none"
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !userInput.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};