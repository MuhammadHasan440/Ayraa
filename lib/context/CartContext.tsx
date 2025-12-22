'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { CartItem } from '@/types';
import { app, auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] };

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  user: User | null;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const calculateTotals = (items: CartItem[]) => ({
  total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
});

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      return { items: newItems, ...calculateTotals(newItems) };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return { items: newItems, ...calculateTotals(newItems) };
    }
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
      );
      return { items: newItems, ...calculateTotals(newItems) };
    }
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };
    case 'SET_CART':
      return { items: action.payload, ...calculateTotals(action.payload) };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Guest cart helper
  const getGuestCart = (): CartItem[] => {
    const saved = localStorage.getItem('ayraa-cart-guest');
    return saved ? JSON.parse(saved) : [];
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      const guestCart = getGuestCart();

      if (currentUser) {
        const cartRef = doc(db, 'carts', currentUser.uid);
        const cartSnap = await getDoc(cartRef);
        let firestoreCart: CartItem[] = [];
        if (cartSnap.exists()) firestoreCart = cartSnap.data().items || [];

        // Merge guest cart
        const mergedCart = [...firestoreCart];
        guestCart.forEach(guestItem => {
          const existing = mergedCart.find(item => item.id === guestItem.id);
          if (existing) existing.quantity += guestItem.quantity;
          else mergedCart.push(guestItem);
        });

        dispatch({ type: 'SET_CART', payload: mergedCart });

        await setDoc(cartRef, { items: mergedCart });

        localStorage.removeItem('ayraa-cart-guest');
      } else {
        dispatch({ type: 'SET_CART', payload: guestCart });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save cart
  useEffect(() => {
    if (!loading) {
      if (user) {
        const cartRef = doc(db, 'carts', user.uid);
        setDoc(cartRef, { items: state.items });
      } else {
        localStorage.setItem('ayraa-cart-guest', JSON.stringify(state.items));
      }
    }
  }, [state.items, user, loading]);

  

  return (
    <CartContext.Provider value={{ state, dispatch, user, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
