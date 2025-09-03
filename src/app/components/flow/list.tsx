import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonText,
  IonIcon,
  IonChip,
} from '@ionic/react';
import timeago from 'epoch-timeago';
import { arrowForward } from 'ionicons/icons';
import { KeyAbbrev } from '../keyStats';

interface Flow {
  from: string;
  to: string;
  value: number;
  time: number;
  height: number;
}

export const FlowItem: React.FC<Flow> = (flow) => {
  const { time } = flow;

  const timeMS = time * 1000;

  return (
    <IonItem lines="none">
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
                flow.from ?? '0000000000000000000000000000000000000000000='
              }
            />
          </IonChip>

          <IonIcon icon={arrowForward} />
          <IonChip outline={true}>
            <KeyAbbrev value={flow.to} />
          </IonChip>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default FlowItem;

interface FlowListProps {
  heading?: string;
  flows: Flow[];
}

export const FlowList = ({ flows, heading }: FlowListProps) => {
  return (
    <IonList>
      {heading && (
        <IonListHeader>
          <IonLabel>{heading}</IonLabel>
        </IonListHeader>
      )}
      {!flows.length && (
        <IonItem>
          <IonLabel>No Activity</IonLabel>
        </IonItem>
      )}
      {flows.map((fl, index) => (
        <FlowItem
          key={index}
          from={fl.from}
          to={fl.to}
          time={fl.time}
          height={fl.height}
          value={fl.value}
        />
      ))}
    </IonList>
  );
};
