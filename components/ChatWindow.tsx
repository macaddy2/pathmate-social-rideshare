
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Lightbulb, Send } from 'lucide-react';
import { Message } from '../types';
import { getComplexCoordinationAdvice } from '../services/geminiService';
import { formatTime } from '../lib/formatters';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, targetName, targetId }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', senderId: targetId, text: `Hi! I'm ready to pick you up. See you soon!`, timestamp: new Date(), isAi: false },
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'You',
      text: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate other person reply after 2s
    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        senderId: targetId,
        text: "Got it! Thanks for the heads up.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, reply]);
    }, 2000);
  };

  const handleAiConcierge = async () => {
    if (!inputText.trim()) return;
    setIsThinking(true);
    const history = messages.map(m => `${m.senderId}: ${m.text}`).join('\n');
    const advice = await getComplexCoordinationAdvice(history, inputText);
    
    const aiMessage: Message = {
      id: `ai-${Date.now()}`,
      senderId: 'PathMate AI',
      text: advice || "I'm not sure how to help with that.",
      timestamp: new Date(),
      isAi: true
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setInputText('');
    setIsThinking(false);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-slideUp">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <div className="font-bold text-lg">{targetName}</div>
            <div className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold">Active Journey Chat</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-xs font-bold border border-white/20">
             {targetName.charAt(0)}
           </div>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(m => {
          const isMe = m.senderId === 'You';
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 
                m.isAi ? 'bg-purple-100 text-purple-900 border border-purple-200 rounded-tl-none' :
                'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
              }`}>
                {m.isAi && <div className="text-[10px] font-black uppercase mb-1 opacity-60">PathMate Smart Advisor</div>}
                <p className="whitespace-pre-wrap">{m.text}</p>
                <div className={`text-[10px] mt-1 opacity-60 text-right`}>
                  {formatTime(m.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        {isThinking && (
          <div className="flex items-start">
            <div className="bg-purple-50 p-3 rounded-2xl rounded-tl-none border border-purple-100 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-.15s]"></div>
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              </div>
              <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">AI is thinking deeply...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shadow-2xl">
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAiConcierge}
            title="Ask AI Advisor"
            className="bg-purple-100 text-purple-600 rounded-2xl hover:bg-purple-200 p-3 h-auto w-auto"
          >
            <Lightbulb className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 p-3 h-auto w-auto shadow-lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">Use the bulb icon for deep AI thinking on complex travel logic.</p>
      </div>
    </div>
  );
};

export default ChatWindow;
