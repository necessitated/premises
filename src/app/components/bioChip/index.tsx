import { IonButton, IonIcon, IonText, IonTextarea } from '@ionic/react';
import { callOutline, linkOutline, mailOutline } from 'ionicons/icons';

/**
 * Supported link types
 * tel:1234567890
 * mailto: me@example.com
 * https://example.com
 */

interface BioChipProps {
  value: string;
  pseudonym?: string;
}

const BioChip: React.FC<BioChipProps> = ({ value, pseudonym }) => {
  return isBioLink(value) ? (
    <IonButton
      target={value.startsWith('tel:') ? '' : '_blank'}
      href={isBioLink(value) ? value : undefined}
      size="small"
    >
      {pseudonym && pseudonym}
      <IonIcon slot="end" icon={bioLinkIcon(value)}></IonIcon>
    </IonButton>
  ) : !!value ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <IonText color="secondary">
        <h6>{pseudonym}</h6>
      </IonText>
      <IonTextarea
        style={{ minHeight: '30px' }}
        readonly
        fill="outline"
        value={`"${value}"`} // Display value in quotes
      />
    </div>
  ) : null;
};

export default BioChip;

const isBioLink = (value: string) =>
  value.startsWith('tel:') ||
  value.startsWith('mailto:') ||
  value.startsWith('https:');

const bioLinkIcon = (value: string) => {
  if (value.startsWith('tel:')) {
    return callOutline;
  }

  if (value.startsWith('mailto:')) {
    return mailOutline;
  }

  if (value.startsWith('https:')) {
    return linkOutline;
  }
};
