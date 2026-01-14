/**
 * Message Handler Exports
 * 
 * Barrel file for all message event handlers.
 * Single import point for useGlobalMessageListener.
 */

export { createNewMessageHandler } from './handleNewMessage'
export { createMessageUpdateHandler } from './handleMessageUpdate'
export { createGroupMessageHandler } from './handleGroupMessage'
