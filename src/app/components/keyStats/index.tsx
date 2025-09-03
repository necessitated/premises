import { IonChip, IonIcon, IonText } from '@ionic/react';
import {
  copyOutline,
  locationOutline,
  chevronCollapseOutline,
} from 'ionicons/icons';
import { useClipboard } from '../../useCases/useClipboard';
import { shortenB64 } from '../../utils/compat';
import { useProfile } from '../../useCases/useProfile';
import BioChip from '../bioChip';

export const KeyAbbrev = ({ value }: { value: string }) => {
  const abbrevKey = shortenB64(value);

  return <code>{abbrevKey}</code>;
};

const KeyStats = ({ value }: { value: string }) => {
  const { copyToClipboard } = useClipboard();

  const keyProfile = useProfile(value);

  const pubKeyRanking = keyProfile?.ranking;
  const pubKeyPoints = keyProfile?.imbalance;
  const catchment = keyProfile?.locale;
  const bio = keyProfile?.bio;
  const label = keyProfile?.label;

  return (
    <>
      <span>
        <IonChip onClick={() => copyToClipboard(value)}>
          <KeyAbbrev value={value} />
          <IonIcon icon={copyOutline} color="primary"></IonIcon>
        </IonChip>
        {catchment && (
          <IonChip
            onClick={(e) => {
              window.open(`https://plus.codes/${catchment}`);
            }}
          >
            <IonIcon
              style={{
                marginLeft: '-4px',
              }}
              icon={locationOutline}
              color="primary"
            ></IonIcon>
          </IonChip>
        )}
      </span>
      {bio && <BioChip value={bio} pseudonym={label} />}
      {pubKeyRanking !== undefined && (
        <IonText color="primary">
          <p>
            {pubKeyPoints !== undefined && (
              <>
                <strong>Intention: </strong>
                <i>{pubKeyPoints} pts</i>
                <IonIcon icon={chevronCollapseOutline} color="primary" />
              </>
            )}
            <br />
            {pubKeyRanking !== undefined && (
              <>
                <strong>Attention: </strong>
                <i>{Number((pubKeyRanking / 1) * 100).toFixed(2)}%</i>
              </>
            )}
          </p>
        </IonText>
      )}
    </>
  );
};

export default KeyStats;
