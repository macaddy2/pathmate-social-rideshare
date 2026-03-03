
import React, { useState } from 'react';
import { Star } from 'lucide-react';
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

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, targetName, targetId, role, onSubmit }) => {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (score === 0) return;
    onSubmit({
      fromId: 'You',
      toId: targetId,
      score,
      comment,
      role
    });
    setScore(0);
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 transform animate-scaleUp">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">Rate {targetName}</h3>
          <p className="text-xs text-gray-500">How was your experience with this {role.toLowerCase()}?</p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setScore(s)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                score >= s ? 'bg-yellow-400 text-white scale-110 shadow-lg' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Star className="w-6 h-6" fill="currentColor" />
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Optional comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-gray-50 rounded-xl p-3 h-24"
        />

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold">
            Skip
          </Button>
          <Button disabled={score === 0} onClick={handleSubmit} className="flex-1 py-3 rounded-xl font-bold">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
