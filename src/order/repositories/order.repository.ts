import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IOrderRepository } from './order.repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return this.prisma.order.create({
      data,
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async calculateTotal(id: string): Promise<number> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderProducts: true,
      },
    });

    if (!order) {
      return 0;
    }

    const total = order.orderProducts.reduce(
      (
        sum: number,
        orderProduct: { price_at_purchase: unknown; quantity: number },
      ) => {
        return (
          sum + Number(orderProduct.price_at_purchase) * orderProduct.quantity
        );
      },
      0,
    );

    return total;
  }

  async findWithProducts(id: string): Promise<
    | (Order & {
        orderProducts: Array<{
          product: any;
          quantity: number;
          price_at_purchase: any;
        }>;
      })
    | null
  > {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
