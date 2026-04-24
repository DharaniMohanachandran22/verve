export enum NotificationType {
    MENTION = 'MENTION',
    ASSIGNED = 'ASSIGNED',
    CARD_MOVED = 'CARD_MOVED',
    DUE_DATE_REMINDER = 'DUE_DATE_REMINDER',
    BOARD_INVITATION = 'BOARD_INVITATION',
    CARD_UPDATED = 'CARD_UPDATED',
}

export interface NotificationDetail {
    id: string;
    userId: string;
    type: NotificationType;
    actorId: any;
    entityType: string;
    entityId: string;
    read: boolean;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}
