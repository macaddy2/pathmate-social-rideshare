import React, { useState } from 'react';
import { ArrowRight, Clock3, GitMerge, Lightbulb, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';

const suggestions = [
  'Find a weekday ride from Lekki to Marina',
  'Suggest a safer pickup point near Admiralty Way',
  'Explain why my best match is recommended',
];

const AIPlanner: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askPlanner = (prompt: string) => {
    setQuestion(prompt);
    setLoading(true);
    window.setTimeout(() => {
      setAnswer(
        'Your strongest weekday option leaves Admiralty Way between 7:25 and 7:40 AM. Chinedu’s route overlaps 88% of your journey, adds only four minutes to the driver, and uses a well-lit pickup point beside the main bus stop.',
      );
      setLoading(false);
    }, 450);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <section className="rounded-3xl bg-[#102a43] p-5 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.03em]">Commute assistant</h1>
        <p className="mt-2 text-sm leading-6 text-blue-100">Plan routes, understand matches, and choose practical pickup points.</p>
      </section>

      <Card className="rounded-3xl border-blue-100">
        <CardContent className="p-5">
          <label htmlFor="planner-question" className="text-sm font-extrabold text-slate-950">What do you need help with?</label>
          <div className="mt-3 flex gap-2">
            <Input
              id="planner-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Plan tomorrow's commute"
              className="h-12 rounded-xl"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && question.trim()) askPlanner(question.trim());
              }}
            />
            <Button
              size="icon"
              onClick={() => question.trim() && askPlanner(question.trim())}
              disabled={!question.trim() || loading}
              className="h-12 w-12 shrink-0 rounded-xl bg-blue-700 hover:bg-blue-800"
              aria-label="Ask commute assistant"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const icons = [Clock3, ShieldCheck, GitMerge];
          const Icon = icons[index];
          return (
            <button
              key={suggestion}
              type="button"
              onClick={() => askPlanner(suggestion)}
              className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left"
            >
              <Icon className="h-5 w-5 shrink-0 text-blue-700" />
              <span className="flex-1 text-sm font-bold leading-5 text-slate-900">{suggestion}</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-blue-50 p-5">
          <div className="h-2 w-28 animate-pulse rounded-full bg-blue-200" />
          <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-blue-100" />
          <div className="mt-2 h-2 w-4/5 animate-pulse rounded-full bg-blue-100" />
        </div>
      ) : null}

      {answer ? (
        <Card className="rounded-3xl border-blue-200 bg-blue-50/70">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              <h2 className="font-extrabold">PathMate recommendation</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{answer}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white p-3">
                <MapPin className="h-4 w-4 text-blue-700" />
                <p className="mt-2 text-xs font-extrabold text-slate-900">Admiralty bus stop</p>
                <p className="mt-1 text-[11px] text-slate-500">Suggested pickup</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <GitMerge className="h-4 w-4 text-blue-700" />
                <p className="mt-2 text-xs font-extrabold text-slate-900">88% overlap</p>
                <p className="mt-1 text-[11px] text-slate-500">Strongest route fit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default AIPlanner;
