import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admins')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.service.login(body.email, body.mot_de_passe);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.service.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { token: string; nouveau_mdp: string }) {
    return this.service.resetPassword(body.token, body.nouveau_mdp);
  }
}
