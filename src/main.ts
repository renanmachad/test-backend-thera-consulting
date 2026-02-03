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
        'Permite operações CRUD em produtos, criação e gerenciamento de pedidos com controle de estoque.\n\n' +
        '**Autenticação:** Use o header `Authorization: Bearer <API_KEY>` ou `X-API-Key: <API_KEY>`',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'API Key',
        description: 'Insira a API Key',
        in: 'header',
      },
      'api-key',
    )
    .addTag('Health', 'Verificação de saúde da API (pública)')
    .addTag('Products', 'Gerenciamento de produtos (requer autenticação)')
    .addTag('Orders', 'Gerenciamento de pedidos (requer autenticação)')
    .build();

  const documentConfig: SwaggerDocumentOptions = {
    autoTagControllers: true,
  };

  const documentFactory = SwaggerModule.createDocument(
    app,
    swaggerConfig,
    documentConfig,
  );

  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
