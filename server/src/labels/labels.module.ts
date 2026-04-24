import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { Label, LabelSchema } from './schemas/label.schema';
import { Card, CardSchema } from '../cards/schemas/card.schema';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Label.name, schema: LabelSchema },
            { name: Card.name, schema: CardSchema },
        ]),
        BoardsModule,
        AuthModule,
    ],
    controllers: [LabelsController],
    providers: [LabelsService],
    exports: [LabelsService],
})
export class LabelsModule { }
