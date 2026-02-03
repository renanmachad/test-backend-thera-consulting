import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Status do pedido',
    enum: OrderStatus,
    enumName: 'OrderStatus',
    example: 'CONCLUIDO',
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
