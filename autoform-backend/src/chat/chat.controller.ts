import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body('message') message: string,
    @Body('history') history: any[]
  ) {
    if (!message) {
      return { response: "Veuillez poser une question." };
    }
    const responseText = await this.chatService.generateResponse(message, history);
    return { response: responseText };
  }
}
