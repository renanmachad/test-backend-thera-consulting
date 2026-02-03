import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ProductModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
