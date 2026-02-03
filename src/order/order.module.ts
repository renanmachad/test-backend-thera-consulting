import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderRepository } from './repositories/order.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [PrismaModule, ProductModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
})
export class OrderModule {}
