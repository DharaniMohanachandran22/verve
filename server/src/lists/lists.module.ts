import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListsController } from './lists.controller';
import { ListsService } from './lists.service';
import { List, ListSchema } from './schemas/list.schema';
import { Card, CardSchema } from '../cards/schemas/card.schema';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: List.name, schema: ListSchema },
            { name: Card.name, schema: CardSchema }
        ]),
        BoardsModule,
        AuthModule,
    ],
    controllers: [ListsController],
    providers: [ListsService],
    exports: [ListsService],
})
export class ListsModule { }
