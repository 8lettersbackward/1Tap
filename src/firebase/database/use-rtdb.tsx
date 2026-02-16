'use client';

import { useEffect, useState } from 'react';
import { DatabaseReference, onValue, off } from 'firebase/database';

/**
 * A hook to subscribe to a Realtime Database reference.
 * Returns the data at that path. If the data is an object, 
 * it can be returned as an array if desired.
 */
export function useRtdb<T = any>(ref: DatabaseReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    const callback = onValue(
      ref,
      (snapshot) => {
        const val = snapshot.val();
        // If it's an object with keys, and we want to handle it like a collection
        // we often need to transform it to an array. 
        // We'll leave it as is here, and let the component decide.
        setData(val);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      // For RTDB onValue, it returns an unsubscribe function in newer SDKs, 
      // but technically onValue itself is the listener.
      // The return value of onValue is indeed an unsubscribe function.
      callback();
    };
  }, [ref]);

  return { data, loading, error };
}
