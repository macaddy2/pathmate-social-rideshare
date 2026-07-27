import React from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  Repeat2,
  Route,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useRideStore } from '../stores/useRideStore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { role, setRole } = useRideStore();
  const displayName = profile?.displayName?.split(' ')[0] || 'Ada';

  const selectRole = (nextRole: UserRole) => {
    setRole(nextRole);
    navigate(nextRole === UserRole.DRIVER ? '/post' : '/search');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <section className="rounded-3xl bg-[#102a43] p-5 text-white shadow-lg">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200">Good evening, {displayName}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">Where are you headed?</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-extrabold">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1.5">
          <button
            type="button"
            onClick={() => selectRole(UserRole.RIDER)}
            className={`min-h-11 rounded-xl px-3 text-sm font-bold transition-colors ${
              role !== UserRole.DRIVER ? 'bg-white text-slate-950' : 'text-blue-100'
            }`}
          >
            Find a ride
          </button>
          <button
            type="button"
            onClick={() => selectRole(UserRole.DRIVER)}
            className={`min-h-11 rounded-xl px-3 text-sm font-bold transition-colors ${
              role === UserRole.DRIVER ? 'bg-white text-slate-950' : 'text-blue-100'
            }`}
          >
            Offer a ride
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/search')}
          className="mt-4 w-full rounded-2xl bg-white p-4 text-left text-slate-950 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MapPin className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-xs font-semibold text-slate-500">Your usual commute</span>
              <span className="block text-sm font-bold">Lekki Phase 1 → Victoria Island</span>
            </span>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </div>
        </button>
      </section>

      <Card className="overflow-hidden rounded-3xl border-blue-100 shadow-sm">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">Next commute</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">Tomorrow, 7:30 AM</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Match ready</span>
            </div>

            <div className="mt-5 grid grid-cols-[28px_1fr] gap-x-3 gap-y-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">Pickup</p>
                <p className="font-bold text-slate-900">Admiralty Way, Lekki</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                <Route className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500">Destination</p>
                <p className="font-bold text-slate-900">Marina, Victoria Island</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 py-3 text-center">
              <div>
                <Clock3 className="mx-auto h-4 w-4 text-blue-700" />
                <p className="mt-1 text-xs font-bold text-slate-900">34 min</p>
              </div>
              <div>
                <Repeat2 className="mx-auto h-4 w-4 text-blue-700" />
                <p className="mt-1 text-xs font-bold text-slate-900">Mon–Fri</p>
              </div>
              <div>
                <UsersRound className="mx-auto h-4 w-4 text-blue-700" />
                <p className="mt-1 text-xs font-bold text-slate-900">3 matches</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-950">Best route match</p>
              <span className="text-xs font-bold text-blue-700">92% compatible</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-sm font-extrabold text-white">CA</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-extrabold text-slate-950">Chinedu A.</p>
                  <CheckCircle2 className="h-4 w-4 text-blue-700" />
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />4.9</span>
                  <span>Toyota Camry</span>
                  <span>+4 min detour</span>
                </div>
              </div>
              <p className="font-extrabold text-slate-950">₦2,500</p>
            </div>
            <Button onClick={() => navigate('/search')} className="mt-4 h-12 w-full rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
              Review match
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate('/recurring')}
          className="min-h-28 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
        >
          <CalendarDays className="h-5 w-5 text-blue-700" />
          <p className="mt-3 text-sm font-extrabold text-slate-950">Recurring commute</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Manage weekday matching</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/safety')}
          className="min-h-28 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
        >
          <ShieldCheck className="h-5 w-5 text-blue-700" />
          <p className="mt-3 text-sm font-extrabold text-slate-950">Safety centre</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Contacts and trip sharing</p>
        </button>
      </div>

      <button
        type="button"
        onClick={() => selectRole(UserRole.DRIVER)}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <CarFront className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-extrabold text-slate-950">Already driving this way?</span>
          <span className="block text-xs text-slate-500">Offer spare seats without changing your journey.</span>
        </span>
        <ArrowRight className="h-5 w-5 text-slate-400" />
      </button>
    </div>
  );
};

export default Home;
