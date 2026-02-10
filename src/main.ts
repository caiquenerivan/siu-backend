import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    transform: true, // <--- ISSO CONVERTE "10" (string) PARA 10 (number)
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  const origin = process.env.ORIGIN_URL;

  app.enableCors({
    origin: origin,
    //origin: 'http://localhost:5173', // A porta padrão do Vite
    //origin: 'https://siu.inf.br/', // A porta padrão do Vite
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
