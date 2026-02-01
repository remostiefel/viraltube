export type CortexNodeType = 'video' | 'wisdom' | 'spark';

export interface CortexNodeData {
    label: string;
    type: CortexNodeType;
    // content
    videoId?: string;
    wisdomId?: string;
    description?: string;
    tags?: string[];
    // visual
    thumbnail?: string;
    color?: string;
}

// Initial state for testing
export const initialNodes = [
    {
        id: '1',
        type: 'cortexNode',
        position: { x: 250, y: 5 },
        data: { label: 'Welcome to your Cortex', type: 'spark', description: 'Double click to edit me!' }
    }
];

export const initialEdges = [];
