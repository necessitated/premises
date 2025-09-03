import { IonChip, IonIcon, useIonModal } from '@ionic/react';
import { receiptOutline } from 'ionicons/icons';
import KeyStats, { KeyAbbrev } from '../keyStats';
import { useFlow } from '../../useCases/useFlow';
import { FlowList } from '../flow/list';

interface KeyChipProps {
  value: string;
  label?: string;
  readonly?: boolean;
}

export const useKeyDetails = (key: string) => {
  const [present, dismiss] = useIonModal(KeyDetails, {
    onDismiss: () => dismiss(),
    value: key,
  });

  return [present] as const;
};

const KeyChip: React.FC<KeyChipProps> = ({ value, label, readonly }) => {
  const [present] = useKeyDetails(value);

  return value ? (
    <IonChip
      onClick={
        readonly
          ? () => {}
          : (e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }
      }
    >
      {!readonly && <IonIcon icon={receiptOutline} color="primary"></IonIcon>}
      {label ? <code>{label}</code> : <KeyAbbrev value={value} />}
    </IonChip>
  ) : null;
};

export default KeyChip;

const KeyDetails = ({ value }: { onDismiss: () => void; value: string }) => {
  const flows = useFlow(value);
  return (
    <>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <KeyStats value={value} />
        {!!flows && !!flows.length && (
          <div
            style={{
              alignSelf: 'stretch',
            }}
          >
            <FlowList flows={flows} />
          </div>
        )}
      </div>
    </>
  );
};
