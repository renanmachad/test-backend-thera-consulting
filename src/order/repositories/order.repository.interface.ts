import { Order, OrderStatus, Prisma } from '../../generated/prisma/client';

export interface IOrderRepository {
  create(data: Prisma.OrderCreateInput): Promise<Order>;
  findAll(): Promise<Order[]>;
  findOne(id: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  calculateTotal(id: string): Promise<number>;
  findWithProducts(id: string): Promise<Order & { orderProducts: Array<{ product: any; quantity: number; price_at_purchase: any }> } | null>;
}
