/**
 * Creates a deterministic hash from the given content.
 * Replaces 'uuid' v5 dependency to ensure browser compatibility (no Buffer requirement).
 */
export declare function createDeterministicHash(content: string): string;
