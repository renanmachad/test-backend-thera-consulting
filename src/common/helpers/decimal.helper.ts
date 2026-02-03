/**
 * Converte um valor Decimal do Prisma para number
 * Funciona com Decimal, string ou number
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  // Prisma Decimal tem método toNumber()
  if (typeof value === 'object' && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/**
 * Serializa um produto convertendo Decimal price para number
 */
export function serializeProduct<T extends { price: unknown }>(
  product: T,
): Omit<T, 'price'> & { price: number } {
  return {
    ...product,
    price: toNumber(product.price),
  };
}

/**
 * Serializa um item de pedido convertendo Decimal para number
 */
export function serializeOrderProduct<T extends { price_at_purchase: unknown }>(
  orderProduct: T,
): Omit<T, 'price_at_purchase'> & { price_at_purchase: number } {
  return {
    ...orderProduct,
    price_at_purchase: toNumber(orderProduct.price_at_purchase),
  };
}

/**
 * Serializa um pedido convertendo total_order para number
 */
export function serializeOrder<T extends { total_order: unknown }>(
  order: T,
): Omit<T, 'total_order'> & { total_order: number } {
  return {
    ...order,
    total_order: toNumber(order.total_order),
  };
}
