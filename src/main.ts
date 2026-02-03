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
    .setTitle('E-commerce API')
    .setDescription(
      'API REST para gerenciamento de produtos e pedidos de e-commerce. ' +
        'Permite operações CRUD em produtos, criação e gerenciamento de pedidos com controle de estoque.',
    )
    .setVersion('1.0')
    .addTag('Health', 'Verificação de saúde da API')
    .addTag('Products', 'Gerenciamento de produtos')
    .addTag('Orders', 'Gerenciamento de pedidos')
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
