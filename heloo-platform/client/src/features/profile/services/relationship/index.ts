/**
 * Relationship Module Index
 * 
 * Re-exports the relationship service and types.
 * @module features/profile/services/relationship
 */

export { relationshipService } from './relationship.service'
export type {
    RelationshipResponse,
    RelationshipStatus,
    RelationshipDetails,
    IncomingRequest,
    IncomingRequestsResponse,
    ConnectionProfile,
    ConnectionsResponse,
} from './types'
