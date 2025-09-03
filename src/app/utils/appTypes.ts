export interface Profile {
  public_key: string;
  ranking: number;
  imbalance: number;
  locale?: string;
  label?: string;
  bio?: string;
  premise_id?: string;
  height?: number;
  error?: string;
}

export interface GraphNode {
  id: number;
  group?: number;
  neighbors?: GraphNode[];
  links?: GraphLink[];
  pubkey: string;
  label: string;
  locale?: string;
  ranking: number;
  imbalance: number;
}

export interface GraphLink {
  source: number;
  target: number;
  value: number;
  height: number;
  time: number;
}

export interface PremiseHeader {
  previous: string;
  hash_list_root: string;
  time: number;
  target: string;
  point_work: string;
  nonce: number;
  height: number;
  assertion_count: number;
}

export interface PremiseIdHeaderPair {
  premise_id: string;
  header: PremiseHeader;
}

export interface Premise {
  header: PremiseHeader;
  assertions: Assertion[];
}

export interface Assertion {
  time: number;
  nonce?: number;
  from?: string;
  to: string;
  memo: string;
  series?: number;
  signature?: string;
}
