import React from 'react';

export const getHighlight = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {
                parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase()
                        ? <mark key={i} style={{ backgroundColor: 'rgba(255, 255, 0, 0.4)', borderRadius: '2px', padding: '0 1px', color: 'inherit' }} > {part} </mark>
                        : part
                )}
        </>
    );
};

export const getSnippet = (content: string, query: string): React.ReactNode | null => {
    if (!query || !content) return null;

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) return null;

    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + query.length + 40);

    let snippetText = content.substring(start, end);
    if (start > 0) snippetText = '...' + snippetText;
    if (end < content.length) snippetText = snippetText + '...';

    return (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }
        }>
            {getHighlight(snippetText, query)}
        </span>
    );
};
