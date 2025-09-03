import { TransitionList } from '../components/transition';
import { PageShell } from '../components/pageShell';
import { useContext, useEffect } from 'react';
import { AppContext } from '../utils/appContext';

const Sequence = ({ onDismiss }: { onDismiss?: () => void }) => {
  const { tipHeader, requestStageByHeight, currentStage, genesisStage } =
    useContext(AppContext);

  const tipHeight = tipHeader?.header.height ?? 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestStageByHeight(tipHeight);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tipHeight, requestStageByHeight]);

  return (
    <PageShell
      onDismissModal={onDismiss}
      renderBody={() => (
        <>
          <TransitionList
            heading="First Stage"
            transitions={genesisStage?.transitions ?? []}
          />
          {!!tipHeight && (
            <TransitionList
              heading={`Current Stage: #${tipHeight}`}
              transitions={currentStage?.transitions ?? []}
            />
          )}
        </>
      )}
    />
  );
};

export default Sequence;
