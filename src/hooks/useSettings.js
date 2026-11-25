import { useEffect, useState } from 'react';
import { getSettings } from '../services/api';

/** Loads public payment settings (Stripe publishable keys) once. */
export function useSettings() {
  const [state, setState] = useState({ settings: null, error: '' });
  useEffect(() => {
    let alive = true;
    getSettings()
      .then((settings) => alive && setState({ settings, error: '' }))
      .catch((err) => alive && setState({ settings: null, error: err.message }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
