import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { ProductRepository } from './repositories/product.repository';

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

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;

  // Mock data
  const mockProduct = {
    id: 'product-uuid-1',
    name: 'Test Product',
    category: 'Electronics',
    description: 'A test product description',
    price: new MockDecimal(99.99),
    quantity_stock: 50,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockProductSerialized = {
    ...mockProduct,
    price: 99.99,
  };

  const createProductDto = {
    name: 'Test Product',
    category: 'Electronics',
    description: 'A test product description',
    price: 99.99,
    quantity_stock: 50,
  };

  beforeEach(async () => {
    const mockRepository = {
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
        ProductService,
        {
          provide: ProductRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get(ProductRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      repository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(repository.create).toHaveBeenCalledWith({
        name: createProductDto.name,
        category: createProductDto.category,
        description: createProductDto.description,
        price: createProductDto.price,
        quantity_stock: createProductDto.quantity_stock,
      });
      expect(result).toEqual(mockProductSerialized);
    });

    it('should serialize Decimal price to number', async () => {
      repository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(typeof result.price).toBe('number');
      expect(result.price).toBe(99.99);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const mockProducts = [
        mockProduct,
        { ...mockProduct, id: 'product-uuid-2', name: 'Product 2' },
      ];
      repository.findAll.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].price).toBe(99.99);
      expect(result[1].price).toBe(99.99);
    });

    it('should return empty array when no products exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith('product-uuid-1');
      expect(result).toEqual(mockProductSerialized);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Product with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product',
      price: 149.99,
    };

    it('should update a product successfully', async () => {
      const updatedProduct = {
        ...mockProduct,
        name: 'Updated Product',
        price: new MockDecimal(149.99),
      };

      repository.findOne.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue(updatedProduct);

      const result = await service.update('product-uuid-1', updateDto);

      expect(repository.findOne).toHaveBeenCalledWith('product-uuid-1');
      expect(repository.update).toHaveBeenCalledWith('product-uuid-1', {
        name: 'Updated Product',
        price: 149.99,
      });
      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(149.99);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      const partialUpdate = { name: 'Only Name Updated' };
      repository.findOne.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue({
        ...mockProduct,
        name: 'Only Name Updated',
      });

      await service.update('product-uuid-1', partialUpdate);

      expect(repository.update).toHaveBeenCalledWith('product-uuid-1', {
        name: 'Only Name Updated',
      });
    });

    it('should handle quantity_stock update with value 0', async () => {
      const updateWithZeroStock = { quantity_stock: 0 };
      repository.findOne.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue({
        ...mockProduct,
        quantity_stock: 0,
      });

      await service.update('product-uuid-1', updateWithZeroStock);

      expect(repository.update).toHaveBeenCalledWith('product-uuid-1', {
        quantity_stock: 0,
      });
    });

    it('should handle price update with value 0', async () => {
      const updateWithZeroPrice = { price: 0 };
      repository.findOne.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue({
        ...mockProduct,
        price: new MockDecimal(0),
      });

      await service.update('product-uuid-1', updateWithZeroPrice);

      expect(repository.update).toHaveBeenCalledWith('product-uuid-1', {
        price: 0,
      });
    });
  });

  describe('remove', () => {
    it('should remove a product successfully', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      repository.delete.mockResolvedValue(undefined);

      await service.remove('product-uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith('product-uuid-1');
      expect(repository.delete).toHaveBeenCalledWith('product-uuid-1');
    });

    it('should throw NotFoundException when removing non-existent product', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
