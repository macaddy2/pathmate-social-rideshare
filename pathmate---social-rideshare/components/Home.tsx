
import React from 'react';
import { UserRole } from '../types';

interface HomeProps {
  setRole: (role: UserRole) => void;
  setActiveTab: (tab: string) => void;
  avgRiderRating: number;
  avgDriverRating: number;
}

const Home: React.FC<HomeProps> = ({ setRole, setActiveTab, avgRiderRating, avgDriverRating }) => {
  const handleSelectRole = (role: UserRole) => {
    setRole(role);
    setActiveTab(role === UserRole.RIDER ? 'search' : 'post');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Connect with your path.</h2>
          <p className="text-indigo-100 text-sm mb-6 opacity-90">
            Share journeys, save fuel, and meet people heading your way. Decentralized commuting starts here.
          </p>
          <div className="flex gap-4 mt-2">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-indigo-100 block">Rider Score</span>
              <span className="text-lg font-black">⭐ {avgRiderRating}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
              <span className="text-[10px] uppercase font-bold text-indigo-100 block">Driver Score</span>
              <span className="text-lg font-black">⭐ {avgDriverRating}</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleSelectRole(UserRole.RIDER)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 transition-transform active:scale-95 hover:border-indigo-200"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800">I need a ride</span>
        </button>

        <button 
          onClick={() => handleSelectRole(UserRole.DRIVER)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 transition-transform active:scale-95 hover:border-indigo-200"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800">I am driving</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Nearby Active Routes
        </h3>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border-b border-gray-50 last:border-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center font-bold text-indigo-600">
                {i === 1 ? 'LDN' : 'MAN'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">Heading to City Center</div>
                <div className="text-xs text-gray-500">Leaving in {i * 15} mins • 3 seats left</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-600">${i * 5}.00</div>
                <div className="text-[10px] text-gray-400">per person</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
