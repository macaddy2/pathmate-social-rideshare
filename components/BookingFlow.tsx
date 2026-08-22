import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  GitMerge,
  MapPin,
  ShieldCheck,
  Star,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import type { RouteMatch } from '../types';
import { formatCurrency, formatTime } from '../lib/formatters';
import { requestBooking } from '../services/dataService';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface BookingFlowProps {
  match: RouteMatch | null;
  onClose: () => void;
  onOpenChat: (name: string, id: string) => void;
  onViewTrips: () => void;
}

type Step = 'details' | 'checkout' | 'requested';
type PaymentChoice = 'paystack' | 'wallet';

const BookingFlow: React.FC<BookingFlowProps> = ({
  match,
  onClose,
  onOpenChat,
  onViewTrips,
}) => {
  const [step, setStep] = useState<Step>('details');
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('paystack');
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ride = match?.driverRide;
  const driver = ride?.driver;
  const total = (match?.price || 0) * seats;

  if (!match || !ride || !driver) return null;

  const goBack = () => {
    if (step === 'checkout') setStep('details');
  };

  const handleRequestSeat = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await requestBooking(match, seats);
      setStep('requested');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request this seat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(match)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-0 sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Book a PathMate ride</DialogTitle>
          <DialogDescription>Review your route match and confirm payment.</DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <div>
            <div className="bg-[#102a43] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-200">Route match</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold">{Math.round(match.matchScore)}% compatible</h2>
                  <p className="mt-1 text-sm text-blue-100">Strong route, timing, and trust fit</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
                  <GitMerge className="h-6 w-6" />
                </span>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <section className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-base font-extrabold text-white">
                  {driver.displayName.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-extrabold text-slate-950">{driver.displayName}</p>
                    <CheckCircle2 className="h-4 w-4 text-blue-700" />
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {driver.driverRating?.toFixed(1) || '4.9'}
                    </span>
                    <span>{driver.driverRatingCount || 42} completed trips</span>
                  </p>
                </div>
                <p className="text-lg font-extrabold text-slate-950">{formatCurrency(match.price, match.currency)}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="grid grid-cols-[28px_1fr] gap-x-3 gap-y-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Pickup • {formatTime(match.estimatedPickupTime)}</p>
                    <p className="font-bold text-slate-900">{match.pickupAddress || 'Admiralty Way, Lekki'}</p>
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                    <GitMerge className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Drop-off • {formatTime(match.estimatedDropoffTime)}</p>
                    <p className="font-bold text-slate-900">{match.dropoffAddress || 'Marina, Victoria Island'}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-extrabold text-slate-950">Why this matches</h3>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <GitMerge className="mx-auto h-4 w-4 text-blue-700" />
                    <p className="mt-1 text-xs font-extrabold text-slate-900">{match.overlapPercentage}%</p>
                    <p className="text-[10px] text-slate-500">route overlap</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <Clock3 className="mx-auto h-4 w-4 text-blue-700" />
                    <p className="mt-1 text-xs font-extrabold text-slate-900">+{match.detourMinutes} min</p>
                    <p className="text-[10px] text-slate-500">driver detour</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-center">
                    <ShieldCheck className="mx-auto h-4 w-4 text-blue-700" />
                    <p className="mt-1 text-xs font-extrabold text-slate-900">Verified</p>
                    <p className="text-[10px] text-slate-500">identity</p>
                  </div>
                </div>
              </section>

              <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                {driver.vehicleColor || 'Silver'} {driver.vehicleMake || 'Toyota'} {driver.vehicleModel || 'Camry'} • {ride.seatsAvailable} seats available
              </div>

              <Button onClick={() => setStep('checkout')} className="h-12 w-full rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
                Continue to payment
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChat(driver.displayName, driver.id)}
                className="h-11 w-full rounded-xl font-bold text-blue-700"
              >
                Message {driver.displayName.split(' ')[0]}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'checkout' ? (
          <div className="p-5">
            <button type="button" onClick={goBack} className="mb-4 flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600">
              <ArrowLeft className="h-4 w-4" />
              Match details
            </button>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-950">Confirm your seat</h2>
            <p className="mt-1 text-sm text-slate-500">Reserve a seat securely. Payment activation follows the approved provider rollout.</p>

            <section className="mt-5 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-blue-700" />
                  <span className="text-sm font-bold text-slate-900">Seats</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setSeats(Math.max(1, seats - 1))} className="h-9 w-9 rounded-full">−</Button>
                  <span className="w-4 text-center font-extrabold">{seats}</span>
                  <Button variant="outline" size="icon" onClick={() => setSeats(Math.min(ride.seatsAvailable, seats + 1))} className="h-9 w-9 rounded-full">+</Button>
                </div>
              </div>
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-extrabold text-slate-950">Payment method</h3>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setPaymentChoice('paystack')}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                    paymentChoice === 'paystack' ? 'border-blue-700 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-blue-700" />
                  <span className="flex-1">
                    <span className="block text-sm font-extrabold text-slate-950">Paystack</span>
                    <span className="block text-xs text-slate-500">Card, bank transfer, or USSD</span>
                  </span>
                  {paymentChoice === 'paystack' ? <Check className="h-5 w-5 text-blue-700" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentChoice('wallet')}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                    paymentChoice === 'wallet' ? 'border-blue-700 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <WalletCards className="h-5 w-5 text-blue-700" />
                  <span className="flex-1">
                    <span className="block text-sm font-extrabold text-slate-950">PathMate wallet</span>
                    <span className="block text-xs text-slate-500">Available balance: ₦8,400</span>
                  </span>
                  {paymentChoice === 'wallet' ? <Check className="h-5 w-5 text-blue-700" /> : null}
                </button>
              </div>
            </section>

            <section className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between text-slate-600"><span>{seats} seat{seats > 1 ? 's' : ''}</span><span>{formatCurrency(total, match.currency)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Protection fee</span><span>₦0</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 font-extrabold text-slate-950"><span>Total</span><span>{formatCurrency(total, match.currency)}</span></div>
            </section>

            {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
            <Button onClick={handleRequestSeat} disabled={submitting} className="mt-5 h-12 w-full rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
              {submitting ? 'Requesting seat…' : 'Request seat'}
            </Button>
          </div>
        ) : null}

        {step === 'requested' ? (
          <div className="p-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">Seat requested</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-600">
              {driver.displayName.split(' ')[0]} has been notified. No payment has been taken while provider activation is pending.
            </p>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
              <p className="text-xs font-semibold text-slate-500">Tomorrow • {formatTime(match.estimatedPickupTime)}</p>
              <p className="mt-1 font-extrabold text-slate-950">{match.pickupAddress || 'Lekki Phase 1'} → {match.dropoffAddress || 'Victoria Island'}</p>
              <p className="mt-2 text-sm font-bold text-blue-700">Payment will be requested after provider activation.</p>
            </div>
            <Button onClick={onViewTrips} className="mt-5 h-12 w-full rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
              View upcoming trip
            </Button>
            <Button variant="ghost" onClick={onClose} className="mt-2 h-11 w-full rounded-xl font-bold text-slate-600">
              Back to matches
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default BookingFlow;
