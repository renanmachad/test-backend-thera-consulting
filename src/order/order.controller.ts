import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderService } from './order.service';
import {
  ErrorResponseDto,
  NotFoundResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/error-response.dto';

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar pedido',
    description:
      'Cria um novo pedido com os produtos especificados. ' +
      'Valida disponibilidade de estoque antes de criar o pedido.',
  })
  @ApiBody({
    type: CreateOrderDto,
    description: 'Lista de produtos e quantidades do pedido',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado com sucesso',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos ou estoque insuficiente para um ou mais produtos',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Um ou mais produtos não foram encontrados',
    type: NotFoundResponseDto,
  })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos',
    description:
      'Retorna a lista de todos os pedidos com seus produtos associados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos retornada com sucesso',
    type: [OrderResponseDto],
  })
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar pedido por ID',
    description:
      'Retorna os dados de um pedido específico com seus produtos associados',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do pedido (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado',
    type: NotFoundResponseDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar status do pedido',
    description:
      'Atualiza o status de um pedido existente. ' +
      'Transições de status: PENDENTE → CONCLUIDO (deduz estoque), ' +
      'CONCLUIDO → CANCELADO (restaura estoque), ' +
      'PENDENTE → CANCELADO (sem alteração de estoque).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do pedido (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiBody({
    type: UpdateOrderDto,
    description: 'Novo status do pedido',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedido atualizado com sucesso',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Status inválido ou estoque insuficiente para concluir o pedido',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido não encontrado',
    type: NotFoundResponseDto,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover pedido (bloqueado)',
    description:
      'Operação de remoção de pedido está bloqueada. ' +
      'Para cancelar um pedido, utilize o endpoint PATCH para alterar o status para CANCELADO.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único do pedido (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description:
      'Operação bloqueada - utilize PATCH para alterar status para CANCELADO',
    type: ErrorResponseDto,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.remove(id);
  }
}
