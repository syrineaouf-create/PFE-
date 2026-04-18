import {
  Controller, Get, Post, Put, Delete,
  Param, Body, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FormationsService } from './formation.service';
import { Formation } from './formation.entity';

@Controller('formations')
export class FormationsController {
  constructor(private readonly service: FormationsService) { }

  // POST /formations
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: Partial<Formation>) {
    return this.service.create(dto);
  }

  // GET /formations
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // GET /formations/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PUT /formations/:id
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<Formation>,
  ) {
    return this.service.update(id, dto);
  }

  // DELETE /formations/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}