import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { MessagesService } from './message.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Post()
  create(@Body() createMessageDto: any) {
    return this.messagesService.create(createMessageDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(+id);
  }

  @Patch(':id/reply')
  reply(@Param('id') id: string, @Body('replyText') replyText: string) {
    return this.messagesService.replyToMessage(+id, replyText);
  }
}

