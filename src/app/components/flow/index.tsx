import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonRange,
  useIonModal,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import ForceGraph3D from 'react-force-graph-3d';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import { useKeyDetails } from '../keyChip';
import {
  optionsOutline,
  timerOutline,
  addCircleOutline,
  discOutline,
  sunnyOutline,
  chevronExpandOutline,
} from 'ionicons/icons';
import { AppContext } from '../../utils/appContext';
import { shortenB64 } from '../../utils/compat';
import { GraphLink, GraphNode } from '../../utils/appTypes';
import Sequence from '../../modals/sequence';
import Assert from '../../modals/assert';

const NODE_R = 3;
const extraRenderers = [new CSS2DRenderer()];

function FlowMap({
  forKey,
  setForKey,
  nodes,
  links,
  rankingFilter,
}: {
  forKey: string;
  setForKey: (pk: string) => void;
  nodes: GraphNode[];
  links: GraphLink[];
  rankingFilter: number;
  colorScheme: 'light' | 'dark';
}) {
  const [presentKV] = useKeyDetails(forKey);

  const [presentPremiseModal, dismissPremise] = useIonModal(Sequence, {
    onDismiss: (data: string, role: string) => dismissPremise(data, role),
  });

  const [presentPointModal, dismissPoint] = useIonModal(Assert, {
    onDismiss: (data: string, role: string) => dismissPoint(data, role),
    forKey,
  });

  const handleNodeFocus = useCallback(
    (node: any, clicked: boolean = false) => {
      if (node?.pubkey === forKey && clicked) {
        presentKV({
          initialBreakpoint: 0.75,
          breakpoints: [0, 0.75, 1],
        });
      } else {
        if (node?.id === -1) {
          presentPointModal();
        } else {
          setForKey(node?.pubkey);
        }
      }
    },
    [forKey, setForKey, presentKV, presentPointModal],
  );

  const initialNode = useMemo(
    () => nodes.find((n) => n.pubkey === forKey),
    [nodes, forKey],
  );

  useEffect(() => {
    handleNodeFocus(initialNode);
  }, [initialNode, handleNodeFocus]);

  const forceRef = useRef<any>();

  const maxWeight = useMemo(
    () => Math.max(...links.map((l) => l.value)),
    [links],
  );

  const [present, dismiss] = useIonModal(Filters, {
    onDismiss: () => dismiss(),
    value: rankingFilter,
  });

  const handleSearch = (ev: Event) => {
    const target = ev.target as HTMLIonSearchbarElement;
    if (!target) return;

    const value = target.value!;

    if (!value) {
      return;
    }

    if (new RegExp('[A-Za-z0-9/+]{43}=').test(value)) {
      setForKey(value);
    } else {
      //remove non Base64 characters eg: @&!; etc and pad with 00000
      const query = `${value.replace(/[^A-Za-z0-9/+]/gi, '').padEnd(43, '0')}=`;
      setForKey(query);
    }
  };

  const placeholderRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Update rect on mount and when window resizes
  useLayoutEffect(() => {
    function updateRect() {
      if (placeholderRef.current) {
        setRect(placeholderRef.current.getBoundingClientRect());
      }
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  // Force a re-measure after initial paint
  useEffect(() => {
    setTimeout(() => {
      if (placeholderRef.current) {
        setRect(placeholderRef.current.getBoundingClientRect());
      }
    }, 0);
  }, []);

  useIonViewWillEnter(() => {
    const container = document.getElementById('fg-portal');
    if (container !== null) {
      container.style.display = 'block'; // Show portal container
    }
  }, []);

  useIonViewWillLeave(() => {
    const container = document.getElementById('fg-portal');
    if (container !== null) {
      container.style.display = 'none'; // Remove portal container
    }
  }, []);

  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });

  /*
  const resetNodes = () => {
    setData({
      nodes: initialNode ? [initialNode] : [],
      links: [],
    });
  };

  const iterateNodes = useCallback(() => {
    setData((dt) => {
      // Find the next link not already in dt.links, ordered by height then time
      const existingLinks = new Set(
        dt.links.map((l) => `${l.source}-${l.target}`),
      );
      const sortedLinks = [...links].sort((a, b) =>
        a.height !== b.height ? a.height - b.height : a.time - b.time,
      );
      const nextLink = sortedLinks.find(
        (l) => !existingLinks.has(`${l.source}-${l.target}`),
      );
      if (!nextLink) return dt; // All links already added

      // Add source and target nodes if not already present
      const existingNodeIds = new Set(dt.nodes.map((n) => n.id));
      const newNodes = [];
      const sourceNode = nodes.find((n) => n.id === nextLink.source);
      const targetNode = nodes.find((n) => n.id === nextLink.target);
      if (sourceNode && !existingNodeIds.has(sourceNode.id))
        newNodes.push(sourceNode);
      if (targetNode && !existingNodeIds.has(targetNode.id))
        newNodes.push(targetNode);

      return {
        nodes: [...dt.nodes, ...newNodes],
        links: [...dt.links, nextLink],
      };
    });
  }, [nodes, links]);
*/

  const deflateNodes = () => {
    setData(() => {
      // Find the latest incoming link to initialNode, ordered by height then time
      const incomingLinks = links
        .filter((l) => l.target === initialNode?.id)
        .sort((a, b) =>
          a.height !== b.height ? b.height - a.height : b.time - a.time,
        );
      const latestLink = incomingLinks[0];

      if (!latestLink || !initialNode) {
        return {
          nodes: initialNode ? [initialNode] : [],
          links: [],
        };
      }

      // Find the source node for the latest link
      const sourceNode = nodes.find((n) => n.id === latestLink.source);

      return {
        nodes: sourceNode ? [sourceNode, initialNode] : [initialNode],
        links: [latestLink],
      };
    });
  };

  const inflateNodes = useCallback(() => {
    setData({
      nodes,
      links,
    });
  }, [nodes, links, setData]);

  useEffect(() => {
    inflateNodes();
  }, [inflateNodes]);

  return (
    <IonCard>
      <IonCardHeader className="ion-padding-horizontal">
        <IonCardSubtitle
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IonInput
            style={{ fontFamily: 'monospace, monospace', minHeight: '30px' }}
            aria-label="for-key"
            type="url"
            enterkeyhint="go"
            fill="outline"
            clearOnEdit={true}
            debounce={1000}
            value={forKey}
            onIonChange={(ev) => handleSearch(ev)}
          />
        </IonCardSubtitle>
        <IonCardSubtitle className="ion-no-padding">
          <IonButton
            className="ion-no-padding"
            fill="clear"
            onClick={(e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }}
          >
            <IonIcon color="primary" slot="icon-only" icon={optionsOutline} />
            <IonBadge
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                opacity: 0.9,
              }}
              className="ion-no-padding"
              color="danger"
            ></IonBadge>
          </IonButton>
          <IonButton onClick={() => presentPremiseModal()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={timerOutline}
            />
          </IonButton>
          <IonButton onClick={() => presentPointModal()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={addCircleOutline}
            />
          </IonButton>
          <IonButton onClick={() => deflateNodes()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={discOutline}
            />
          </IonButton>
          <IonButton onClick={() => inflateNodes()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={sunnyOutline}
            />
          </IonButton>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent className="ion-no-padding">
        <div
          ref={placeholderRef}
          className="flow-graph-container"
          style={{
            width: '100%',
            height: 'calc(100vh - 220px)',
            position: 'relative',
            zIndex: 1,
            background: 'transparent',
          }}
        />
        {rect
          ? createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  pointerEvents: 'auto',
                }}
              >
                <ForceGraph3D
                  ref={forceRef}
                  nodeRelSize={NODE_R}
                  extraRenderers={extraRenderers}
                  width={rect.width}
                  height={rect.height}
                  graphData={JSON.parse(JSON.stringify(data))}
                  linkWidth={(link) => 1}
                  linkDirectionalParticles={(link) =>
                    scaleEdgeWeight(link.value, maxWeight) * 5
                  }
                  linkDirectionalParticleSpeed={(link) =>
                    scaleEdgeWeight(link.value, maxWeight) * 0.01
                  }
                  nodeThreeObject={(node) => {
                    let parent = null;

                    if (node.id === initialNode?.id || node.id === -1) {
                      const icon = document.createElement('ion-icon');
                      icon.slot = 'end';
                      icon.icon =
                        node.id === -1
                          ? addCircleOutline
                          : chevronExpandOutline;

                      const par = document.createElement('ion-button');
                      par.appendChild(icon);

                      par.size = 'small';
                      par.style.textTransform = 'none';

                      par.color = node.id === -1 ? 'danger' : 'primary';

                      parent = par;
                    } else {
                      parent = document.createElement('ion-badge');
                      parent.color = 'tertiary';
                    }

                    parent.addEventListener('click', function (e) {
                      e.stopPropagation();
                      handleNodeFocus(node, true);
                    });
                    parent.style.cursor = 'pointer';
                    parent.style.pointerEvents = 'auto'; // Ensure element is clickable

                    const nodeEl = document.createElement('code');
                    nodeEl.textContent = node.label || shortenB64(node.pubkey);

                    parent.appendChild(nodeEl);
                    return new CSS2DObject(parent);
                  }}
                  nodeThreeObjectExtend={true}
                />
              </div>,
              document.getElementById('fg-portal')!,
            )
          : null}
      </IonCardContent>
    </IonCard>
  );
}

const scaleEdgeWeight = (weight: number, maxWeight: number) => {
  return Math.log2(2 + weight) / Math.log2(2 + maxWeight);
};

export default FlowMap;

export const Filters = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: string;
}) => {
  const { rankingFilter, setRankingFilter } = useContext(AppContext);

  return (
    <div className="ion-padding">
      <IonList>
        <IonItem>
          <IonRange
            aria-label="Attention filter"
            labelPlacement="start"
            label={`Filter < ${value}%`}
            pin={true}
            pinFormatter={(value: number) => `${value}%`}
            onIonChange={({ detail }) => setRankingFilter(Number(detail.value))}
            value={rankingFilter}
          />
        </IonItem>
        {/* <IonItem>
          <IonToggle>Toggle inflow/outflow</IonToggle>
        </IonItem>
        <IonItem>
          <IonToggle>Toggle snapshots</IonToggle>
        </IonItem>
        <IonItem>
          <IonToggle>Toggle knowledge/flow trees</IonToggle>
        </IonItem> */}
      </IonList>
    </div>
  );
};
