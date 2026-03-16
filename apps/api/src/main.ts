import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js web
      'http://localhost:8081', // Expo dev
    ],
    credentials: true,
  });

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 FitHub API running on http://localhost:${port}`);
}
bootstrap();
