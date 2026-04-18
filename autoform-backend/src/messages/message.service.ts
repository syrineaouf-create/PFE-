import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async findAll(): Promise<Message[]> {
    // Trier par récents d'abord
    return this.messageRepository.find({
      order: {
        date_envoi: 'DESC',
      },
    });
  }

  async create(createMessageDto: any): Promise<Message> {
    const newMessage = this.messageRepository.create(createMessageDto as object);
    return this.messageRepository.save(newMessage as any);
  }

  async markAsRead(id: number): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    message.lu = true;
    return this.messageRepository.save(message);
  }

  async replyToMessage(id: number, replyText: string): Promise<{ success: boolean }> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"Waialys Formation" <${process.env.MAIL_USER}>`,
        to: message.email,
        subject: `Réponse à votre demande — Waialys Formation`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #f4f6fb; padding: 32px;">
            <div style="background: #0f1c3f; padding: 24px 32px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Waialys Formation</h1>
              <p style="color: #c8a96e; margin: 4px 0 0; font-size: 13px;">Réponse à votre message</p>
            </div>
            <div style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e4e8f0;">
              <p style="font-size: 15px; color: #1a2340;">Bonjour <strong>${message.nom}</strong>,</p>
              <p style="font-size: 14px; color: #8892a4;">Merci de nous avoir contactés. Voici notre réponse :</p>
              <div style="background: #f4f6fb; border-left: 4px solid #c8a96e; padding: 16px 20px; border-radius: 8px; margin: 20px 0; font-size: 15px; color: #1a2340; line-height: 1.6;">
                ${replyText.replace(/\n/g, '<br/>')}
              </div>
              <hr style="border: none; border-top: 1px solid #e4e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #8892a4;">Votre message original :</p>
              <p style="font-size: 13px; color: #b0b8c8; font-style: italic;">« ${message.message} »</p>
              <hr style="border: none; border-top: 1px solid #e4e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #8892a4; margin: 0;">L'équipe Waialys Formation</p>
            </div>
          </div>
        `,
      });

      // Marquer comme lu automatiquement
      message.lu = true;
      await this.messageRepository.save(message);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur envoi email reply:', error);
      throw new BadRequestException('Impossible d\'envoyer l\'email : ' + (error.message || error));
    }
  }
}

