import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Autoriser les requêtes depuis React (localhost:5173)
  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Validation automatique des DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));



  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend lancé sur http://localhost:${port}`);
}

bootstrap();