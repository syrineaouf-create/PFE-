import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { Formateur } from '../formateurs/formateur.entity';
import { Apprenant } from '../apprenants/apprenant.entity';
import { SessionsService } from './session.service';
import { SessionsController } from './session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Formateur, Apprenant])],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule { }


