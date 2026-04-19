import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, ParseIntPipe,
  UseInterceptors, UploadedFile, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApprenantsService } from './apprenant.service';
import { CreateApprenantDto, UpdateApprenantDto } from './apprenant.dto';

@Controller('apprenants')
export class ApprenantsController {
  constructor(private readonly service: ApprenantsService) {}

  // POST /apprenants
  @Post()
  create(@Body() dto: CreateApprenantDto) {
    return this.service.create(dto);
  }

  // POST /apprenants/login
  @Post('login')
  login(@Body() body: { email: string; mot_de_passe: string }) {
    return this.service.login(body.email, body.mot_de_passe);
  }

  // GET /apprenants?page=1&limit=20&search=nom
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'formateur')
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '1000',
    @Query('search') search = '',
  ) {
    return this.service.findAll(+page, +limit, search);
  }

  // GET /apprenants/stats
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStats() {
    return this.service.getStats();
  }

  // GET /apprenants/pending — Comptes en attente d'activation
  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findPending() {
    return this.service.findPending();
  }

  // GET /apprenants/:id
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PUT /apprenants/:id
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApprenantDto,
  ) {
    return this.service.update(id, dto);
  }

  // PATCH /apprenants/:id/activate  — Admin active le compte
  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.activate(id);
  }

  // PATCH /apprenants/:id/deactivate  — Admin désactive manuellement
  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }

  // DELETE /apprenants/:id
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
  // POST /apprenants/forgot-password
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.service.forgotPassword(body.email);
  }

  // POST /apprenants/reset-password
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; nouveau_mdp: string }) {
    return this.service.resetPassword(body.token, body.nouveau_mdp);
  }

  // PATCH /apprenants/:id/confirm-session
  @Patch(':id/confirm-session')
  @UseGuards(JwtAuthGuard)
  confirmSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: { session_id: number; formation: string; reservations_futures: any[] }
  ) {
    return this.service.confirmSession(id, payload);
  }
}