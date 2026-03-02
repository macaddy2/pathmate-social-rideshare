
import React, { useState } from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { analyzeAppFeasibility } from '../services/geminiService';
import { Button } from './ui/button';
import { Card } from './ui/card';

const AIPlanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const fetchInsight = async (topic: string) => {
    setLoading(true);
    setInsight(null);
    
    const prompt = `
      As a world-class startup consultant, provide a deep, expert analysis of building a decentralized "Go-My-Way" carpooling app called PathMate.
      Specific Topic: ${topic}
      
      Address:
      1. Feasibility (Technical and Social)
      2. Marketability and User Acquisition
      3. Stack and Dependencies
      4. Unique User Experiences
      5. Regulatory/Safety Hurdles
      
      Use a highly professional, structured, and insightful tone.
    `;

    const result = await analyzeAppFeasibility(prompt);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">App Strategy</h2>
            <p className="text-xs text-gray-500 font-medium">Powered by Gemini 3 Pro (Thinking Mode)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'market', label: 'Market Feasibility', icon: '📈' },
            { id: 'safety', label: 'Safety & Trust Model', icon: '🛡️' },
            { id: 'growth', label: 'Growth Strategy', icon: '🚀' },
            { id: 'tech', label: 'Tech Stack Depth', icon: '💻' }
          ].map(item => (
            <Button
              key={item.id}
              variant="outline"
              onClick={() => fetchInsight(item.label)}
              className="justify-between p-4 h-auto rounded-xl hover:bg-purple-50 hover:border-purple-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="font-semibold text-gray-700">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Button>
          ))}
        </div>
      </Card>

      {loading && (
        <Card className="bg-purple-50 border-purple-100 p-6 flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-purple-900 font-bold">Deep Thinking in Progress...</p>
            <p className="text-xs text-purple-600 mt-1">Analyzing market trends and feasibility data.</p>
          </div>
        </Card>
      )}

      {insight && (
        <Card className="shadow-lg border-purple-100 p-6 animate-slideUp">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {insight}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIPlanner;
