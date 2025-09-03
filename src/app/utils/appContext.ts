import { createContext } from 'react';
import {
  Premise,
  PremiseIdHeaderPair,
  Assertion,
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
  tipHeader?: PremiseIdHeaderPair;
  setTipHeader: (tipHeader: PremiseIdHeaderPair) => void;
  requestPremiseByHeight: (height: number) => void;
  requestPremiseById: (premise_id: string) => void;
  currentPremise?: Premise | null;
  setCurrentPremise: (currentPremise: Premise) => void;
  genesisPremise?: Premise | null;
  setGenesisPremise: (genesisPremise: Premise) => void;
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
  requestAssertion: (
    assertion_id: string,
    resultHandler: (assertion: Assertion) => void,
  ) => (() => void) | undefined;
  requestPkAssertions: (
    publicKeyB64: string,
    resultHandler: (assertions: Assertion[]) => void,
  ) => (() => void) | undefined;
  pushAssertion: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { assertion_id: string; error: string }) => void,
  ) => Promise<(() => void) | undefined>;

  requestPendingAssertions: (
    publicKeyB64: string,
    resultHandler: (assertions: Assertion[]) => void,
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
  requestPremiseById: (premise_id: string) => {},
  requestPremiseByHeight: (height: number) => {},
  currentPremise: undefined,
  setCurrentPremise: (currentPremise: Premise) => {},
  genesisPremise: undefined,
  setGenesisPremise: (genesisPremise: Premise) => {},
  requestProfile:
    (publicKeyB64: string, resultHandler: (profile: Profile) => void) =>
    () => {},
  requestGraph: (publicKeyB64: string) => {},
  graph: null,
  rankingFilter: 0,
  setRankingFilter: () => {},
  requestAssertion:
    (assertion_id: string, resultHandler: (assertion: Assertion) => void) =>
    () => {},
  requestPkAssertions:
    (publicKeyB64: string, resultHandler: (assertions: Assertion[]) => void) =>
    () => {},
  requestPendingAssertions:
    (publicKeyB64: string, resultHandler: (assertions: Assertion[]) => void) =>
    () => {},
  selectedNode: '',
  setSelectedNode: () => {},
  colorScheme: 'light',
  pushAssertion: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: [number, number],
    resultHandler: (data: { assertion_id: string; error: string }) => void,
  ) => Promise.resolve(undefined),
});
