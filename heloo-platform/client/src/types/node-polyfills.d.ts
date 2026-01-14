// Type declarations for Node.js polyfill modules in browser

declare module 'process/browser' {
    const process: {
        env: Record<string, string | undefined>;
        nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
        version: string;
        versions: Record<string, string>;
        platform: string;
        browser: boolean;
        [key: string]: unknown;
    };
    export default process;
}

declare module 'buffer' {
    export const Buffer: typeof globalThis.Buffer;
}
