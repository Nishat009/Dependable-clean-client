import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api';

interface Remote<T> {
  data: T;
  /** True until the first answer arrives. */
  loading: boolean;
  error: string;
  refresh(): void;
}

// Loads a list (or any value) from the API. A null path waits, for example until the user is known.
export function useRemote<T>(path: string | null, fallback: T): Remote<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return undefined;
    let active = true;
    api<T>(path)
      .then((value) => { if (active) { setData(value ?? fallback); setError(''); } })
      .catch((cause: unknown) => { if (active) setError(errorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // The fallback only fills the gap before the first answer, so a new fallback object does not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version]);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  return { data, loading, error, refresh };
}
