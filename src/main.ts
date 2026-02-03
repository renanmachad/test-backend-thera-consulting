import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('')
    .setDescription('')
    .setVersion('1.0')
    .addTag('Ecommerce')
    .build();

  const documentConfig: SwaggerDocumentOptions = {
    autoTagControllers: true,
  };

  const documentFactory = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    documentConfig,
  );

  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
