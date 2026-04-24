import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { Checklist, ChecklistSchema } from './schemas/checklist.schema';
import { Card, CardSchema } from '../cards/schemas/card.schema';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Checklist.name, schema: ChecklistSchema },
            { name: Card.name, schema: CardSchema },
        ]),
        BoardsModule,
        AuthModule,
        NotificationsModule,
    ],
    controllers: [ChecklistsController],
    providers: [ChecklistsService],
    exports: [ChecklistsService],
})
export class ChecklistsModule { }
