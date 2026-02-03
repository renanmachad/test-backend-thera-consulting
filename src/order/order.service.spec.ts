import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductRepository } from '../product/repositories/product.repository';
import { OrderService } from './order.service';
import { OrderRepository } from './repositories/order.repository';

// Mock Decimal class
class MockDecimal {
  private value: number;
  constructor(value: number | string) {
    this.value = typeof value === 'string' ? parseFloat(value) : value;
  }
  toNumber() {
    return this.value;
  }
  toString() {
    return this.value.toString();
  }
}

// Mock OrderStatus enum
const OrderStatus = {
  PENDENTE: 'PENDENTE',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
} as const;

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let productRepository: jest.Mocked<ProductRepository>;

  // Mock data
  const mockProduct = {
    id: 'product-uuid-1',
    name: 'Test Product',
    category: 'Electronics',
    description: 'A test product',
    price: new MockDecimal(99.99),
    quantity_stock: 50,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockProduct2 = {
    ...mockProduct,
    id: 'product-uuid-2',
    name: 'Test Product 2',
    quantity_stock: 10,
  };

  const mockOrderProduct = {
    id: 'order-product-uuid-1',
    orderId: 'order-uuid-1',
    productId: 'product-uuid-1',
    quantity: 2,
    price_at_purchase: new MockDecimal(99.99),
    product: mockProduct,
  };

  const mockOrder = {
    id: 'order-uuid-1',
    status: OrderStatus.PENDENTE,
    total_order: new MockDecimal(199.98),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    orderProducts: [mockOrderProduct],
  };

  const createOrderDto = {
    products: [
      { productId: 'product-uuid-1', quantity: 2 },
    ],
  };

  beforeEach(async () => {
    const mockOrderRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateStatus: jest.fn(),
      calculateTotal: jest.fn(),
      findWithProducts: jest.fn(),
    };

    const mockProductRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findManyByIds: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: mockOrderRepo,
        },
        {
          provide: ProductRepository,
          useValue: mockProductRepo,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(OrderRepository);
    productRepository = module.get(ProductRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      productRepository.findManyByIds.mockResolvedValue([mockProduct]);
      orderRepository.create.mockResolvedValue(mockOrder);
      orderRepository.calculateTotal.mockResolvedValue(199.98);
      orderRepository.updateStatus.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(productRepository.findManyByIds).toHaveBeenCalledWith([
        'product-uuid-1',
      ]);
      expect(orderRepository.create).toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.PENDENTE);
      expect(result.total_order).toBe(199.98);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findManyByIds.mockResolvedValue([]);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Product with ID product-uuid-1 not found',
      );
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const lowStockProduct = { ...mockProduct, quantity_stock: 1 };
      productRepository.findManyByIds.mockResolvedValue([lowStockProduct]);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createOrderDto)).rejects.toThrow(
        /Insufficient stock/,
      );
    });

    it('should create order with multiple products', async () => {
      const multiProductDto = {
        products: [
          { productId: 'product-uuid-1', quantity: 2 },
          { productId: 'product-uuid-2', quantity: 3 },
        ],
      };

      productRepository.findManyByIds.mockResolvedValue([
        mockProduct,
        mockProduct2,
      ]);
      orderRepository.create.mockResolvedValue({
        ...mockOrder,
        orderProducts: [
          mockOrderProduct,
          { ...mockOrderProduct, id: 'op-2', productId: 'product-uuid-2' },
        ],
      });
      orderRepository.calculateTotal.mockResolvedValue(499.95);
      orderRepository.updateStatus.mockResolvedValue(mockOrder);

      const result = await service.create(multiProductDto);

      expect(productRepository.findManyByIds).toHaveBeenCalledWith([
        'product-uuid-1',
        'product-uuid-2',
      ]);
      expect(result.total_order).toBe(499.95);
    });
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders = [
        mockOrder,
        { ...mockOrder, id: 'order-uuid-2' },
      ];
      orderRepository.findAll.mockResolvedValue(mockOrders);
      orderRepository.calculateTotal.mockResolvedValue(199.98);

      const result = await service.findAll();

      expect(orderRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no orders exist', async () => {
      orderRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should serialize Decimal values to numbers', async () => {
      orderRepository.findAll.mockResolvedValue([mockOrder]);
      orderRepository.calculateTotal.mockResolvedValue(199.98);

      const result = await service.findAll();

      expect(typeof result[0].total_order).toBe('number');
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.calculateTotal.mockResolvedValue(199.98);

      const result = await service.findOne('order-uuid-1');

      expect(orderRepository.findOne).toHaveBeenCalledWith('order-uuid-1');
      expect(result.id).toBe('order-uuid-1');
      expect(result.total_order).toBe(199.98);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Order with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    describe('status transitions', () => {
      it('should update status from PENDENTE to CONCLUIDO and deduct stock', async () => {
        const pendingOrder = { ...mockOrder, status: OrderStatus.PENDENTE };
        const completedOrder = { ...mockOrder, status: OrderStatus.CONCLUIDO };

        orderRepository.findOne.mockResolvedValue(pendingOrder);
        orderRepository.calculateTotal.mockResolvedValue(199.98);
        orderRepository.findWithProducts.mockResolvedValue(pendingOrder);
        orderRepository.updateStatus.mockResolvedValue(completedOrder);
        productRepository.updateStock.mockResolvedValue(mockProduct);

        await service.update('order-uuid-1', {
          status: OrderStatus.CONCLUIDO,
        });

        expect(productRepository.updateStock).toHaveBeenCalledWith(
          'product-uuid-1',
          48, // 50 - 2
        );
        expect(orderRepository.updateStatus).toHaveBeenCalledWith(
          'order-uuid-1',
          OrderStatus.CONCLUIDO,
        );
      });

      it('should update status from CONCLUIDO to CANCELADO and restore stock', async () => {
        const completedOrder = { ...mockOrder, status: OrderStatus.CONCLUIDO };
        const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELADO };

        orderRepository.findOne
          .mockResolvedValueOnce(completedOrder)
          .mockResolvedValueOnce(cancelledOrder);
        orderRepository.calculateTotal.mockResolvedValue(199.98);
        orderRepository.findWithProducts.mockResolvedValue(completedOrder);
        orderRepository.updateStatus.mockResolvedValue(cancelledOrder);
        productRepository.updateStock.mockResolvedValue(mockProduct);

        await service.update('order-uuid-1', {
          status: OrderStatus.CANCELADO,
        });

        expect(productRepository.updateStock).toHaveBeenCalledWith(
          'product-uuid-1',
          52, // 50 + 2
        );
      });

      it('should update status from PENDENTE to CANCELADO without stock change', async () => {
        const pendingOrder = { ...mockOrder, status: OrderStatus.PENDENTE };
        const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELADO };

        orderRepository.findOne
          .mockResolvedValueOnce(pendingOrder)
          .mockResolvedValueOnce(cancelledOrder);
        orderRepository.calculateTotal.mockResolvedValue(199.98);
        orderRepository.updateStatus.mockResolvedValue(cancelledOrder);

        await service.update('order-uuid-1', {
          status: OrderStatus.CANCELADO,
        });

        expect(productRepository.updateStock).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when completing order with insufficient stock', async () => {
        const pendingOrder = { ...mockOrder, status: OrderStatus.PENDENTE };
        const orderWithLowStock = {
          ...pendingOrder,
          orderProducts: [
            {
              ...mockOrderProduct,
              product: { ...mockProduct, quantity_stock: 1 },
            },
          ],
        };

        orderRepository.findOne.mockResolvedValue(pendingOrder);
        orderRepository.calculateTotal.mockResolvedValue(199.98);
        orderRepository.findWithProducts.mockResolvedValue(orderWithLowStock);

        await expect(
          service.update('order-uuid-1', { status: OrderStatus.CONCLUIDO }),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.update('order-uuid-1', { status: OrderStatus.CONCLUIDO }),
        ).rejects.toThrow(/Cannot complete order: insufficient stock/);
      });
    });

    it('should throw NotFoundException when updating non-existent order', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { status: OrderStatus.CONCLUIDO }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return order without changes when no status provided', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.calculateTotal.mockResolvedValue(199.98);

      const result = await service.update('order-uuid-1', {});

      expect(orderRepository.updateStatus).not.toHaveBeenCalled();
      expect(result.id).toBe('order-uuid-1');
    });
  });

  describe('remove', () => {
    it('should throw BadRequestException - deletion not allowed', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.calculateTotal.mockResolvedValue(199.98);

      await expect(service.remove('order-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('order-uuid-1')).rejects.toThrow(
        'Order deletion is not allowed. Use cancel status instead.',
      );
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
