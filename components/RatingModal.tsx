
import React, { useState } from 'react';
import { Rating } from '../types';

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
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>

        <textarea
          placeholder="Optional comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-24 focus:ring-2 focus:ring-indigo-500 outline-none"
        ></textarea>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={score === 0}
            className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
