import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'ID único do produto (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta Básica',
  })
  name: string;

  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Vestuário',
  })
  category: string;

  @ApiProperty({
    description: 'Descrição detalhada do produto',
    example: 'Camiseta 100% algodão, disponível em várias cores',
  })
  description: string;

  @ApiProperty({
    description: 'Preço do produto em reais',
    example: 49.9,
    type: Number,
  })
  price: number;

  @ApiProperty({
    description: 'Quantidade disponível em estoque',
    example: 100,
  })
  quantity_stock: number;

  @ApiProperty({
    description: 'Data de criação do produto',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do produto',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
