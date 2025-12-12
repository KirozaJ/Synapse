import { type Note } from '../db/db';
import { extractLinks } from '../utils/linkParser';
import { extractTags } from '../utils/tagUtils';

interface GraphNode {
    id: string | number;
    name: string;
    isGhost: boolean;
    val: number;
    group?: string;
}

interface GraphLink {
    source: string | number;
    target: string | number;
}

export function useGraphData(notes: Note[]) {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    if (!notes) return { nodes, links };

    // Map title -> note (for quick lookup)
    const titleToNoteId = new Map<string, number>();

    notes.forEach(note => {
        // Extract tags to determine group
        const tags = extractTags(note.content);
        const group = tags.length > 0 ? tags[0] : undefined;

        // We use note.id for existing notes
        nodes.push({
            id: note.id,
            name: note.title || 'Untitled',
            isGhost: false,
            val: 1,
            group
        });

        if (note.title) {
            titleToNoteId.set(note.title.trim(), note.id);
        }
    });

    const ghostNodes = new Set<string>();

    notes.forEach(sourceNote => {
        if (!sourceNote.content) return;

        const extractedLinks = extractLinks(sourceNote.content);

        extractedLinks.forEach(linkTitle => {
            const targetId = titleToNoteId.get(linkTitle);

            if (targetId !== undefined) {
                // Link to existing note
                links.push({
                    source: sourceNote.id,
                    target: targetId
                });
            } else {
                // Ghost Node
                // Only show ghost node if it originates from a note in the filtered set?
                // Yes, otherwise we show ghost nodes for notes we don't see.
                // Wait, if search filters "notes", then we only process THOSE notes.
                // So this logic holds.
                const ghostId = `ghost-${linkTitle}`;

                // Add ghost node if not already added
                if (!ghostNodes.has(linkTitle)) {
                    ghostNodes.add(linkTitle);
                    nodes.push({
                        id: ghostId,
                        name: linkTitle,
                        isGhost: true,
                        val: 0.5 // smaller size for ghost
                    });
                }

                links.push({
                    source: sourceNote.id,
                    target: ghostId
                });
            }
        });
    });

    return { nodes, links };
}
