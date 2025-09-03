import {
  IonAccordion,
  IonAccordionGroup,
  IonChip,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  useIonModal,
} from '@ionic/react';
import {
  chevronExpandOutline,
  keyOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import QRCode from 'react-qr-code';
import { shortenB64 } from '../../utils/compat';
import KeyStats, { KeyAbbrev } from '../keyStats';

const Agent = ({
  hideLabel,
  publicKeys,
  selectedKeyIndex,
  setSelectedKeyIndex,
}: {
  hideLabel?: boolean;
  publicKeys: string[][];
  selectedKeyIndex: [number, number];
  setSelectedKeyIndex: (key: [number, number]) => void;
}) => {
  const [present, dismiss] = useIonModal(KeyDetails, {
    onDismiss: () => dismiss(),
    selectedKeyIndex,
    publicKeys,
    setSelectedKeyIndex,
  });

  const selectedKey = publicKeys[selectedKeyIndex[0]][selectedKeyIndex[1]];

  return selectedKey ? (
    <IonChip
      onClick={(e) => {
        e.stopPropagation();
        present({
          initialBreakpoint: 0.75,
          breakpoints: [0, 0.75, 1],
        });
      }}
    >
      {!hideLabel && <code>{shortenB64(selectedKey)}</code>}
      <IonIcon
        style={
          hideLabel
            ? {
                marginLeft: '-4px',
              }
            : {}
        }
        icon={chevronExpandOutline}
        color="primary"
      ></IonIcon>
    </IonChip>
  ) : null;
};

export default Agent;

const KeyDetails = ({
  onDismiss,
  publicKeys: personas,
  selectedKeyIndex,
  setSelectedKeyIndex,
}: {
  onDismiss: () => void;
  publicKeys: string[][];
  selectedKeyIndex: [number, number];
  setSelectedKeyIndex: (key: [number, number]) => void;
}) => {
  const selectedKey = personas[selectedKeyIndex[0]][selectedKeyIndex[1]];
  return (
    <IonContent scrollY={false}>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <QRCode
          id="QRCode"
          size={256}
          style={{
            background: 'white',
            padding: '8px',
            marginBottom: '10px',
            height: 'auto',
            width: 200,
          }}
          value={selectedKey}
          viewBox={`0 0 256 256`}
        />
        <KeyStats value={selectedKey} />
      </div>

      <IonList>
        <IonListHeader>
          <IonLabel>
            <h2>
              Personas <IonIcon icon={keyOutline} color="primary"></IonIcon>
            </h2>
            <p>You have an unlimited set of persona keys in your agent.</p>
          </IonLabel>
        </IonListHeader>
        <section className="ion-content-scroll-host">
          <IonAccordionGroup>
            {personas.map((keys, i) => (
              <IonAccordion key={i} value={personas[i][0]}>
                <IonItem slot="header" color="light">
                  <IonLabel>
                    {i}
                    <IonIcon
                      className="ion-margin-start ion-margin-end"
                      icon={arrowForwardOutline}
                    />
                    <KeyAbbrev value={personas[i][0]} />
                  </IonLabel>
                </IonItem>
                <div className="ion-padding" slot="content">
                  {keys.map((pubKey, j) => (
                    <IonItem
                      key={pubKey}
                      button
                      detail={selectedKey !== pubKey}
                      onClick={() => {
                        setSelectedKeyIndex([i, j]);
                      }}
                      aria-selected={selectedKey === pubKey}
                      disabled={selectedKey === pubKey}
                    >
                      <IonLabel>
                        <code>{shortenB64(pubKey)}</code>
                        {pubKey === selectedKey && (
                          <IonIcon
                            className="ion-margin-start"
                            icon={checkmarkCircleOutline}
                            color="success"
                          ></IonIcon>
                        )}
                      </IonLabel>
                    </IonItem>
                  ))}
                </div>
              </IonAccordion>
            ))}
          </IonAccordionGroup>
        </section>
      </IonList>
    </IonContent>
  );
};
