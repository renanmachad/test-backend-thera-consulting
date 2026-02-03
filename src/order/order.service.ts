import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  serializeOrder,
  serializeOrderProduct,
  toNumber,
} from '../common/helpers/decimal.helper';
import { OrderStatus, Prisma, Product } from '../generated/prisma/client';
import { ProductRepository } from '../product/repositories/product.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderRepository } from './repositories/order.repository';

// Tipo para Order com orderProducts incluídos
interface OrderWithProducts {
  id: string;
  status: OrderStatus;
  total_order: unknown;
  createdAt: Date;
  updatedAt: Date;
  orderProducts: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price_at_purchase: unknown;
    product?: Product;
  }>;
}

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
        price_at_purchase: toNumber(product.price),
      });
    }

    // Criar pedido
    const orderData: Prisma.OrderCreateInput = {
      status: OrderStatus.PENDENTE,
      orderProducts: {
        create: orderProductsData,
      },
    };

    const order = (await this.orderRepository.create(
      orderData,
    )) as OrderWithProducts;

    // Calcular e atualizar total
    const total = await this.orderRepository.calculateTotal(order.id);
    await this.orderRepository.updateStatus(order.id, order.status);

    return this.serializeOrderResponse(order, total);
  }

  async findAll() {
    const orders =
      (await this.orderRepository.findAll()) as OrderWithProducts[];
    // Calcular total para cada pedido e serializar
    return Promise.all(
      orders.map(async (order) => {
        const total = await this.orderRepository.calculateTotal(order.id);
        return this.serializeOrderResponse(order, total);
      }),
    );
  }

  async findOne(id: string) {
    const order = (await this.orderRepository.findOne(
      id,
    )) as OrderWithProducts | null;
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const total = await this.orderRepository.calculateTotal(id);
    return this.serializeOrderResponse(order, total);
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
      await this.orderRepository.updateStatus(id, updateOrderDto.status);
      // Buscar o pedido atualizado com produtos
      const updatedOrder = (await this.orderRepository.findOne(
        id,
      )) as OrderWithProducts;
      const total = await this.orderRepository.calculateTotal(id);
      return this.serializeOrderResponse(updatedOrder, total);
    }

    return order;
  }

  async remove(id: string) {
    await this.findOne(id);
    throw new BadRequestException(
      'Order deletion is not allowed. Use cancel status instead.',
    );
  }

  /**
   * Serializa a resposta do pedido convertendo Decimals para numbers
   */
  private serializeOrderResponse(order: OrderWithProducts, total: number) {
    return serializeOrder({
      id: order.id,
      status: order.status,
      total_order: total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderProducts: order.orderProducts.map((op) => serializeOrderProduct(op)),
    });
  }
}
