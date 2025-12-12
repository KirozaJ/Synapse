export const extractTags = (text: string): string[] => {
    if (!text) return [];
    // Matches #tag, #tag-name, #tag_name
    // Must be preceded by start of line or whitespace
    // Must NOT be followed by word character (to avoid matching inside urls like #anchor)
    const regex = /(?:^|\s)(#[a-zA-Z0-9_\-]+)(?!\w)/g;
    const matches = text.match(regex);
    if (!matches) return [];

    // Clean up whitespace from matches
    return matches.map(m => m.trim());
};
