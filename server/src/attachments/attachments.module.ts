import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';
import { Card, CardSchema } from '../cards/schemas/card.schema';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Attachment.name, schema: AttachmentSchema },
            { name: Card.name, schema: CardSchema },
        ]),
        BoardsModule,
        AuthModule,
        NotificationsModule,
    ],
    controllers: [AttachmentsController],
    providers: [AttachmentsService],
    exports: [AttachmentsService],
})
export class AttachmentsModule { }
