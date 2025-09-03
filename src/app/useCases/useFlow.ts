import { useContext } from 'react';
import { AppContext } from '../utils/appContext';
import { GraphNode } from '../utils/appTypes';

export const useFlow = (pubKey: string) => {
  const { graph } = useContext(AppContext);

  return graph?.links.map((link) => ({
    ...link,
    from: nodeName(link.source, graph.nodes),
    to: nodeName(link.target, graph.nodes),
  }));
};

function nodeName(linkId: number, nodes: GraphNode[]): string {
  return nodes.find((n) => n.id === linkId)?.label || 'unknown';
}
