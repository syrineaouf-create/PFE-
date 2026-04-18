import {
  Controller, Get, Post, Put, Delete,
  Param, Body, ParseIntPipe, HttpCode, HttpStatus, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SessionsService } from './session.service';
import { CreateSessionDto, UpdateSessionDto } from './session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  // POST /sessions
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateSessionDto) {
    return this.service.create(dto);
  }

  // GET /sessions
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // GET /sessions/stats
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStats() {
    return this.service.getStats();
  }

  // GET /sessions/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PUT /sessions/:id
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'formateur') // Formateurs peuvent remplir l'assiduité
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.service.update(id, dto);
  }

  // DELETE /sessions/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
