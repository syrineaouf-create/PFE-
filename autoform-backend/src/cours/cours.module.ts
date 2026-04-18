import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cours } from './cours.entity';
import { CoursService } from './cours.service';
import { CoursController } from './cours.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cours])],
  providers: [CoursService],
  controllers: [CoursController],
  exports: [CoursService],
})
export class CoursModule {}
