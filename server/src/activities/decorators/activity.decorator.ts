import { SetMetadata } from '@nestjs/common';
import { ActionType, EntityType } from '../schemas/activity.schema';

export interface ActivityMetadata {
    actionType: ActionType;
    entityType: EntityType;
}

export const ACTIVITY_METADATA_KEY = 'activity_metadata';
export const LogActivity = (actionType: ActionType, entityType: EntityType) =>
    SetMetadata(ACTIVITY_METADATA_KEY, { actionType, entityType });
