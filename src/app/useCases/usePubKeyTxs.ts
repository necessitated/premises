import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import { Assertion } from '../utils/appTypes';

export const usePubKeyAssertions = (pubKey: string) => {
  const { requestPkAssertions } = useContext(AppContext);
  const [pkAssertions, setPKAssertions] = useState<Assertion[]>([]);

  useEffect(() => {
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      if (pubKey) {
        cleanup =
          requestPkAssertions(pubKey, (pkx) => {
            setPKAssertions(pkx);
          }) ?? cleanup;
      }
    }, 0);
    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [pubKey, requestPkAssertions]);

  return pkAssertions;
};
