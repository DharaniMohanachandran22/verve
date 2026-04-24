import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { Board, BoardSchema } from './schemas/board.schema';
import { List, ListSchema } from '../lists/schemas/list.schema';
import { Card, CardSchema } from '../cards/schemas/card.schema';
import { Label, LabelSchema } from '../labels/schemas/label.schema';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: List.name, schema: ListSchema },
      { name: Card.name, schema: CardSchema },
      { name: Label.name, schema: LabelSchema },
    ]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [BoardsController],
  providers: [BoardsService, AuthGuard, PermissionGuard],
  exports: [BoardsService],
})
export class BoardsModule { }
