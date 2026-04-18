import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Apprenant } from './apprenant.entity';
import { ApprenantsService } from './apprenant.service';
import { ApprenantsController } from './apprenant.controller';
import { Session } from '../sessions/session.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Apprenant, Session]),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
  controllers: [ApprenantsController],
  providers: [ApprenantsService],
  exports: [ApprenantsService],
})
export class ApprenantsModule {}