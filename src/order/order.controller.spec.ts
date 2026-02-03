import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

describe('OrderController', () => {
  let controller: OrderController;
  let service: jest.Mocked<OrderService>;

  const mockOrder = {
    id: 'order-uuid-1',
    status: 'PENDENTE',
    total_order: 199.98,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    orderProducts: [
      {
        id: 'op-uuid-1',
        orderId: 'order-uuid-1',
        productId: 'product-uuid-1',
        quantity: 2,
        price_at_purchase: 99.99,
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order', async () => {
      const createDto = {
        products: [{ productId: 'product-uuid-1', quantity: 2 }],
      };

      service.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return array of orders', async () => {
      service.findAll.mockResolvedValue([mockOrder]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      service.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne('order-uuid-1');

      expect(service.findOne).toHaveBeenCalledWith('order-uuid-1');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('update', () => {
    it('should update an order status', async () => {
      const updateDto = { status: 'CONCLUIDO' as const };
      const updatedOrder = { ...mockOrder, status: 'CONCLUIDO' };

      service.update.mockResolvedValue(updatedOrder);

      const result = await controller.update('order-uuid-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('order-uuid-1', updateDto);
      expect(result.status).toBe('CONCLUIDO');
    });
  });

  describe('remove', () => {
    it('should call remove on service', async () => {
      service.remove.mockRejectedValue(
        new Error('Order deletion is not allowed'),
      );

      await expect(controller.remove('order-uuid-1')).rejects.toThrow(
        'Order deletion is not allowed',
      );
      expect(service.remove).toHaveBeenCalledWith('order-uuid-1');
    });
  });
});
