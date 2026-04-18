import { Controller, Post, Body } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';

@Controller('csv-import')
export class CsvImportController {
  constructor(private readonly service: CsvImportService) {}

  // POST /csv-import/apprenants
  // Body: { "filePath": "C:/chemin/vers/dataset_formations_final_v4.csv" }
  @Post('apprenants')
  importApprenants(@Body('filePath') filePath: string) {
    return this.service.importApprenants(filePath);
  }
}