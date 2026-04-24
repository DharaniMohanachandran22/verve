import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivitiesService } from '../activities.service';
import {
    ACTIVITY_METADATA_KEY,
    ActivityMetadata,
} from '../decorators/activity.decorator';

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly activitiesService: ActivitiesService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const metadata = this.reflector.get<ActivityMetadata>(
            ACTIVITY_METADATA_KEY,
            context.getHandler(),
        );

        if (!metadata) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) return next.handle();

        return next.handle().pipe(
            tap(async (data) => {
                const { boardId, cardId, listId, cardId: paramCardId } = request.params;
                const entityId = data?._id || data?.id || request.params.id;

                // Try to obtain boardId from data if it's not in params
                const finalBoardId = boardId || data?.boardId;
                const finalCardId = cardId || paramCardId || data?.cardId;

                if (finalBoardId && entityId) {
                    await this.activitiesService.logActivity(
                        finalBoardId.toString(),
                        user.userId,
                        metadata.actionType,
                        metadata.entityType,
                        entityId.toString(),
                        finalCardId?.toString(),
                        {
                            ip: request.ip,
                            userAgent: request.get('user-agent'),
                        },
                    );
                }
            }),
        );
    }
}
