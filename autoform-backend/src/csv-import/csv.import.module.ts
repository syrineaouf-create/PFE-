import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apprenant } from '../apprenants/apprenant.entity';
import { CsvImportService } from './csv-import.service';
import { CsvImportController } from './csv.import.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Apprenant])],
  controllers: [CsvImportController],
  providers: [CsvImportService],
})
export class CsvImportModule {}