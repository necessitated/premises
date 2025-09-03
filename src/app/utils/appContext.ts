import { createContext } from 'react';
import {
  Stage,
  StageIdHeaderPair,
  Transition,
  Profile,
  GraphNode,
  GraphLink,
} from '../utils/appTypes';

interface AppState {
  publicKeys: string[][];
  setPublicKeys: (keys: string[][]) => void;
  selectedKeyIndex: [number, number];
  setSelectedKeyIndex: (index: [number, number]) => void;
  requestTipHeader: () => void;
  tipHeader?: StageIdHeaderPair;
  setTipHeader: (tipHeader: StageIdHeaderPair) => void;
  requestStageByHeight: (height: number) => void;
  requestStageById: (stage_id: string) => void;
  currentStage?: Stage | null;
  setCurrentStage: (currentStage: Stage) => void;
  genesisStage?: Stage | null;
  setGenesisStage: (genesisStage: Stage) => void;
  requestProfile: (
    publicKeyB64: string,
    resultHandler: (profile: Profile) => void,
  ) => (() => void) | undefined;
  requestGraph: (publicKeyB64: string) => void;
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  } | null;
  rankingFilter: number;
  setRankingFilter: (rankingFilter: number) => void;
  requestTransition: (
    transition_id: string,
    resultHandler: (transition: Transition) => void,
  ) => (() => void) | undefined;
  requestPkTransitions: (
    publicKeyB64: string,
    resultHandler: (transitions: Transition[]) => void,
  ) => (() => void) | undefined;
  pushTransition: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { transition_id: string; error: string }) => void,
  ) => Promise<(() => void) | undefined>;

  requestPendingTransitions: (
    publicKeyB64: string,
    resultHandler: (transitions: Transition[]) => void,
  ) => (() => void) | undefined;
  selectedNode: string;
  setSelectedNode: (node: string) => void;
  colorScheme: 'light' | 'dark';
}

export const AppContext = createContext<AppState>({
  publicKeys: [],
  setPublicKeys: () => {},
  selectedKeyIndex: [0, 0],
  setSelectedKeyIndex: (index: [number, number]) => {},
  tipHeader: undefined,
  requestTipHeader: () => {},
  setTipHeader: () => {},
  requestStageById: (stage_id: string) => {},
  requestStageByHeight: (height: number) => {},
  currentStage: undefined,
  setCurrentStage: (currentStage: Stage) => {},
  genesisStage: undefined,
  setGenesisStage: (genesisStage: Stage) => {},
  requestProfile:
    (publicKeyB64: string, resultHandler: (profile: Profile) => void) =>
    () => {},
  requestGraph: (publicKeyB64: string) => {},
  graph: null,
  rankingFilter: 0,
  setRankingFilter: () => {},
  requestTransition:
    (transition_id: string, resultHandler: (transition: Transition) => void) =>
    () => {},
  requestPkTransitions:
    (
      publicKeyB64: string,
      resultHandler: (transitions: Transition[]) => void,
    ) =>
    () => {},
  requestPendingTransitions:
    (
      publicKeyB64: string,
      resultHandler: (transitions: Transition[]) => void,
    ) =>
    () => {},
  selectedNode: '',
  setSelectedNode: () => {},
  colorScheme: 'light',
  pushTransition: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { transition_id: string; error: string }) => void,
  ) => Promise.resolve(undefined),
});
