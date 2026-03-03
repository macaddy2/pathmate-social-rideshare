import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { useRideStore } from '../stores/useRideStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useActiveRidesStore } from '../stores/useActiveRidesStore';
import { useRecurringRidesStore } from '../stores/useRecurringRidesStore';
import { useWalletStore } from '../stores/useWalletStore';
import { paymentService } from '../services/paymentService';
import { UserRole } from '../types';
import type { GeoPoint, RecurringRide } from '../types';

// Initialize payment service so wallet store's refreshWallet() works
beforeAll(async () => {
    await paymentService.init('test-user');
});

// ============================================
// useRideStore
// ============================================

describe('useRideStore', () => {
  beforeEach(() => {
    // Reset store to default state
    useRideStore.setState({
      role: UserRole.GUEST,
      ratings: [
        { fromId: 'a', toId: 'You', score: 5, role: 'DRIVER' },
        { fromId: 'b', toId: 'You', score: 4, role: 'DRIVER' },
        { fromId: 'c', toId: 'You', score: 5, role: 'RIDER' },
      ],
    });
  });

  it('should have default role as GUEST', () => {
    const { role } = useRideStore.getState();
    expect(role).toBe(UserRole.GUEST);
  });

  it('should set role', () => {
    useRideStore.getState().setRole(UserRole.DRIVER);
    expect(useRideStore.getState().role).toBe(UserRole.DRIVER);
  });

  it('should add a rating', () => {
    const initialCount = useRideStore.getState().ratings.length;
    useRideStore.getState().addRating({
      fromId: 'd',
      toId: 'You',
      score: 3,
      role: 'RIDER',
    });
    expect(useRideStore.getState().ratings.length).toBe(initialCount + 1);
  });

  it('should calculate average rating for DRIVER role', () => {
    const avg = useRideStore.getState().getAverageRating('You', 'DRIVER');
    // (5 + 4) / 2 = 4.5
    expect(avg).toBe(4.5);
  });

  it('should calculate average rating for RIDER role', () => {
    const avg = useRideStore.getState().getAverageRating('You', 'RIDER');
    // Only one rating: 5
    expect(avg).toBe(5);
  });

  it('should return 5.0 for user with no ratings', () => {
    const avg = useRideStore.getState().getAverageRating('unknown-user', 'DRIVER');
    expect(avg).toBe(5.0);
  });
});

// ============================================
// useSearchStore
// ============================================

describe('useSearchStore', () => {
  beforeEach(() => {
    useSearchStore.getState().clearSearch();
  });

  it('should have empty initial state', () => {
    const { search } = useSearchStore.getState();
    expect(search.pickupAddress).toBe('');
    expect(search.pickupLocation).toBeNull();
    expect(search.dropoffAddress).toBe('');
    expect(search.dropoffLocation).toBeNull();
  });

  it('should update a single field', () => {
    useSearchStore.getState().updateField('pickupAddress', 'Lagos');
    expect(useSearchStore.getState().search.pickupAddress).toBe('Lagos');
    expect(useSearchStore.getState().search.dropoffAddress).toBe(''); // Unchanged
  });

  it('should update location fields', () => {
    const location: GeoPoint = { lat: 6.5244, lng: 3.3792 };
    useSearchStore.getState().updateField('pickupLocation', location);
    expect(useSearchStore.getState().search.pickupLocation).toEqual(location);
  });

  it('should set entire search state', () => {
    const newSearch = {
      pickupAddress: 'Lagos',
      pickupLocation: { lat: 6.5244, lng: 3.3792 },
      dropoffAddress: 'Ibadan',
      dropoffLocation: { lat: 7.3775, lng: 3.947 },
    };
    useSearchStore.getState().setSearch(newSearch);
    expect(useSearchStore.getState().search).toEqual(newSearch);
  });

  it('should clear search', () => {
    useSearchStore.getState().updateField('pickupAddress', 'Lagos');
    useSearchStore.getState().clearSearch();
    expect(useSearchStore.getState().search.pickupAddress).toBe('');
  });
});

// ============================================
// useActiveRidesStore
// ============================================

describe('useActiveRidesStore', () => {
  beforeEach(() => {
    useActiveRidesStore.setState({ activeRides: [] });
  });

  const mockRide = {
    id: 'ride-1',
    matchedRiders: [],
  } as any;

  it('should start with empty rides', () => {
    expect(useActiveRidesStore.getState().activeRides).toEqual([]);
  });

  it('should add a ride', () => {
    useActiveRidesStore.getState().addRide(mockRide);
    expect(useActiveRidesStore.getState().activeRides).toHaveLength(1);
    expect(useActiveRidesStore.getState().activeRides[0].id).toBe('ride-1');
  });

  it('should prepend new rides', () => {
    const ride2 = { ...mockRide, id: 'ride-2' };
    useActiveRidesStore.getState().addRide(mockRide);
    useActiveRidesStore.getState().addRide(ride2);
    expect(useActiveRidesStore.getState().activeRides[0].id).toBe('ride-2');
  });

  it('should remove a ride', () => {
    useActiveRidesStore.getState().addRide(mockRide);
    useActiveRidesStore.getState().removeRide('ride-1');
    expect(useActiveRidesStore.getState().activeRides).toHaveLength(0);
  });

  it('should update a ride', () => {
    useActiveRidesStore.getState().addRide(mockRide);
    useActiveRidesStore.getState().updateRide('ride-1', (ride) => ({
      ...ride,
      matchedRiders: [{ id: 'rider-1', name: 'Rider', rating: 5, pickupAddress: 'A', dropoffAddress: 'B', status: 'pending' as const }],
    }));
    expect(useActiveRidesStore.getState().activeRides[0].matchedRiders).toHaveLength(1);
  });

  it('should set all rides', () => {
    const rides = [
      { ...mockRide, id: 'ride-1' },
      { ...mockRide, id: 'ride-2' },
    ];
    useActiveRidesStore.getState().setActiveRides(rides);
    expect(useActiveRidesStore.getState().activeRides).toHaveLength(2);
  });
});

