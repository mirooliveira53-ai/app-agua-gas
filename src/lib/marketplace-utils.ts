import { CartItem, PLATFORM_FEE_RULES } from './types'

/**
 * Calcula a taxa de plataforma baseada nas regras de negócio
 * 
 * Regras:
 * - Água 500ml: isento até 9 unidades, R$ 1,00 a partir de 10 unidades
 * - Garrafão 20L: R$ 1,00 por pedido que contenha pelo menos 1 unidade
 * - Botijão 13kg: R$ 5,00 por pedido que contenha pelo menos 1 unidade
 * - Botijão 45kg: R$ 10,00 por pedido que contenha pelo menos 1 unidade
 * 
 * @param items Itens do carrinho
 * @returns Taxa total de plataforma
 */
export function calculatePlatformFee(items: CartItem[]): number {
  let taxa = 0
  
  // Contar quantidades por tipo de produto
  const quantities = {
    '500ml': items.filter(item => item.product.kind === '500ml').reduce((sum, item) => sum + item.quantity, 0),
    'galao20L': items.filter(item => item.product.kind === 'galao20L').reduce((sum, item) => sum + item.quantity, 0),
    'gas13kg': items.filter(item => item.product.kind === 'gas13kg').reduce((sum, item) => sum + item.quantity, 0),
    'gas45kg': items.filter(item => item.product.kind === 'gas45kg').reduce((sum, item) => sum + item.quantity, 0)
  }

  // Aplicar regras de taxa
  Object.entries(quantities).forEach(([kind, qty]) => {
    const rule = PLATFORM_FEE_RULES[kind as keyof typeof PLATFORM_FEE_RULES]
    if (qty >= rule.threshold) {
      taxa += rule.fee
    }
  })

  return taxa
}

/**
 * Calcula o split de pagamento entre plataforma e fornecedor
 * 
 * @param subtotal Subtotal do pedido
 * @param platformFee Taxa de plataforma
 * @returns Split de pagamento
 */
export function calculatePayoutSplit(subtotal: number, platformFee: number) {
  return {
    platform_fee: platformFee,
    supplier_amount: subtotal - platformFee
  }
}

/**
 * Formata tempo em segundos para MM:SS
 * 
 * @param seconds Segundos
 * @returns String formatada MM:SS
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Verifica se um pedido pode ser cancelado
 * 
 * @param order Pedido
 * @param currentTime Tempo atual
 * @returns true se pode cancelar
 */
export function canCancelOrder(order: { status: string; cancel_until?: Date }, currentTime: Date = new Date()): boolean {
  return order.status === 'pending' && 
         order.cancel_until !== undefined && 
         currentTime < order.cancel_until
}

/**
 * Gera ID único para pedidos
 * 
 * @returns ID único
 */
export function generateOrderId(): string {
  return Date.now().toString()
}

/**
 * Calcula desconto de fidelidade
 * 
 * @param subtotal Subtotal do pedido
 * @param discountPercent Percentual de desconto (1-100)
 * @returns Valor do desconto
 */
export function calculateLoyaltyDiscount(subtotal: number, discountPercent: number): number {
  return subtotal * (discountPercent / 100)
}

/**
 * Verifica se é pedido de fidelidade (10º, 20º, 30º...)
 * 
 * @param currentStamps Carimbos atuais
 * @returns true se é pedido de fidelidade
 */
export function isLoyaltyOrder(currentStamps: number): boolean {
  return (currentStamps + 1) % 10 === 0
}