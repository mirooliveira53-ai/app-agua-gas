import { Supplier } from './types'

/**
 * Dados mockados dos fornecedores
 * Implementa todas as regras de negócio:
 * - hide_phone: true (números ocultos)
 * - loyalty.enabled: sistema de fidelidade opcional
 * - loyalty.discount_percent: desconto de 1-100%
 */
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Água Cristal Express',
    rating: 4.8,
    deliveryTime: '30-45 min',
    distance: '1.2 km',
    settings: {
      hide_phone: true, // Números ocultos - chat interno apenas
      loyalty: {
        enabled: true,
        discount_percent: 20 // 20% de desconto no 10º pedido
      }
    },
    products: [
      {
        id: '1',
        name: 'Garrafão Água Mineral 20L',
        price: 12.90,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
        category: 'agua',
        kind: 'galao20L', // Taxa: R$ 1,00 por pedido
        sizes: ['20L'],
        deliveryTime: '30 min'
      },
      {
        id: '2',
        name: 'Água Mineral 500ml',
        price: 2.50,
        image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop',
        category: 'agua',
        kind: '500ml', // Taxa: R$ 1,00 a partir de 10 unidades
        sizes: ['500ml'],
        deliveryTime: '30 min'
      }
    ]
  },
  {
    id: '2',
    name: 'Gás Rápido 24h',
    rating: 4.6,
    deliveryTime: '45-60 min',
    distance: '2.1 km',
    settings: {
      hide_phone: true, // Números ocultos - chat interno apenas
      loyalty: {
        enabled: true,
        discount_percent: 15 // 15% de desconto no 10º pedido
      }
    },
    products: [
      {
        id: '3',
        name: 'Botijão de Gás 13kg',
        price: 95.00,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        category: 'gas',
        kind: 'gas13kg', // Taxa: R$ 5,00 por pedido
        sizes: ['13kg'],
        deliveryTime: '45 min'
      },
      {
        id: '4',
        name: 'Botijão de Gás 45kg',
        price: 280.00,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        category: 'gas',
        kind: 'gas45kg', // Taxa: R$ 10,00 por pedido
        sizes: ['45kg'],
        deliveryTime: '45 min'
      }
    ]
  },
  {
    id: '3',
    name: 'Distribuidora Águas do Vale',
    rating: 4.7,
    deliveryTime: '20-35 min',
    distance: '0.8 km',
    settings: {
      hide_phone: true,
      loyalty: {
        enabled: true,
        discount_percent: 25 // 25% de desconto no 10º pedido
      }
    },
    products: [
      {
        id: '5',
        name: 'Garrafão Água Mineral 20L Premium',
        price: 15.90,
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
        category: 'agua',
        kind: 'galao20L',
        sizes: ['20L'],
        deliveryTime: '25 min'
      },
      {
        id: '6',
        name: 'Pack Água 500ml (12 unidades)',
        price: 28.90,
        image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop',
        category: 'agua',
        kind: '500ml',
        sizes: ['500ml x12'],
        deliveryTime: '25 min'
      }
    ]
  },
  {
    id: '4',
    name: 'Gás & Cia Industrial',
    rating: 4.5,
    deliveryTime: '60-90 min',
    distance: '3.5 km',
    settings: {
      hide_phone: true,
      loyalty: {
        enabled: false, // Sem programa de fidelidade
        discount_percent: 0
      }
    },
    products: [
      {
        id: '7',
        name: 'Botijão de Gás 13kg Ultragaz',
        price: 98.00,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        category: 'gas',
        kind: 'gas13kg',
        sizes: ['13kg'],
        deliveryTime: '60 min'
      },
      {
        id: '8',
        name: 'Botijão de Gás 45kg Industrial',
        price: 295.00,
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        category: 'gas',
        kind: 'gas45kg',
        sizes: ['45kg'],
        deliveryTime: '75 min'
      }
    ]
  }
]

/**
 * Casos de teste para validação das regras de taxa
 */
export const TEST_CASES = [
  {
    description: 'Pedido 9×500ml → taxa R$ 0,00',
    items: [{ productKind: '500ml', quantity: 9 }],
    expectedFee: 0
  },
  {
    description: 'Pedido 10×500ml → taxa R$ 1,00',
    items: [{ productKind: '500ml', quantity: 10 }],
    expectedFee: 1
  },
  {
    description: 'Pedido 1×20L → taxa R$ 1,00',
    items: [{ productKind: 'galao20L', quantity: 1 }],
    expectedFee: 1
  },
  {
    description: 'Pedido 1×13kg → taxa R$ 5,00',
    items: [{ productKind: 'gas13kg', quantity: 1 }],
    expectedFee: 5
  },
  {
    description: 'Pedido 1×45kg → taxa R$ 10,00',
    items: [{ productKind: 'gas45kg', quantity: 1 }],
    expectedFee: 10
  },
  {
    description: 'Pedido misto (10×500ml + 1×20L + 1×13kg + 1×45kg) → taxa R$ 17,00',
    items: [
      { productKind: '500ml', quantity: 10 },
      { productKind: 'galao20L', quantity: 1 },
      { productKind: 'gas13kg', quantity: 1 },
      { productKind: 'gas45kg', quantity: 1 }
    ],
    expectedFee: 17 // 1 + 1 + 5 + 10
  }
]