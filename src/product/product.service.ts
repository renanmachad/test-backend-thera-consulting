import { Injectable, NotFoundException } from '@nestjs/common';
import { serializeProduct } from '../common/helpers/decimal.helper';
import { Prisma } from '../generated/prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './repositories/product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(createProductDto: CreateProductDto) {
    const data: Prisma.ProductCreateInput = {
      name: createProductDto.name,
      category: createProductDto.category,
      description: createProductDto.description,
      price: createProductDto.price,
      quantity_stock: createProductDto.quantity_stock,
    };

    const product = await this.productRepository.create(data);
    return serializeProduct(product);
  }

  async findAll() {
    const products = await this.productRepository.findAll();
    return products.map((product) => serializeProduct(product));
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return serializeProduct(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Verifica se existe

    const data: Prisma.ProductUpdateInput = {
      ...(updateProductDto.name && { name: updateProductDto.name }),
      ...(updateProductDto.category && { category: updateProductDto.category }),
      ...(updateProductDto.description && {
        description: updateProductDto.description,
      }),
      ...(updateProductDto.price !== undefined && {
        price: updateProductDto.price,
      }),
      ...(updateProductDto.quantity_stock !== undefined && {
        quantity_stock: updateProductDto.quantity_stock,
      }),
    };

    const product = await this.productRepository.update(id, data);
    return serializeProduct(product);
  }

  async remove(id: string) {
    await this.findOne(id); // Verifica se existe
    await this.productRepository.delete(id);
  }
}
