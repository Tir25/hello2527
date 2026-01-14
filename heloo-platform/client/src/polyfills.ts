/**
 * Browser polyfills for Node.js APIs
 * 
 * This file must be imported FIRST in main.tsx before any other imports
 * to ensure process and other Node.js globals are available for libraries
 * like simple-peer that depend on them.
 */

// Import the process polyfill and attach to window
import process from 'process/browser';

// Make process globally available
(window as unknown as { process: typeof process }).process = process;

// Polyfill Buffer if not already defined
if (typeof (window as unknown as { Buffer: unknown }).Buffer === 'undefined') {
    import('buffer').then(({ Buffer }) => {
        (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
    });
}

export { };
