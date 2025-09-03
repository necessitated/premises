import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonText,
  IonTextarea,
  IonToolbar,
} from '@ionic/react';
import { sunnyOutline, ellipsisHorizontalOutline } from 'ionicons/icons';
import { useInputValidationProps } from '../../useCases/useInputValidation';
import { DEFAULT_CONSEQUENCE_NODE } from '../../utils/constants';

const Navigator = ({
  currentNode,
  onDismiss,
}: {
  currentNode: string;
  onDismiss: (data?: string | null | undefined, role?: string) => void;
}) => {
  const {
    value: node,
    isValid: isNodeValid,
    isTouched: isNodeTouched,
    onBlur: onBlurNode,
    onInputChange: setNode,
  } = useInputValidationProps((node: string) => !!node);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              color="medium"
              disabled={!currentNode && !node}
              onClick={() => onDismiss(null, 'cancel')}
            >
              Cancel
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              disabled={!node}
              onClick={() => onDismiss(node, 'confirm')}
              strong={true}
            >
              Confirm
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IonIcon
                  className="ion-no-padding"
                  size="large"
                  icon={sunnyOutline}
                  color="primary"
                />
                <h1
                  style={{
                    margin: '0 0 0 5px',
                  }}
                >
                  Premises
                </h1>
              </div>
              <IonText color="secondary">
                <h6>In the premises, is the consequence...</h6>
              </IonText>
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>
        <section className="ion-padding">
          <IonText color="primary">
            <p>
              Enter a{' '}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/necessitated/consequence"
              >
                consequence
              </a>{' '}
              to continue.
            </p>
          </IonText>
          <IonTextarea
            className={`${isNodeValid && 'ion-valid'} ${
              isNodeValid === false && 'ion-invalid'
            } ${isNodeTouched && 'ion-touched'}`}
            label="consequence url"
            labelPlacement="stacked"
            placeholder="..."
            value={node}
            onIonBlur={onBlurNode}
            enterkeyhint="go"
            onIonInput={(event) =>
              setNode((event.target.value! ?? '').replace(/^https?:\/\//, ''))
            }
            rows={5}
          />
          <IonText color="secondary">
            <p>
              Favorite <i>"consequence"</i>:
            </p>
          </IonText>
          <IonChip onClick={() => setNode(DEFAULT_CONSEQUENCE_NODE)}>
            <IonIcon icon={ellipsisHorizontalOutline} color="primary"></IonIcon>
            <IonLabel>Sampling Premises</IonLabel>
          </IonChip>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;
