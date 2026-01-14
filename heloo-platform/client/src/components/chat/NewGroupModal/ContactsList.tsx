/**
 * NewGroupModal Contacts List
 * 
 * Renders the filterable contacts list with loading and empty states.
 */

import { Loader2 } from 'lucide-react'
import { ContactItem } from './ContactItem'
import type { Profile } from '@/lib/services/profile.service'

interface ContactsListProps {
    contacts: Profile[]
    filteredContacts: Profile[]
    isLoading: boolean
    selectedMemberIds: Set<string>
    onToggleMember: (member: Profile) => void
}

export const ContactsList = ({
    contacts,
    filteredContacts,
    isLoading,
    selectedMemberIds,
    onToggleMember
}: ContactsListProps) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
        )
    }

    if (filteredContacts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                {contacts.length === 0
                    ? 'No contacts yet. Add friends to create a group!'
                    : 'No contacts match your search'}
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {filteredContacts.map(contact => (
                <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedMemberIds.has(contact.id)}
                    onToggle={onToggleMember}
                />
            ))}
        </div>
    )
}
