import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const exists = state.items.find(i => i.id === action.payload.id);
      if (exists) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, qty: i.qty + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] };
    }

    case 'REMOVE_FROM_CART':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };

    case 'UPDATE_QTY':
      if (action.payload.qty === 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i
        ),
      };

    case 'TOGGLE_WISHLIST': {
      const inList = state.wishlist.includes(action.payload);
      return {
        ...state,
        wishlist: inList
          ? state.wishlist.filter(id => id !== action.payload)
          : [...state.wishlist, action.payload],
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
};

const emptyState = { items: [], wishlist: [] };

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, emptyState);

  // ── User change hone par uska data load karo ──
  useEffect(() => {
    const key = user ? `cart_${user.id}` : 'cart_guest';
    try {
      const saved = localStorage.getItem(key);
      dispatch({
        type: 'LOAD_STATE',
        payload: saved ? JSON.parse(saved) : emptyState,
      });
    } catch {
      dispatch({ type: 'LOAD_STATE', payload: emptyState });
    }
  }, [user]);

  // ── State change hone par save karo ──
  useEffect(() => {
    const key = user ? `cart_${user.id}` : 'cart_guest';
    localStorage.setItem(key, JSON.stringify(state));
  }, [state, user]);

  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ ...state, dispatch, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
