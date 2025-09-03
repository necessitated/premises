import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Transition } from '../utils/appTypes';

export const usePubKeyTransitions = (pubKey: string) => {
  const { requestPkTransitions } = useContext(AppContext);
  const [pkTransitions, setPKTransitions] = useState<Transition[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (pubKey) {
        cleanup =
          requestPkTransitions(pubKey, (pkx) => {
            setPKTransitions(pkx);
          }) ?? cleanup;
      }
    }, 0);
    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [pubKey, requestPkTransitions]);

  return pkTransitions;
};
