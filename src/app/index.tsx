import { IonApp, setupIonicReact } from '@ionic/react';
import Explorer from './modals/explorer';

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
  Assertion,
  GraphLink,
  GraphNode,
  Profile,
  Premise,
  PremiseIdHeaderPair,
} from './utils/appTypes';
import { usePersistentState } from './useCases/usePersistentState';

import { useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { signAssertion } from './useCases/useAgent';
import {
  assertionID,
  parseGraphDOT,
  socketEventListener,
} from './utils/compat';
import { DEFAULT_CONSEQUENCE_NODE } from './utils/constants';

setupIonicReact({ mode: 'md' });

const App: React.FC = () => {
  const [selectedNode, setSelectedNode] = usePersistentState(
    'selected-node',
    DEFAULT_CONSEQUENCE_NODE,
  );

  const [publicKeys, setPublicKeys] = usePersistentState<string[][]>(
    'public-keys',
    [[]],
  );

  const [selectedKeyIndex, setSelectedKeyIndex] = usePersistentState<
    [number, number]
  >('selected-key-index', [0, 0]);

  const [tipHeader, setTipHeader] = useState<PremiseIdHeaderPair>();
  const [currentPremise, setCurrentPremise] =
    usePersistentState<Premise | null>('current-premise', null);

  const [genesisPremise, setGenesisPremise] =
    usePersistentState<Premise | null>('genesis-premise', null);

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
          case 'inv_premise':
            document.dispatchEvent(
              new CustomEvent<{
                assertion_id: string;
                error: string;
              }>('inv_premise', { detail: body.premise_ids }),
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
          case 'premise':
            if (body.premise.header.height === 0) {
              setGenesisPremise(body.premise);
            }
            setCurrentPremise(body.premise);
            break;
          case 'assertion':
            document.dispatchEvent(
              new CustomEvent<{
                assertion_id: string;
                assertion: Assertion;
              }>('assertion', {
                detail: {
                  assertion_id: body.assertion_id,
                  assertion: body.assertion,
                },
              }),
            );

            break;
          case 'push_assertion_result':
            document.dispatchEvent(
              new CustomEvent<{
                assertion_id: string;
                error: string;
              }>('push_assertion_result', { detail: body }),
            );
            break;
          case 'public_key_assertions':
            document.dispatchEvent(
              new CustomEvent<{
                public_key: string;
                assertions: Assertion[];
              }>('public_key_assertions', {
                detail: {
                  public_key: body.public_key,
                  assertions:
                    body.filter_premises?.flatMap((i: any) => i.assertions) ??
                    [],
                },
              }),
            );
            break;
          case 'filter_assertion_queue':
            document.dispatchEvent(
              new CustomEvent<Assertion[]>('filter_assertion_queue', {
                detail: body.assertions,
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

  const requestPremiseById = useCallback(
    (premise_id: string) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_premise',
        body: { premise_id },
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestPremiseByHeight = useCallback(
    (height: number) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_premise_by_height',
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

  const pushAssertion = async (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { assertion_id: string; error: string }) => void,
  ) => {
    if (readyState !== ReadyState.OPEN) return;
    if (to && memo && tipHeader?.header.height && publicKeys.length) {
      const assertion = await signAssertion(
        to,
        memo,
        tipHeader?.header.height,
        selectedKeyIndex,
        passphrase,
      );

      if (!assertion) return;

      sendJsonMessage({
        type: 'push_assertion',
        body: {
          assertion,
        } as any,
      });

      return socketEventListener<{
        assertion_id: string;
        error: string;
      }>('push_assertion_result', (data) => {
        if (assertionID(assertion) === data.assertion_id) {
          resultHandler(data);
        }
      });
    }
  };

  const requestAssertion = useCallback(
    (assertion_id: string, resultHandler: (assertion: Assertion) => void) => {
      if (readyState !== ReadyState.OPEN) return;
      sendJsonMessage({
        type: 'get_assertion',
        body: { assertion_id },
      });

      return socketEventListener<{
        assertion_id: string;
        assertion: Assertion;
      }>('assertion', (data) => {
        if (assertionID(data.assertion) === assertion_id) {
          resultHandler(data.assertion);
        }
      });
    },
    [readyState, sendJsonMessage],
  );

  const requestPkAssertions = useCallback(
    (
      publicKeyB64: string,
      resultHandler: (assertions: Assertion[]) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return () => {};
      if (!publicKeyB64) return () => {};
      if (!tipHeader?.header.height) return () => {};

      sendJsonMessage({
        type: 'get_public_key_assertions',
        body: {
          public_key: publicKeyB64,
          start_height: tipHeader?.header.height + 1,
          end_height: 0,
          limit: 10,
        },
      });

      return socketEventListener<{
        public_key: string;
        assertions: Assertion[];
      }>('public_key_assertions', (data) => {
        if (data.public_key === publicKeyB64) {
          resultHandler(data.assertions);
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

  const requestPendingAssertions = useCallback(
    (
      publicKeyB64: string,
      resultHandler: (assertions: Assertion[]) => void,
    ) => {
      if (readyState !== ReadyState.OPEN) return;
      //applyFilter must be called first with a public key
      applyFilter([publicKeyB64]);
      sendJsonMessage({
        type: 'get_filter_assertion_queue',
      });

      return socketEventListener<Assertion[]>(
        'filter_assertion_queue',
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
    requestPremiseById,
    requestPremiseByHeight,
    currentPremise,
    setCurrentPremise,
    genesisPremise,
    setGenesisPremise,
    requestProfile,
    requestGraph,
    graph,
    rankingFilter,
    setRankingFilter,
    pushAssertion,
    requestAssertion,
    requestPkAssertions,
    requestPendingAssertions,
    selectedNode,
    setSelectedNode,
    colorScheme,
  };

  useEffect(() => {
    //First load
    if (!!selectedNode) {
      requestPeers();
      requestTipHeader();
      requestPremiseByHeight(0);
    }
  }, [selectedNode, requestTipHeader, requestPeers, requestPremiseByHeight]);

  return (
    <AppContext.Provider value={appState}>
      <IonApp>
        <Explorer />
        <div id="fg-portal"></div>
      </IonApp>
    </AppContext.Provider>
  );
};

export default App;
