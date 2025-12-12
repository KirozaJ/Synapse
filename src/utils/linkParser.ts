/**
 * Extracts all unique wiki-style links from the given content.
 * Matches content inside [[ ]].
 * Example: "Hello [[World]]" -> ["World"]
 */
export function extractLinks(content: string): string[] {
    const regex = /\[\[(.*?)\]\]/g;
    const matches = content.matchAll(regex);
    const links = new Set<string>();

    for (const match of matches) {
        if (match[1]) {
            links.add(match[1].trim());
        }
    }

    return Array.from(links);
}
