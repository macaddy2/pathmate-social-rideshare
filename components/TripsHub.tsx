import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  ReceiptText,
  Route,
  ShieldCheck,
  Star,
  WalletCards,
} from 'lucide-react';
import RatingModal from './RatingModal';
import { useChatStore } from '../stores/useChatStore';
import { useRideStore } from '../stores/useRideStore';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

type TripTab = 'upcoming' | 'active' | 'past';
type ActiveState = 'arriving' | 'ready' | 'in_progress' | 'completed';

const TripsHub: React.FC = () => {
  const navigate = useNavigate();
  const openChat = useChatStore((state) => state.openChat);
  const addRating = useRideStore((state) => state.addRating);
  const [tab, setTab] = useState<TripTab>('upcoming');
  const [activeState, setActiveState] = useState<ActiveState>('arriving');
  const [showRating, setShowRating] = useState(false);

  const advanceTrip = () => {
    setActiveState((current) => {
      if (current === 'arriving') return 'ready';
      if (current === 'ready') return 'in_progress';
      if (current === 'in_progress') return 'completed';
      return 'completed';
    });
  };

  const statusCopy: Record<ActiveState, { title: string; body: string; action: string }> = {
    arriving: {
      title: 'Chinedu is 6 minutes away',
      body: 'Toyota Camry • Silver • LND 482 FK',
      action: 'Driver has arrived',
    },
    ready: {
      title: 'Your driver is at the pickup point',
      body: 'Meet beside the Admiralty Way bus stop.',
      action: 'Start trip',
    },
    in_progress: {
      title: 'Trip in progress',
      body: 'Estimated arrival at Marina: 8:16 AM',
      action: 'Complete trip',
    },
    completed: {
      title: 'You have arrived',
      body: 'Payment has been released from escrow.',
      action: 'Rate this trip',
    },
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950">Your trips</h1>
        <p className="mt-1 text-sm text-slate-500">Bookings, live journeys, and completed rides.</p>
      </div>

      <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1.5">
        {(['upcoming', 'active', 'past'] as TripTab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`min-h-10 rounded-xl text-xs font-extrabold capitalize ${
              tab === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === 'upcoming' ? (
        <Card className="overflow-hidden rounded-3xl border-blue-100 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-blue-700">Confirmed</span>
                <span className="text-xs font-semibold text-slate-500">Tomorrow • 7:30 AM</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-sm font-extrabold text-white">CA</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-slate-950">Chinedu A.</p>
                    <CheckCircle2 className="h-4 w-4 text-blue-700" />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />4.9 • Toyota Camry
                  </p>
                </div>
                <p className="font-extrabold text-slate-950">₦2,500</p>
              </div>

              <div className="mt-5 grid grid-cols-[28px_1fr] gap-x-3 gap-y-4">
                <MapPin className="h-5 w-5 text-blue-700" />
                <div><p className="text-xs text-slate-500">Pickup</p><p className="font-bold text-slate-900">Admiralty Way, Lekki</p></div>
                <Route className="h-5 w-5 text-slate-900" />
                <div><p className="text-xs text-slate-500">Destination</p><p className="font-bold text-slate-900">Marina, Victoria Island</p></div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => openChat('Chinedu A.', 'driver-1')} className="h-11 rounded-xl font-bold">
                  <MessageCircle className="h-4 w-4" /> Message
                </Button>
                <Button onClick={() => setTab('active')} className="h-11 rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
                  Trip details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'active' ? (
        <div className="space-y-4">
          <section className="rounded-3xl bg-[#102a43] p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-200">Live trip</p>
            <div className="mt-4 flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
                {activeState === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : <Navigation className="h-6 w-6" />}
              </span>
              <div>
                <h2 className="text-xl font-extrabold">{statusCopy[activeState].title}</h2>
                <p className="mt-1 text-sm leading-5 text-blue-100">{statusCopy[activeState].body}</p>
              </div>
            </div>
            {activeState !== 'completed' ? (
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <div className="flex items-center justify-between text-xs text-blue-100">
                  <span>Lekki</span><span>Victoria Island</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                  <div className={`h-full rounded-full bg-blue-400 ${activeState === 'in_progress' ? 'w-3/4' : activeState === 'ready' ? 'w-1/3' : 'w-1/6'}`} />
                </div>
              </div>
            ) : null}
          </section>

          <Card className="rounded-3xl border-slate-200">
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => openChat('Chinedu A.', 'driver-1')} className="h-12 rounded-xl font-bold">
                  <MessageCircle className="h-4 w-4" /> Message
                </Button>
                <Button variant="outline" onClick={() => navigate('/safety')} className="h-12 rounded-xl font-bold">
                  <ShieldCheck className="h-4 w-4" /> Share trip
                </Button>
              </div>
              <Button
                onClick={() => activeState === 'completed' ? setShowRating(true) : advanceTrip()}
                className="mt-3 h-12 w-full rounded-xl bg-blue-700 font-bold hover:bg-blue-800"
              >
                {statusCopy[activeState].action}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === 'past' ? (
        <div className="space-y-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-extrabold text-slate-950">Lekki → Victoria Island</p>
                  <p className="mt-1 text-xs text-slate-500">24 July • Chinedu A. • Completed</p>
                </div>
                <p className="font-extrabold text-slate-950">₦2,500</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                <Button variant="ghost" onClick={() => navigate('/wallet')} className="h-10 rounded-xl font-bold text-slate-600">
                  <ReceiptText className="h-4 w-4" /> Receipt
                </Button>
                <Button variant="secondary" onClick={() => setShowRating(true)} className="h-10 rounded-xl font-bold text-blue-700">
                  <Star className="h-4 w-4" /> Rate trip
                </Button>
              </div>
            </CardContent>
          </Card>

          <button type="button" onClick={() => navigate('/history')} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left">
            <CalendarClock className="h-5 w-5 text-blue-700" />
            <span className="flex-1 text-sm font-extrabold text-slate-950">View complete ride history</span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
          <button type="button" onClick={() => navigate('/wallet')} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left">
            <WalletCards className="h-5 w-5 text-blue-700" />
            <span className="flex-1 text-sm font-extrabold text-slate-950">Payments and receipts</span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>
      ) : null}

      <RatingModal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        targetName="Chinedu A."
        targetId="driver-1"
        role="DRIVER"
        onSubmit={(rating) => {
          addRating(rating);
          setShowRating(false);
        }}
      />
    </div>
  );
};

export default TripsHub;
