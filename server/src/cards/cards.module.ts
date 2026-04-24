import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { Card, CardSchema } from './schemas/card.schema';
import { BoardsModule } from '../boards/boards.module';
import { ListsModule } from '../lists/lists.module';
import { List, ListSchema } from '../lists/schemas/list.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Checklist, ChecklistSchema } from '../checklists/schemas/checklist.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { Attachment, AttachmentSchema } from '../attachments/schemas/attachment.schema';
import { Activity, ActivitySchema } from '../activities/schemas/activity.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Card.name, schema: CardSchema },
            { name: List.name, schema: ListSchema },
            { name: Checklist.name, schema: ChecklistSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: Attachment.name, schema: AttachmentSchema },
            { name: Activity.name, schema: ActivitySchema },
            { name: User.name, schema: UserSchema },
        ]),
        BoardsModule,
        ListsModule,
        AuthModule,
        NotificationsModule,
    ],
    controllers: [CardsController],
    providers: [CardsService],
    exports: [CardsService],
})
export class CardsModule { }
