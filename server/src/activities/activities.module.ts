import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { BoardsModule } from '../boards/boards.module';
import { AuthModule } from '../auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLoggerInterceptor } from './interceptors/activity-logger.interceptor';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]),
        BoardsModule,
        AuthModule,
    ],
    controllers: [ActivitiesController],
    providers: [
        ActivitiesService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ActivityLoggerInterceptor,
        },
    ],
    exports: [ActivitiesService],
})
export class ActivitiesModule { }
