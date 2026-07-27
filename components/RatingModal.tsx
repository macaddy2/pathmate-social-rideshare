import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Rating } from '../types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetId: string;
  role: 'RIDER' | 'DRIVER';
  onSubmit: (rating: Rating) => void;
}

const criteriaForRole = {
  DRIVER: ['Punctuality', 'Communication', 'Safe driving', 'Vehicle condition'],
  RIDER: ['Punctuality', 'Communication', 'Respectful', 'Pickup readiness'],
};

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, targetName, targetId, role, onSubmit }) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [wouldRideAgain, setWouldRideAgain] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (score === 0) return;
    const details = [
      tags.length > 0 ? `Highlights: ${tags.join(', ')}` : '',
      wouldRideAgain !== null ? `Would ride again: ${wouldRideAgain ? 'yes' : 'no'}` : '',
      comment,
    ].filter(Boolean).join('. ');

    onSubmit({
      fromId: 'You',
      toId: targetId,
      score,
      comment: details,
      role,
    });
    setScore(0);
    setComment('');
    setTags([]);
    setWouldRideAgain(null);
    onClose();
  };

  const toggleTag = (tag: string) => {
    setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div role="dialog" aria-modal="true" aria-labelledby="rating-title" className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="rating-title" className="text-xl font-extrabold tracking-[-0.02em] text-slate-950">Rate {targetName}</h3>
            <p className="mt-1 text-xs text-slate-500">Your feedback appears only after a completed trip.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full" aria-label="Close rating">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setScore(value)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                score >= value ? 'bg-amber-400 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
              }`}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
            >
              <Star className="h-5 w-5" fill="currentColor" />
            </button>
          ))}
        </div>

        <section className="mt-6">
          <h4 className="text-sm font-extrabold text-slate-950">What stood out?</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {criteriaForRole[role].map((criterion) => (
              <button
                type="button"
                key={criterion}
                onClick={() => toggleTag(criterion)}
                className={`min-h-9 rounded-full border px-3 text-xs font-bold ${
                  tags.includes(criterion) ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                {criterion}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h4 className="text-sm font-extrabold text-slate-950">Would you ride together again?</h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button type="button" variant={wouldRideAgain === true ? 'default' : 'outline'} onClick={() => setWouldRideAgain(true)} className={`h-10 rounded-xl ${wouldRideAgain === true ? 'bg-blue-700' : ''}`}>Yes</Button>
            <Button type="button" variant={wouldRideAgain === false ? 'default' : 'outline'} onClick={() => setWouldRideAgain(false)} className={`h-10 rounded-xl ${wouldRideAgain === false ? 'bg-blue-700' : ''}`}>No</Button>
          </div>
        </section>

        <Textarea
          placeholder="Add a private or public note about the trip"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="mt-5 h-24 rounded-xl bg-slate-50 p-3"
        />

        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onClose} className="h-11 flex-1 rounded-xl font-bold">Skip</Button>
          <Button disabled={score === 0} onClick={handleSubmit} className="h-11 flex-1 rounded-xl bg-blue-700 font-bold hover:bg-blue-800">Submit</Button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
