/**
 * Relationship Service
 * 
 * Composes all relationship operations into a single service object.
 * @module features/profile/services/relationship
 */

import * as statusQueries from './statusQueries'
import * as requestOperations from './requestOperations'
import * as followOperations from './followOperations'
import * as blockOperations from './blockOperations'
import * as listOperations from './listOperations'

export const relationshipService = {
    // Status queries
    getRelationshipStatus: statusQueries.getRelationshipStatus,
    getRelationshipDetails: statusQueries.getRelationshipDetails,

    // Request operations
    sendRequest: requestOperations.sendRequest,
    acceptRequest: requestOperations.acceptRequest,
    acceptChatRequest: requestOperations.acceptChatRequest,
    declineRequest: requestOperations.declineRequest,
    cancelRequest: requestOperations.cancelRequest,

    // Follow operations
    followUser: followOperations.followUser,
    unfollow: followOperations.unfollow,

    // Block operations
    blockUser: blockOperations.blockUser,
    unblockUser: blockOperations.unblockUser,

    // List operations
    getIncomingRequests: listOperations.getIncomingRequests,
    getAcceptedConnections: listOperations.getAcceptedConnections,
}
