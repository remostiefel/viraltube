"use client";

import { useCallback, useRef, useState } from 'react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    Panel,
    ReactFlowInstance
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CortexNode from './CortexNode';
import { initialNodes, initialEdges } from '@/lib/cortex-data';
import { Sparkles, Save } from 'lucide-react';

const nodeTypes = {
    cortexNode: CortexNode,
};

let id = 100;
const getId = () => `${id++}`;

export function MindMap() {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#22d3ee' } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            // @ts-ignore
            if (!reactFlowWrapper.current || !reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');
            const dataStr = event.dataTransfer.getData('application/json');

            if (!type || !dataStr) return;

            const payload = JSON.parse(dataStr);

            // Correct position logic
            // @ts-ignore
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type, // 'cortexNode'
                position,
                data: payload,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const addSpark = () => {
        const newNode = {
            id: getId(),
            type: 'cortexNode',
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
                type: 'spark',
                label: 'New Idea',
                description: 'Double click to edit...'
            },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <div className="w-full h-full bg-[#050505]" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                className="bg-black/80"
            >
                <Background color="#222" gap={20} />
                <Controls className="bg-white/10 border-white/20 text-white fill-white" />

                <Panel position="top-center" className="bg-black/50 backdrop-blur-md p-2 rounded-xl flex gap-4 border border-white/10">
                    <button
                        onClick={addSpark}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                    >
                        <Sparkles className="w-4 h-4" /> Add Spark
                    </button>
                    <button
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                    >
                        <Save className="w-4 h-4" /> Save Graph
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default function MindMapWrapper() {
    return (
        <ReactFlowProvider>
            <MindMap />
        </ReactFlowProvider>
    );
}
