import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Assertion } from '../utils/appTypes';

export const usePendingAssertions = (selectedKey: string) => {
  const { requestPendingAssertions } = useContext(AppContext);

  const [pendingAssertions, setPending] = useState<Assertion[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (selectedKey) {
        cleanup =
          requestPendingAssertions(selectedKey, (pending) =>
            setPending(pending),
          ) ?? cleanup;
      }
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [selectedKey, requestPendingAssertions]);

  return pendingAssertions;
};
