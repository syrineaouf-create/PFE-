import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formateur } from './formateur.entity';
import { FormateursService } from './formateur.service';
import { FormateursController } from './formateur.controller';
import { Formation } from '../formations/formation.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Formateur, Formation]), EmailModule],
  controllers: [FormateursController],
  providers: [FormateursService],
  exports: [FormateursService],
})
export class FormateursModule {}