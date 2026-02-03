import { Product } from 'src/product/entities/product.entity';
import { StatusEnum } from './status.enum';

export class Order {
  private readonly id: string;
  private readonly products: Array<Product>;
  private readonly total_order: number;
  private readonly status: StatusEnum;
}
