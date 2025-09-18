// Tipos do sistema de marketplace

export type UserType = 'cliente' | 'fornecedor'
export type ProductKind = '500ml' | 'galao20L' | 'gas13kg' | 'gas45kg'
export type OrderStatus = 'pending' | 'approved' | 'delivering' | 'delivered' | 'cancelled'

export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: 'agua' | 'gas'
  kind: ProductKind
  sizes: string[]
  deliveryTime: string
}

export interface Supplier {
  id: string
  name: string
  rating: number
  deliveryTime: string
  distance: string
  products: Product[]
  settings: {
    hide_phone: boolean
    loyalty: {
      enabled: boolean
      discount_percent: number // 1-100
    }
  }
}

export interface CartItem {
  product: Product
  quantity: number
  size: string
}

export interface Order {
  id: string
  supplier: string
  items: CartItem[]
  subtotal: number
  platform_fee: number
  total: number
  status: OrderStatus
  createdAt: Date
  cancel_until?: Date
  loyalty: {
    stamp_count_before: number
    discount_applied_percent?: number
  }
}

export interface ChatMessage {
  id: string
  orderId: string
  sender: UserType
  message: string
  image?: string
  timestamp: Date
}

export interface PayoutSplit {
  platform_fee: number
  supplier_amount: number
}

// Regras de taxa de plataforma
export const PLATFORM_FEE_RULES = {
  '500ml': { threshold: 10, fee: 1 }, // A partir de 10 unidades: R$ 1,00
  'galao20L': { threshold: 1, fee: 1 }, // A partir de 1 unidade: R$ 1,00
  'gas13kg': { threshold: 1, fee: 5 }, // A partir de 1 unidade: R$ 5,00
  'gas45kg': { threshold: 1, fee: 10 } // A partir de 1 unidade: R$ 10,00
} as const