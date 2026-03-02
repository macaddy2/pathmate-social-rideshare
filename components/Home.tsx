import React from 'react';
import { useNavigate } from 'react-router';
import { User, Car } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../stores/useRideStore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setRole, getAverageRating } = useRideStore();

  const avgRiderRating = getAverageRating(user?.id || 'You', 'RIDER');
  const avgDriverRating = getAverageRating(user?.id || 'You', 'DRIVER');

  const handleSelectRole = (role: UserRole) => {
    setRole(role);
    navigate(role === UserRole.RIDER ? '/search' : '/post');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl border-none p-8 text-white shadow-xl relative overflow-hidden">
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
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleSelectRole(UserRole.RIDER)}
          className="h-auto p-6 rounded-2xl border-gray-100 flex flex-col items-center gap-3 transition-transform active:scale-95 hover:border-indigo-200"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <span className="font-semibold text-gray-800">I need a ride</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => handleSelectRole(UserRole.DRIVER)}
          className="h-auto p-6 rounded-2xl border-gray-100 flex flex-col items-center gap-3 transition-transform active:scale-95 hover:border-indigo-200"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <span className="font-semibold text-gray-800">I am driving</span>
        </Button>
      </div>

      <Card className="rounded-2xl border-gray-100">
        <CardContent className="p-6">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
