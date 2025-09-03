import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Transition } from '../utils/appTypes';

export const usePendingTransitions = (selectedKey: string) => {
  const { requestPendingTransitions } = useContext(AppContext);

  const [pendingTransitions, setPending] = useState<Transition[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        cleanup =
          requestPendingTransitions(selectedKey, (pending) =>
            setPending(pending),
          ) ?? cleanup;
      }
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [selectedKey, requestPendingTransitions]);

  return pendingTransitions;
};
