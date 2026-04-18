import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, Query, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FormateursService } from './formateur.service';
import { CreateFormateurDto, UpdateFormateurDto } from './formateur.dto';

@Controller('formateurs')
export class FormateursController {
  constructor(private readonly service: FormateursService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateFormateurDto) {
    return this.service.create(dto);
  }

  @Post('login')
  login(@Body() body: { email: string; mot_de_passe: string }) {
    return this.service.login(body.email, body.mot_de_passe);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search = '',
  ) {
    return this.service.findAll(+page, +limit, search);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormateurDto,
  ) {
    return this.service.update(id, dto);
  }

  // Formateur change son propre mot de passe
  @Patch(':id/change-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('formateur')
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { ancien_mdp: string; nouveau_mdp: string },
  ) {
    return this.service.changePassword(id, body.ancien_mdp, body.nouveau_mdp);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
  
  // POST /formateurs/forgot-password
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.service.forgotPassword(body.email);
  }

  // POST /formateurs/reset-password
  @Post('reset-password')
  resetPassword(@Body() body: { token: string; nouveau_mdp: string }) {
    return this.service.resetPassword(body.token, body.nouveau_mdp);
  }
}