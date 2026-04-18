import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formation } from './formation.entity';
import { Formateur } from '../formateurs/formateur.entity';
import { FormationsService } from './formation.service';
import { FormationsController } from './formation.controller';

import { Apprenant } from '../apprenants/apprenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Formation, Apprenant, Formateur])],
  controllers: [FormationsController],
  providers: [FormationsService],
  exports: [FormationsService],
})
export class FormationsModule {}
