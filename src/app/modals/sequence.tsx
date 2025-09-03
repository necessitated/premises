import { AssertionList } from '../components/assertion';
import { PageShell } from '../components/pageShell';
import { useContext, useEffect } from 'react';
import { AppContext } from '../utils/appContext';

const Sequence = ({ onDismiss }: { onDismiss?: () => void }) => {
  const { tipHeader, requestPremiseByHeight, currentPremise, genesisPremise } =
    useContext(AppContext);

  const tipHeight = tipHeader?.header.height ?? 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestPremiseByHeight(tipHeight);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tipHeight, requestPremiseByHeight]);

  return (
    <PageShell
      onDismissModal={onDismiss}
      renderBody={() => (
        <>
          <AssertionList
            heading="First Premise"
            assertions={genesisPremise?.assertions ?? []}
          />
          {!!tipHeight && (
            <AssertionList
              heading={`Current Premise: #${tipHeight}`}
              assertions={currentPremise?.assertions ?? []}
            />
          )}
        </>
      )}
    />
  );
};

export default Sequence;
