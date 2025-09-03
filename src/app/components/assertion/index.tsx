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
import { Assertion } from '../../utils/appTypes';
import KeyChip from '../keyChip';
import { useClipboard } from '../../useCases/useClipboard';
import { ellipsisVertical, arrowForward } from 'ionicons/icons';
import {
  assertionID,
  getEmbeddedReference,
  shortenB64,
} from '../../utils/compat';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../utils/appContext';
import { OverlayEventDetail } from '@ionic/core/components';
import { KeyAbbrev } from '../keyStats';

export const AssertionItem: React.FC<Assertion> = (assertion) => {
  const [present, dismiss] = useIonModal(AssertionDetail, {
    onDismiss: () => dismiss(),
    assertion,
  });

  const { time } = assertion;

  const timeMS = time * 1000;

  return (
    <IonItem lines="none" onClick={assertion.memo ? () => present() : () => {}}>
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
                assertion.from ?? '0000000000000000000000000000000000000000000='
              }
            />
          </IonChip>

          <IonIcon icon={arrowForward} />
          <IonChip outline={true}>
            <KeyAbbrev value={assertion.to} />
          </IonChip>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default AssertionItem;

interface AssertionListProps {
  heading?: string;
  assertions: Assertion[];
}

export const AssertionList = ({ assertions, heading }: AssertionListProps) => {
  return (
    <IonList>
      {heading && (
        <IonListHeader>
          <IonLabel>{heading}</IonLabel>
        </IonListHeader>
      )}
      {!assertions.length && (
        <IonItem>
          <IonLabel>No Activity</IonLabel>
        </IonItem>
      )}
      {assertions.map((tx, index) => (
        <AssertionItem
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

export const AssertionDetail = ({
  onDismiss,
  assertion,
}: {
  onDismiss: () => void;
  assertion: Assertion;
}) => {
  const { copyToClipboard } = useClipboard();

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data }: OverlayEventDetail) => {
    if (data?.['action'] === 'copy') {
      copyToClipboard(`//${assertionID(assertion)}//`);
    }
  };

  const { requestAssertion } = useContext(AppContext);

  const referencedConxID = getEmbeddedReference(assertion);
  const [referenced, setReferenced] = useState<Assertion>();

  useEffect(() => {
    if (!referencedConxID) return;
    let cleanup = () => {};
    const timeoutId = window.setTimeout(() => {
      cleanup =
        requestAssertion(referencedConxID, (conx) => {
          setReferenced(conx);
        }) ?? cleanup;
    }, 0);

    return () => {
      cleanup();
      window.clearTimeout(timeoutId);
    };
  }, [referencedConxID, requestAssertion]);

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
                    assertion.from ??
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
                      assertion.from ?? '0000000',
                    )} => ${shortenB64(assertion.to)}`,
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
                {new Date(assertion.time * 1000).toDateString()}
              </IonNote>
            </IonLabel>
          </IonCardHeader>
          <IonCardContent>
            <KeyChip value={assertion.to} />

            {referenced ? (
              <IonCard>
                <IonCardContent>
                  <KeyChip value={referenced.to} />
                  <p>{referenced.memo}</p>
                </IonCardContent>
              </IonCard>
            ) : (
              <p>{assertion.memo}</p>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};
