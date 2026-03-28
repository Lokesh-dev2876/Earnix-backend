import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['https://earnix-frontend-nu.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT || 8000;
  await app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}
bootstrap();
