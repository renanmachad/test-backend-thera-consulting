import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let service: jest.Mocked<ProductService>;

  const mockProduct = {
    id: 'product-uuid-1',
    name: 'Test Product',
    category: 'Electronics',
    description: 'A test product',
    price: 99.99,
    quantity_stock: 50,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
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
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get(ProductService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto = {
        name: 'Test Product',
        category: 'Electronics',
        description: 'A test product',
        price: 99.99,
        quantity_stock: 50,
      };

      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return array of products', async () => {
      service.findAll.mockResolvedValue([mockProduct]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      service.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('product-uuid-1');

      expect(service.findOne).toHaveBeenCalledWith('product-uuid-1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };

      service.update.mockResolvedValue(updatedProduct);

      const result = await controller.update('product-uuid-1', updateDto);

      expect(service.update).toHaveBeenCalledWith('product-uuid-1', updateDto);
      expect(result.name).toBe('Updated Product');
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('product-uuid-1');

      expect(service.remove).toHaveBeenCalledWith('product-uuid-1');
    });
  });
});
