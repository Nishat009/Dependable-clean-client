import { useState } from 'react';
import { errorMessage } from '../api';

// Runs a form or button action, keeps its error and busy state, and calls `refresh` when it succeeds.
export function useAction(refresh: () => void) {
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try {
        await action();
        refresh();
    }
    catch (e) {
        setError(errorMessage(e));
    }
    finally {
        setBusy(false);
    } };
    return { error, busy, run };
}
