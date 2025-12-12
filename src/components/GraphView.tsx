import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods, type NodeObject } from 'react-force-graph-2d';
import { useGraphData } from '../hooks/useGraphData';
import { db, type Note } from '../db/db';

interface GraphViewProps {
    notes: Note[];
    onNodeClick: (noteId: number) => void;
    theme: 'light' | 'dark';
}

const GraphView: React.FC<GraphViewProps> = ({ notes, onNodeClick, theme }) => {
    const { nodes: graphNodes, links: graphLinks } = useGraphData(notes);
    const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    // State to track container dimensions
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Observer to update dimensions when container resizes
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
            // Initialize with current size if available
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            });
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Zoom to fit after data loads or dimensions change
        if (graphRef.current && dimensions.width > 0 && dimensions.height > 0) {
            setTimeout(() => {
                if (graphRef.current) {
                    graphRef.current.d3Force('charge')?.strength(-100);
                    graphRef.current.zoomToFit(200);
                }
            }, 250);
        }
    }, [graphNodes.length, graphLinks.length, dimensions.width, dimensions.height]);

    const handleNodeClick = async (node: NodeObject) => {
        if (typeof node.id === 'number') {
            onNodeClick(node.id);
        } else if (typeof node.id === 'string' && (node.id as string).startsWith('ghost-')) {
            const title = node.name as string;
            if (confirm(`Create note "${title}"?`)) {
                const id = await db.notes.add({
                    title: title,
                    content: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                onNodeClick(id);
            }
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            {dimensions.width > 0 && dimensions.height > 0 && (
                <ForceGraph2D
                    ref={graphRef}
                    graphData={{ nodes: graphNodes, links: graphLinks }}
                    nodeLabel="name"
                    nodeColor={(node: any) => {
                        if (node.isGhost) return '#9ca3af';
                        if (node.group) {
                            // Simple hash to color
                            let hash = 0;
                            for (let i = 0; i < node.group.length; i++) {
                                hash = node.group.charCodeAt(i) + ((hash << 5) - hash);
                            }
                            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
                            return '#' + '00000'.substring(0, 6 - c.length) + c;
                        }
                        return '#2563eb';
                    }}
                    nodeVal={(node: any) => node.val}
                    linkColor={() => theme === 'dark' ? '#374151' : '#e5e7eb'}
                    backgroundColor={theme === 'dark' ? '#111827' : '#ffffff'}
                    onNodeClick={handleNodeClick}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            )}
        </div>
    );
};

export default GraphView;
