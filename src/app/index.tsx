import { IonApp, setupIonicReact } from '@ionic/react';
import Context from './modals/context';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { useState, useEffect } from 'react';

import { AppContext } from './utils/appContext';
import {
  Transition,
  GraphLink,
  GraphNode,
  Profile,
  Stage,
  StageIdHeaderPair,
} from './utils/appTypes';
import { usePersistentState } from './useCases/usePersistentState';

import { useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { signTransition } from './useCases/useAgent';
import {
  transitionID,
  parseGraphDOT,
  socketEventListener,
} from './utils/compat';

setupIonicReact({ mode: 'md' });

const App: React.FC = () => {
  const [selectedNode, setSelectedNode] = usePersistentState(
    'selected-node',
    '',
  );

  const [publicKeys, setPublicKeys] = usePersistentState<string[][]>(
    'public-keys',
    [[]],
  );

  const [selectedKeyIndex, setSelectedKeyIndex] = usePersistentState<
    [number, number]
  >('selected-key-index', [0, 0]);

  const [tipHeader, setTipHeader] = useState<StageIdHeaderPair>();
  const [currentStage, setCurrentStage] = usePersistentState<Stage | null>(
    'current-stage',
    null,
  );

  const [genesisStage, setGenesisStage] = usePersistentState<Stage | null>(
    'genesis-stage',
    null,
  );

  const [graph, setGraph] = usePersistentState<{
    nodes: GraphNode[];
    links: GraphLink[];
  } | null>('flow-graph', null);

  const [rankingFilter, setRankingFilter] = useState(0);

  const { sendJsonMessage, readyState } = useWebSocket(
    `wss://${selectedNode}`,
    {
      protocols: ['consequence.1'],
      onOpen: () => console.log('opened', selectedNode),
      onError: () => console.log('errored', selectedNode),
      shouldReconnect: () => true,
      share: true,
      onMessage: (event) => {
        const { type, body } = JSON.parse(event.data);

        switch (type) {
          case 'inv_stage':
            document.dispatchEvent(
              new CustomEvent<{
                transition_id: string;
                error: string;
              }>('inv_stage', { detail: body.stage_ids }),
            );
            requestTipHeader();
            break;
          case 'tip_header':
            setTipHeader(body);
            break;
          case 'profile':
            document.dispatchEvent(
              new CustomEvent<Profile>('profile', {
                detail: body,
              }),
            );
            break;
          case 'graph':
            setGraph(parseGraphDOT(body.graph, body.public_key, rankingFilter));
            break;
          case 'stage':
            if (body.stage.header.height === 0) {
              setGenesisStage(body.stage);
            }
            setCurrentStage(body.stage);
            break;
          case 'transition':
            document.dispatchEvent(
              new CustomEvent<{
                transition_id: string;
                transition: Transition;
              }>('transition', {
                detail: {
                  transition_id: body.transition_id,
                  transition: body.transition,
                },
              }),
            );

            break;
          case 'push_transition_result':
            document.dispatchEvent(
              new CustomEvent<{
                transition_id: string;
                error: string;
              }>('push_transition_result', { detail: body }),
            );
            break;
          case 'public_key_transitions':
            document.dispatchEvent(
              new CustomEvent<{
                public_key: string;
                transitions: Transition[];
              }>('public_key_transitions', {
                detail: {
                  public_key: body.public_key,
                  transitions:
                    body.filter_stages?.flatMap((i: any) => i.transitions) ??
                    [],
                },
              }),
            );
            break;
          case 'filter_transition_queue':
            document.dispatchEvent(
              new CustomEvent<Transition[]>('filter_transition_queue', {
                detail: body.transitions,
              }),
            );
            break;
        }
      },
    },
  );

  const requestPeers = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;
    sendJsonMessage({
      type: 'get_peer_addresses',
    });
  }, [readyState, sendJsonMessage]);

  const requestStageById = useCallback(
    (stage_id: string) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_stage',
        body: { stage_id },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestStageByHeight = useCallback(
    (height: number) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_stage_by_height',
        body: { height },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestTipHeader = useCallback(() => {
    if (readyState !== ReadyState.OPEN) return;
    sendJsonMessage({ type: 'get_tip_header' });
  }, [readyState, sendJsonMessage]);

  const requestProfile = useCallback(
    (publicKeyB64: string, resultHandler: (profile: Profile) => void) => {
      if (readyState !== ReadyState.OPEN) return;
      if (!publicKeyB64) throw new Error('missing publicKey');

      sendJsonMessage({
        type: 'get_profile',
        body: {
          public_key: publicKeyB64,
        },
      });

      return socketEventListener<Profile>('profile', (data) => {
        if (data.public_key === publicKeyB64) {
          resultHandler(data);
        }
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestGraph = useCallback(
    (publicKeyB64: string = '') => {
      if (readyState !== ReadyState.OPEN) return;

      sendJsonMessage({
        type: 'get_graph',
        body: {
          public_key: publicKeyB64,
        },
      });
    },
    [readyState, sendJsonMessage],
  );

  const pushTransition = async (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { transition_id: string; error: string }) => void,
  ) => {
    if (readyState !== ReadyState.OPEN) return;
    if (to && memo && tipHeader?.header.height && publicKeys.length) {
      const transition = await signTransition(
        to,
        memo,
        tipHeader?.header.height,
        selectedKeyIndex,
        passphrase,
      );

      if (!transition) return;

      sendJsonMessage({
        type: 'push_transition',
        body: {
          transition,
        } as any,
      });

      return socketEventListener<{
        transition_id: string;
        error: string;
      }>('push_transition_result', (data) => {
        if (transitionID(transition) === data.transition_id) {
          resultHandler(data);
        }
      });
    }
  };

  const requestTransition = useCallback(
    (
      transition_id: string,
      resultHandler: (transition: Transition) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_transition',
        body: { transition_id },
      });

      return socketEventListener<{
        transition_id: string;
        transition: Transition;
      }>('transition', (data) => {
        if (transitionID(data.transition) === transition_id) {
          resultHandler(data.transition);
        }
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestPkTransitions = useCallback(
    (
      publicKeyB64: string,
      resultHandler: (transitions: Transition[]) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return () => {};
      if (!publicKeyB64) return () => {};
      if (!tipHeader?.header.height) return () => {};

      sendJsonMessage({
        type: 'get_public_key_transitions',
        body: {
          public_key: publicKeyB64,
          start_height: tipHeader?.header.height + 1,
          end_height: 0,
          limit: 10,
        },
      });

      return socketEventListener<{
        public_key: string;
        transitions: Transition[];
      }>('public_key_transitions', (data) => {
        if (data.public_key === publicKeyB64) {
          resultHandler(data.transitions);
        }
      });
    },
    [readyState, sendJsonMessage, tipHeader],
  );

  const applyFilter = useCallback(
    (publicKeysB64: string[]) => {
      if (readyState !== ReadyState.OPEN) return;
      if (publicKeysB64.length) {
        sendJsonMessage({
          type: 'filter_add',
          body: {
            public_keys: publicKeysB64,
          },
        });
      }
    },
    [readyState, sendJsonMessage],
  );

  const requestPendingTransitions = useCallback(
    (
      publicKeyB64: string,
      resultHandler: (transitions: Transition[]) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return;
      //applyFilter must be called first with a public key
      applyFilter([publicKeyB64]);
      sendJsonMessage({
        type: 'get_filter_transition_queue',
      });

      return socketEventListener<Transition[]>(
        'filter_transition_queue',
        (data) => {
          resultHandler(data);
        },
      );
    },
    [readyState, applyFilter, sendJsonMessage],
  );

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    prefersDark.matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const eventHandler = (mediaQuery: MediaQueryListEvent) =>
      setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    prefersDark.addEventListener('change', eventHandler);

    return () => {
      prefersDark.removeEventListener('change', eventHandler);
    };
  }, [prefersDark, setColorScheme]);

  const appState = {
    publicKeys,
    setPublicKeys,
    selectedKeyIndex,
    setSelectedKeyIndex,
    requestTipHeader,
    tipHeader,
    setTipHeader,
    requestStageById,
    requestStageByHeight,
    currentStage,
    setCurrentStage,
    genesisStage,
    setGenesisStage,
    requestProfile,
    requestGraph,
    graph,
    rankingFilter,
    setRankingFilter,
    pushTransition,
    requestTransition,
    requestPkTransitions,
    requestPendingTransitions,
    selectedNode,
    setSelectedNode,
    colorScheme,
  };

  useEffect(() => {
    //First load
    if (!!selectedNode) {
      requestPeers();
      requestTipHeader();
      requestStageByHeight(0);
    }
  }, [selectedNode, requestTipHeader, requestPeers, requestStageByHeight]);

  return (
    <AppContext.Provider value={appState}>
      <IonApp>
        <Context />
        <div id="fg-portal"></div>
      </IonApp>
    </AppContext.Provider>
  );
};

export default App;
