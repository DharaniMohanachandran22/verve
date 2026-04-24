import { Module, Global } from '@nestjs/common';
import { ParseObjectIdPipe } from './pipes/parse-objectid.pipe';
import { MailerModule } from './mailer/mailer.module';

@Global()
@Module({
  imports: [MailerModule],
  providers: [ParseObjectIdPipe],
  exports: [ParseObjectIdPipe, MailerModule],
})
export class CommonModule { }
