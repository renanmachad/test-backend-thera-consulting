import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
  Product,
} from '../generated/prisma/client';
import { ProductRepository } from '../product/repositories/product.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from './repositories/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // Buscar todos os produtos de uma vez (evita N+1)
    const productIds = createOrderDto.products.map((item) => item.productId);

    const products: Product[] =
      await this.productRepository.findManyByIds(productIds);

    // Criar um mapa para acesso rápido por ID
    const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    // Validar estoque e preparar dados
    const orderProductsData: Prisma.OrderProductCreateWithoutOrderInput[] = [];

    for (const item of createOrderDto.products) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      if (product.quantity_stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.quantity_stock}, Requested: ${item.quantity}`,
        );
      }

      orderProductsData.push({
        product: {
          connect: { id: item.productId },
        },
        quantity: item.quantity,
        price_at_purchase: Number(product.price),
      });
    }

    // Criar pedido
    const orderData: Prisma.OrderCreateInput = {
      status: OrderStatus.PENDENTE,
      orderProducts: {
        create: orderProductsData,
      },
    };

    const order = await this.orderRepository.create(orderData);

    // Calcular e atualizar total
    const total = await this.orderRepository.calculateTotal(order.id);
    await this.orderRepository.updateStatus(order.id, order.status);

    return {
      ...order,
      total_order: total,
    };
  }

  async findAll() {
    const orders = await this.orderRepository.findAll();
    // Calcular total para cada pedido
    return Promise.all(
      orders.map(async (order) => {
        const total = await this.orderRepository.calculateTotal(order.id);
        return {
          ...order,
          total_order: total,
        };
      }),
    );
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const total = await this.orderRepository.calculateTotal(id);
    return {
      ...order,
      total_order: total,
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    // Se estiver atualizando o status para CONCLUIDO, atualizar estoque
    if (
      updateOrderDto.status === OrderStatus.CONCLUIDO &&
      order.status !== OrderStatus.CONCLUIDO
    ) {
      const orderWithProducts = await this.orderRepository.findWithProducts(id);

      if (orderWithProducts) {
        // Os produtos já vêm no relacionamento, não precisa buscar novamente
        for (const orderProduct of orderWithProducts.orderProducts) {
          const product = orderProduct.product as Product;
          if (product) {
            const newStock =
              Number(product.quantity_stock) - orderProduct.quantity;
            if (newStock < 0) {
              throw new BadRequestException(
                `Cannot complete order: insufficient stock for product ${product.name}`,
              );
            }
            await this.productRepository.updateStock(product.id, newStock);
          }
        }
      }
    }

    // Se estiver cancelando um pedido concluído, devolver estoque
    if (
      updateOrderDto.status === OrderStatus.CANCELADO &&
      order.status === OrderStatus.CONCLUIDO
    ) {
      const orderWithProducts = await this.orderRepository.findWithProducts(id);

      if (orderWithProducts) {
        // Os produtos já vêm no relacionamento, não precisa buscar novamente
        for (const orderProduct of orderWithProducts.orderProducts) {
          const product = orderProduct.product as Product;
          if (product) {
            const newStock =
              Number(product.quantity_stock) + orderProduct.quantity;
            await this.productRepository.updateStock(product.id, newStock);
          }
        }
      }
    }

    if (updateOrderDto.status) {
      return this.orderRepository.updateStatus(id, updateOrderDto.status);
    }

    return order;
  }

  async remove(id: string) {
    await this.findOne(id);
    // Em produção, você pode querer soft delete ou verificar se pode deletar
    throw new BadRequestException(
      'Order deletion is not allowed. Use cancel status instead.',
    );
  }
}