// ============================================
// useRecurringRidesStore
// ============================================

describe('useRecurringRidesStore', () => {
  beforeEach(() => {
    useRecurringRidesStore.setState({ rides: [] });
  });

  const mockRecurring: RecurringRide = {
    id: 'rec-1',
    userId: 'user-1',
    origin: 'Lagos',
    originLocation: { lat: 6.5244, lng: 3.3792 },
    destination: 'Ibadan',
    destinationLocation: { lat: 7.3775, lng: 3.947 },
    role: 'driver',
    schedule: { days: ['mon', 'wed', 'fri'], time: '08:00' },
    isActive: true,
    pricePerSeat: 2000,
    seatsAvailable: 3,
    createdAt: new Date(),
  };

  it('should start with empty rides', () => {
    expect(useRecurringRidesStore.getState().rides).toEqual([]);
  });

  it('should add a ride', () => {
    useRecurringRidesStore.getState().addRide(mockRecurring);
    expect(useRecurringRidesStore.getState().rides).toHaveLength(1);
  });

  it('should update a ride', () => {
    useRecurringRidesStore.getState().addRide(mockRecurring);
    useRecurringRidesStore.getState().updateRide('rec-1', { pricePerSeat: 2500 });
    expect(useRecurringRidesStore.getState().rides[0].pricePerSeat).toBe(2500);
  });

  it('should delete a ride', () => {
    useRecurringRidesStore.getState().addRide(mockRecurring);
    useRecurringRidesStore.getState().deleteRide('rec-1');
    expect(useRecurringRidesStore.getState().rides).toHaveLength(0);
  });

  it('should toggle active status', () => {
    useRecurringRidesStore.getState().addRide(mockRecurring);
    expect(useRecurringRidesStore.getState().rides[0].isActive).toBe(true);

    useRecurringRidesStore.getState().toggleActive('rec-1');
    expect(useRecurringRidesStore.getState().rides[0].isActive).toBe(false);

    useRecurringRidesStore.getState().toggleActive('rec-1');
    expect(useRecurringRidesStore.getState().rides[0].isActive).toBe(true);
  });

  it('should set all rides', () => {
    const rides = [mockRecurring, { ...mockRecurring, id: 'rec-2' }];
    useRecurringRidesStore.getState().setRides(rides);
    expect(useRecurringRidesStore.getState().rides).toHaveLength(2);
  });
});

// ============================================
// useWalletStore
// ============================================

describe('useWalletStore', () => {
  beforeEach(() => {
    useWalletStore.setState({ wallet: null, transactions: [] });
  });

  it('should start with null wallet', () => {
    expect(useWalletStore.getState().wallet).toBeNull();
  });

  it('should set wallet', () => {
    const wallet = {
      userId: 'user-1',
      balance: 5000,
      currency: 'NGN',
      lastUpdated: new Date(),
    };
    useWalletStore.getState().setWallet(wallet);
    expect(useWalletStore.getState().wallet).toEqual(wallet);
  });

  it('should set transactions', () => {
    const transactions = [
      {
        id: 'txn-1',
        bookingId: 'booking-1',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 2000,
        currency: 'NGN',
        provider: 'paystack' as const,
        providerRef: 'ref-1',
        status: 'completed' as const,
        createdAt: new Date(),
      },
    ];
    useWalletStore.getState().setTransactions(transactions);
    expect(useWalletStore.getState().transactions).toHaveLength(1);
  });

  it('should add transaction (prepend)', () => {
    const txn1 = {
      id: 'txn-1',
      bookingId: 'booking-1',
      fromUserId: 'user-1',
      toUserId: 'user-2',
      amount: 2000,
      currency: 'NGN',
      provider: 'paystack' as const,
      providerRef: 'ref-1',
      status: 'completed' as const,
      createdAt: new Date(),
    };
    const txn2 = { ...txn1, id: 'txn-2', amount: 3000 };

    useWalletStore.getState().addTransaction(txn1);
    useWalletStore.getState().addTransaction(txn2);

    const { transactions } = useWalletStore.getState();
    expect(transactions).toHaveLength(2);
    expect(transactions[0].id).toBe('txn-2'); // Most recent first
  });

  it('should refresh wallet from payment service', () => {
    useWalletStore.getState().refreshWallet();
    const { wallet, transactions } = useWalletStore.getState();
    expect(wallet).not.toBeNull();
    expect(wallet!.balance).toBeGreaterThanOrEqual(0);
    expect(transactions.length).toBeGreaterThan(0);
  });
});
