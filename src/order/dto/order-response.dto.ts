import { ApiProperty } from '@nestjs/swagger';

export class OrderProductResponseDto {
  @ApiProperty({
    description: 'ID único do item do pedido (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do pedido',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  orderId: string;

  @ApiProperty({
    description: 'ID do produto',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto no pedido',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Preço do produto no momento da compra',
    example: 49.9,
    type: Number,
  })
  price_at_purchase: number;
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'ID único do pedido (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Status atual do pedido',
    enum: ['PENDENTE', 'CONCLUIDO', 'CANCELADO'],
    example: 'PENDENTE',
  })
  status: string;

  @ApiProperty({
    description: 'Valor total do pedido',
    example: 149.7,
    type: Number,
  })
  total_order: number;

  @ApiProperty({
    description: 'Data de criação do pedido',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do pedido',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Lista de produtos do pedido',
    type: [OrderProductResponseDto],
  })
  orderProducts: OrderProductResponseDto[];
}
