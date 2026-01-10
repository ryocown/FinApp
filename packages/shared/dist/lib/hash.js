/**
 * Creates a deterministic hash from the given content.
 * Replaces 'uuid' v5 dependency to ensure browser compatibility (no Buffer requirement).
 */
export function createDeterministicHash(content) {
    let hash = 0;
    if (content.length === 0)
        return '0';
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return (hash >>> 0).toString(16);
}
