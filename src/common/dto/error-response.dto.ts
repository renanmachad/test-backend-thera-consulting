import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro ou lista de erros de validação',
    example: 'Bad Request',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Bad Request',
  })
  error: string;
}

export class NotFoundResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Recurso não encontrado',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Not Found',
  })
  error: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Lista de erros de validação',
    example: ['name must be a string', 'price must be a positive number'],
    type: [String],
  })
  message: string[];

  @ApiProperty({
    description: 'Tipo do erro HTTP',
    example: 'Bad Request',
  })
  error: string;
}
