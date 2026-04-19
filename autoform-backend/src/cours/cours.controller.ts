import { Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Body, Req, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoursService } from './cours.service';
import * as fs from 'fs';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cours')
export class CoursController {
  constructor(private readonly coursService: CoursService) {}

  @Roles('admin', 'formateur', 'apprenant')
  @Get()
  async getCours(@Query('formation') formation: string) {
    return this.coursService.findByFormation(formation);
  }

  @Roles('admin', 'formateur')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/cours';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        // Remplacer les espaces pour éviter les soucis d'URL
        const extension = extname(file.originalname);
        cb(null, `${randomName}${extension}`);
      }
    })
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Req() req: any) {
    const { formation, titre } = body;
    let type = 'Fichier';
    if (!file) throw new Error("Fichier introuvable");
    
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith('.pdf')) type = 'PDF';
    else if (ext.match(/\.(mp4|avi|mov)$/)) type = 'Vidéo';
    else if (ext.match(/\.(zip|rar)$/)) type = 'Archive';
    else if (ext.match(/\.(doc|docx)$/)) type = 'Word';
    else if (ext.match(/\.(png|jpg|jpeg)$/)) type = 'Image';

    const ajoute_par = (req.user.prenom && req.user.nom) ? `${req.user.prenom} ${req.user.nom}` : (req.user.email || 'Formateur');

    return this.coursService.create({
      formation,
      titre,
      type,
      chemin_fichier: `/uploads/cours/${file.filename}`,
      ajoute_par
    });
  }

  @Roles('admin', 'formateur')
  @Post('link')
  async createLink(@Body() body: any, @Req() req: any) {
    const { formation, titre, url } = body;
    if (!url) throw new Error("URL introuvable");

    const ajoute_par = (req.user.prenom && req.user.nom) ? `${req.user.prenom} ${req.user.nom}` : (req.user.email || 'Formateur');

    return this.coursService.create({
      formation,
      titre,
      type: 'Lien Web',
      chemin_fichier: null,
      url: url,
      ajoute_par
    });
  }

  @Roles('admin', 'formateur')
  @Delete(':id')
  async deleteCours(@Param('id') id: number) {
    return this.coursService.delete(id);
  }
}
