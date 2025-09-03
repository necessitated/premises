import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonCard,
  IonCardContent,
  IonCardHeader,
  useIonModal,
  IonText,
  IonNote,
  IonContent,
  IonPage,
  IonButton,
  IonToolbar,
  IonHeader,
  IonButtons,
  IonCardSubtitle,
  IonIcon,
  useIonActionSheet,
  IonChip,
} from '@ionic/react';
import timeago from 'epoch-timeago';
import { Transition } from '../../utils/appTypes';
import KeyChip from '../keyChip';
import { useClipboard } from '../../useCases/useClipboard';
import { ellipsisVertical, arrowForward } from 'ionicons/icons';
import {
  transitionID,
  getEmbeddedReference,
  shortenB64,
} from '../../utils/compat';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../utils/appContext';
import { OverlayEventDetail } from '@ionic/core/components';
import { KeyAbbrev } from '../keyStats';

export const TransitionItem: React.FC<Transition> = (transition) => {
  const [present, dismiss] = useIonModal(TransitionDetail, {
    onDismiss: () => dismiss(),
    transition,
  });

  const { time } = transition;

  const timeMS = time * 1000;

  return (
    <IonItem
      lines="none"
      onClick={transition.memo ? () => present() : () => {}}
    >
      <IonLabel className="ion-text-wrap">
        <IonText color="tertiary">
          <sub>
            <time dateTime={new Date(timeMS).toISOString()}>
              <p>{timeago(timeMS)}</p>
            </time>
          </sub>
        </IonText>
        <div>
          <IonChip outline={true}>
            <KeyAbbrev
              value={
                transition.from ??
                '0000000000000000000000000000000000000000000='
              }
            />
          </IonChip>

          <IonIcon icon={arrowForward} />
          <IonChip outline={true}>
            <KeyAbbrev value={transition.to} />
          </IonChip>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default TransitionItem;

interface TransitionListProps {
  heading?: string;
  transitions: Transition[];
}

export const TransitionList = ({
  transitions,
  heading,
}: TransitionListProps) => {
  return (
    <IonList>
      {heading && (
        <IonListHeader>
          <IonLabel>{heading}</IonLabel>
        </IonListHeader>
      )}
      {!transitions.length && (
        <IonItem>
          <IonLabel>No Activity</IonLabel>
        </IonItem>
      )}
      {transitions.map((tx, index) => (
        <TransitionItem
          key={index}
          from={tx.from}
          to={tx.to}
          memo={tx.memo}
          time={tx.time}
          nonce={tx.nonce}
          series={tx.series}
        />
      ))}
    </IonList>
  );
};

export const TransitionDetail = ({
  onDismiss,
  transition,
}: {
  onDismiss: () => void;
  transition: Transition;
}) => {
  const { copyToClipboard } = useClipboard();

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data }: OverlayEventDetail) => {
    if (data?.['action'] === 'copy') {
      copyToClipboard(`//${transitionID(transition)}//`);
    }
  };

  const { requestTransition } = useContext(AppContext);

  const referencedConxID = getEmbeddedReference(transition);
  const [referenced, setReferenced] = useState<Transition>();

  useEffect(() => {
    if (!referencedConxID) return;
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      cleanup =
        requestTransition(referencedConxID, (conx) => {
          setReferenced(conx);
        }) ?? cleanup;
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [referencedConxID, requestTransition]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={() => onDismiss()}>
              Close
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardSubtitle
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                Asserted by:{' '}
                <KeyChip
                  value={
                    transition.from ??
                    '0000000000000000000000000000000000000000000='
                  }
                />
              </div>
              <IonButton
                className="ion-no-padding"
                fill="clear"
                onClick={() => {
                  presentActionSheet({
                    onDidDismiss: ({ detail }) => handleActionSheet(detail),
                    header: `${shortenB64(
                      transition.from ?? '0000000',
                    )} => ${shortenB64(transition.to)}`,
                    buttons: [
                      {
                        text: 'Copy reference',
                        data: {
                          action: 'copy',
                        },
                      },
                    ],
                  });
                }}
              >
                <IonIcon
                  color="primary"
                  slot="icon-only"
                  icon={ellipsisVertical}
                ></IonIcon>
              </IonButton>
            </IonCardSubtitle>
            <IonLabel>
              <IonNote>
                {new Date(transition.time * 1000).toDateString()}
              </IonNote>
            </IonLabel>
          </IonCardHeader>
          <IonCardContent>
            <KeyChip value={transition.to} />

            {referenced ? (
              <IonCard>
                <IonCardContent>
                  <KeyChip value={referenced.to} />
                  <p>{referenced.memo}</p>
                </IonCardContent>
              </IonCard>
            ) : (
              <p>{transition.memo}</p>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};
