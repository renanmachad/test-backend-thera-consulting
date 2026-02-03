import { Prisma, Product } from '../../generated/prisma/client';

export interface IProductRepository {
  create(data: Prisma.ProductCreateInput): Promise<Product>;
  findAll(): Promise<Product[]>;
  findOne(id: string): Promise<Product | null>;
  findManyByIds(ids: string[]): Promise<Product[]>;
  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product>;
  delete(id: string): Promise<void>;
  updateStock(id: string, quantity: number): Promise<Product>;
}
