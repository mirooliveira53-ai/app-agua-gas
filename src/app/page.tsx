'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  MapPin, 
  Star, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard, 
  Smartphone, 
  Truck, 
  CheckCircle, 
  Clock,
  User,
  Building2,
  MessageCircle,
  Heart,
  ChevronRight,
  ChevronLeft,
  Home,
  Package,
  BarChart3,
  Settings,
  Droplets,
  Flame,
  Send,
  Image as ImageIcon,
  X,
  AlertCircle,
  Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Importar tipos e utilitários
import { UserType, Product, Supplier, CartItem, Order, ChatMessage } from '@/lib/types'
import { 
  calculatePlatformFee, 
  formatTime, 
  canCancelOrder, 
  generateOrderId,
  calculateLoyaltyDiscount,
  isLoyaltyOrder
} from '@/lib/marketplace-utils'
import { mockSuppliers } from '@/lib/mock-data'

type Screen = 'onboarding' | 'login' | 'home' | 'suppliers' | 'supplier-detail' | 'cart' | 'tracking' | 'supplier-dashboard' | 'chat'

export default function AguaGasApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding')
  const [userType, setUserType] = useState<UserType>('cliente')
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'agua' | 'gas' | 'all'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loyaltyStamps, setLoyaltyStamps] = useState<{[supplierId: string]: number}>({})

  // Timer para cancelamento (10 minutos)
  const [cancelTimer, setCancelTimer] = useState<{[orderId: string]: number}>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setCancelTimer(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(orderId => {
          if (updated[orderId] > 0) {
            updated[orderId] -= 1
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const onboardingSteps = [
    {
      title: "Encontre fornecedores perto de você",
      description: "Localize os melhores fornecedores de água e gás na sua região",
      icon: <MapPin className="w-16 h-16 text-cyan-500" />
    },
    {
      title: "Peça seu botijão ou galão sem sair de casa",
      description: "Faça seus pedidos de forma rápida e prática pelo aplicativo",
      icon: <Smartphone className="w-16 h-16 text-blue-500" />
    },
    {
      title: "Entrega grátis sempre",
      description: "Receba seus produtos com entrega gratuita e total segurança",
      icon: <Truck className="w-16 h-16 text-green-500" />
    }
  ]

  const addToCart = (product: Product, size: string) => {
    const existingItem = cart.find(item => item.product.id === product.id && item.size === size)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, size }])
    }
  }

  const removeFromCart = (productId: string, size: string) => {
    setCart(cart.filter(item => !(item.product.id === productId && item.size === size)))
  }

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId, size)
    } else {
      setCart(cart.map(item => 
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const createOrder = () => {
    if (cart.length === 0 || !selectedSupplier) return

    const subtotal = getSubtotal()
    const platform_fee = calculatePlatformFee(cart)
    const currentStamps = loyaltyStamps[selectedSupplier.id] || 0
    
    // Verificar se é o 10º pedido (fidelidade)
    const isLoyalty = selectedSupplier.settings.loyalty.enabled && isLoyaltyOrder(currentStamps)
    const loyaltyDiscount = isLoyalty ? calculateLoyaltyDiscount(subtotal, selectedSupplier.settings.loyalty.discount_percent) : 0
    
    const finalSubtotal = subtotal - loyaltyDiscount
    const total = finalSubtotal

    const newOrder: Order = {
      id: generateOrderId(),
      supplier: selectedSupplier.name,
      items: [...cart],
      subtotal: finalSubtotal,
      platform_fee,
      total,
      status: 'pending',
      createdAt: new Date(),
      cancel_until: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      loyalty: {
        stamp_count_before: currentStamps,
        discount_applied_percent: isLoyalty ? selectedSupplier.settings.loyalty.discount_percent : undefined
      }
    }

    setOrders([...orders, newOrder])
    
    // Atualizar carimbos de fidelidade
    setLoyaltyStamps(prev => ({
      ...prev,
      [selectedSupplier.id]: (prev[selectedSupplier.id] || 0) + 1
    }))

    // Iniciar timer de cancelamento (10 minutos = 600 segundos)
    setCancelTimer(prev => ({
      ...prev,
      [newOrder.id]: 600
    }))

    setCart([])
    setCurrentScreen('tracking')
  }

  const cancelOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'cancelled' as const }
        : order
    ))
    
    // Remover timer
    setCancelTimer(prev => {
      const updated = { ...prev }
      delete updated[orderId]
      return updated
    })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedOrder) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      orderId: selectedOrder.id,
      sender: userType,
      message: newMessage,
      timestamp: new Date()
    }

    setChatMessages([...chatMessages, message])
    setNewMessage('')
  }

  const canCancelCurrentOrder = (order: Order) => {
    return canCancelOrder(order) && cancelTimer[order.id] > 0
  }

  // Onboarding Screen
  if (currentScreen === 'onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">AquaGás</h1>
            <p className="text-gray-600">Água e Gás com entrega grátis</p>
          </div>

          <div className="w-full max-w-md">
            <Card className="p-8 text-center">
              <div className="mb-6">
                {onboardingSteps[onboardingStep].icon}
              </div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {onboardingSteps[onboardingStep].title}
              </h2>
              <p className="text-gray-600 mb-8">
                {onboardingSteps[onboardingStep].description}
              </p>

              <div className="flex justify-center space-x-2 mb-8">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === onboardingStep ? 'bg-cyan-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex space-x-4">
                {onboardingStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                )}
                
                {onboardingStep < onboardingSteps.length - 1 ? (
                  <Button
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentScreen('login')}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    Começar
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Bem-vindo ao AquaGás</h1>
          </div>

          <Card className="p-6">
            <Tabs value={userType} onValueChange={(value) => setUserType(value as UserType)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="cliente">Cliente</TabsTrigger>
                <TabsTrigger value="fornecedor">Fornecedor</TabsTrigger>
              </TabsList>

              <TabsContent value="cliente" className="space-y-4">
                <div className="space-y-4">
                  <Input placeholder="Nome completo" />
                  <Input placeholder="E-mail" type="email" />
                  <Input placeholder="Telefone" />
                  <Input placeholder="Endereço completo" />
                </div>
              </TabsContent>

              <TabsContent value="fornecedor" className="space-y-4">
                <div className="space-y-4">
                  <Input placeholder="Nome da empresa" />
                  <Input placeholder="CNPJ/CPF" />
                  <Input placeholder="E-mail" type="email" />
                  <Input placeholder="Telefone" />
                  <Input placeholder="Endereço da base de entrega" />
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                onClick={() => setCurrentScreen(userType === 'cliente' ? 'home' : 'supplier-dashboard')}
              >
                Cadastrar
              </Button>
              
              <div className="text-center text-sm text-gray-500">ou entre com</div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  Google
                </Button>
                <Button variant="outline" className="w-full">
                  Facebook
                </Button>
              </div>
              
              <Button variant="outline" className="w-full">
                <Smartphone className="w-4 h-4 mr-2" />
                SMS
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Home Screen
  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">Olá! 👋</h1>
              <p className="text-cyan-100">O que você precisa hoje?</p>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setCurrentScreen('cart')}
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="O que você precisa hoje? Água ou Gás?"
              className="pl-10 bg-white/90 border-0 text-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 -mt-4">
          {/* Location */}
          <Card className="mb-6 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2 text-cyan-500" />
                <span className="text-sm">Entregando em: <strong>Rua das Flores, 123</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Categorias</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedCategory('agua')
                  setCurrentScreen('suppliers')
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Droplets className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Água Mineral</h3>
                  <p className="text-sm text-gray-600">Garrafões, galões e garrafinhas</p>
                  <div className="mt-2">
                    <Badge className="bg-green-500 text-white text-xs">Entrega: Grátis</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedCategory('gas')
                  setCurrentScreen('suppliers')
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Botijão de Gás</h3>
                  <p className="text-sm text-gray-600">13kg, 45kg e recarga</p>
                  <div className="mt-2">
                    <Badge className="bg-green-500 text-white text-xs">Entrega: Grátis</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setCurrentScreen('suppliers')}
            >
              <Building2 className="w-6 h-6 text-cyan-500" />
              <span className="text-sm">Ver Fornecedores</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => setCurrentScreen('tracking')}
            >
              <Package className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Meus Pedidos</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Suppliers List Screen
  if (currentScreen === 'suppliers') {
    const filteredSuppliers = mockSuppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || 
        supplier.products.some(product => product.category === selectedCategory)
      return matchesSearch && matchesCategory
    })

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('home')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Fornecedores</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('cart')}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex space-x-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Todos
            </Button>
            <Button
              variant={selectedCategory === 'agua' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('agua')}
              className={selectedCategory === 'agua' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
            >
              <Droplets className="w-4 h-4 mr-1" />
              Água
            </Button>
            <Button
              variant={selectedCategory === 'gas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('gas')}
              className={selectedCategory === 'gas' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              <Flame className="w-4 h-4 mr-1" />
              Gás
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{supplier.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span>{supplier.rating}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{supplier.deliveryTime}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{supplier.distance}</span>
                      </div>
                    </div>
                    {supplier.settings.loyalty.enabled && (
                      <div className="mt-2">
                        <Badge className="bg-purple-500 text-white text-xs">
                          <Gift className="w-3 h-3 mr-1" />
                          Fidelidade {supplier.settings.loyalty.discount_percent}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <Badge className="bg-green-500 text-white">Entrega: Grátis</Badge>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedSupplier(supplier)
                      setCurrentScreen('supplier-detail')
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    Fazer Pedido
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Supplier Detail Screen
  if (currentScreen === 'supplier-detail' && selectedSupplier) {
    const currentStamps = loyaltyStamps[selectedSupplier.id] || 0
    const stampsToNext = 10 - (currentStamps % 10)

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('suppliers')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">{selectedSupplier.name}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('cart')}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="p-4">
          {/* Supplier Info */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>{selectedSupplier.rating}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{selectedSupplier.deliveryTime}</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">Entrega: Grátis</Badge>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Card */}
          {selectedSupplier.settings.loyalty.enabled && (
            <Card className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Cartão Fidelidade</h3>
                    <p className="text-sm text-purple-100">
                      {stampsToNext} pedidos para {selectedSupplier.settings.loyalty.discount_percent}% de desconto
                    </p>
                  </div>
                  <Gift className="w-6 h-6" />
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs ${
                        i < (currentStamps % 10) ? 'bg-white text-purple-500' : 'bg-transparent'
                      }`}
                    >
                      {i < (currentStamps % 10) ? '✓' : ''}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Produtos</h2>
            {selectedSupplier.products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
                      <p className="text-lg font-bold text-gray-800 mb-2">
                        R$ {product.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Entrega em {product.deliveryTime}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.sizes.map((size) => (
                          <Badge key={size} variant="outline">
                            {size}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        {product.sizes.map((size) => (
                          <Button
                            key={size}
                            size="sm"
                            onClick={() => addToCart(product, size)}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Cart Screen
  if (currentScreen === 'cart') {
    const subtotal = getSubtotal()
    const platformFee = calculatePlatformFee(cart)
    const total = subtotal

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('home')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Carrinho</h1>
            <div></div>
          </div>
        </div>

        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Carrinho vazio</h3>
              <p className="text-gray-600 mb-6">Adicione produtos para continuar</p>
              <Button
                onClick={() => setCurrentScreen('home')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Ver Produtos
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <Card key={`${item.product.id}-${item.size}`}>
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{item.size}</p>
                          <p className="text-lg font-bold text-gray-800">
                            R$ {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Platform Fee Info */}
              {platformFee > 0 && (
                <Card className="mb-4 border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-orange-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Taxa de plataforma: R$ {platformFee.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      Cobrada do fornecedor para manter a entrega gratuita
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Order Summary */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Entrega</span>
                    <span>Grátis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-2" />
                    PIX
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Cartão de Crédito/Débito
                  </Button>
                </CardContent>
              </Card>

              <Button
                onClick={createOrder}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                size="lg"
              >
                Finalizar Pedido
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Order Tracking Screen
  if (currentScreen === 'tracking') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('home')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Meus Pedidos</h1>
            <div></div>
          </div>
        </div>

        <div className="p-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum pedido ainda</h3>
              <p className="text-gray-600 mb-6">Faça seu primeiro pedido</p>
              <Button
                onClick={() => setCurrentScreen('home')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Fazer Pedido
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          Pedido #{order.id.slice(-6)}
                        </h3>
                        <p className="text-sm text-gray-600">{order.supplier}</p>
                        <p className="text-sm text-gray-500">
                          {order.createdAt.toLocaleDateString('pt-BR')}
                        </p>
                        {order.loyalty.discount_applied_percent && (
                          <Badge className="bg-purple-500 text-white text-xs mt-1">
                            <Gift className="w-3 h-3 mr-1" />
                            Desconto fidelidade {order.loyalty.discount_applied_percent}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">
                          R$ {order.total.toFixed(2)}
                        </p>
                        <Badge
                          className={
                            order.status === 'pending' ? 'bg-yellow-500' :
                            order.status === 'approved' ? 'bg-blue-500' :
                            order.status === 'delivering' ? 'bg-orange-500' :
                            order.status === 'cancelled' ? 'bg-red-500' :
                            'bg-green-500'
                          }
                        >
                          {order.status === 'pending' && '⏳ Aguardando'}
                          {order.status === 'approved' && '✅ Aprovado'}
                          {order.status === 'delivering' && '🚚 Saiu para entrega'}
                          {order.status === 'delivered' && '🎉 Entregue'}
                          {order.status === 'cancelled' && '❌ Cancelado'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product.name} ({item.size})</span>
                          <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="text-sm text-green-600 font-medium">
                        Entrega: Grátis
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {/* Cancel Button - 10 minutos após pagamento */}
                      {canCancelCurrentOrder(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOrder(order.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar ({formatTime(cancelTimer[order.id])})
                        </Button>
                      )}

                      {/* Chat Button - disponível durante aprovado e entregando */}
                      {(order.status === 'approved' || order.status === 'delivering') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setCurrentScreen('chat')
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      )}

                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          ⭐ Avaliar Pedido
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Chat Screen
  if (currentScreen === 'chat' && selectedOrder) {
    const orderMessages = chatMessages.filter(msg => msg.orderId === selectedOrder.id)
    const canSendMessage = selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled'

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('tracking')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold">Chat - Pedido #{selectedOrder.id.slice(-6)}</h1>
              <p className="text-sm text-gray-600">{selectedOrder.supplier}</p>
            </div>
            <div></div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {orderMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Nenhuma mensagem ainda</p>
              <p className="text-sm text-gray-500">Inicie uma conversa com o fornecedor</p>
            </div>
          ) : (
            orderMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === userType ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === userType
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white text-gray-800 border'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Anexo"
                      className="mt-2 rounded-lg max-w-full h-auto"
                    />
                  )}
                  <p className={`text-xs mt-1 ${
                    message.sender === userType ? 'text-cyan-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        {canSendMessage ? (
          <div className="bg-white border-t p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 border-t p-4 text-center">
            <p className="text-sm text-gray-600">
              Chat bloqueado - pedido {selectedOrder.status === 'delivered' ? 'entregue' : 'cancelado'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Supplier Dashboard
  if (currentScreen === 'supplier-dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Dashboard</h1>
              <p className="text-cyan-100">Painel do Fornecedor</p>
            </div>
            <Button variant="ghost" size="sm" className="text-white">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 -mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">R$ 2.450</p>
                <p className="text-sm text-gray-600">Vendas do Mês</p>
                <p className="text-xs text-orange-600 mt-1">Taxa plataforma: R$ 245</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">23</p>
                <p className="text-sm text-gray-600">Pedidos Ativos</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">Pedido #00{i}</p>
                    <p className="text-sm text-gray-600">Cliente: João Silva</p>
                    <p className="text-xs text-orange-600">Taxa plataforma: R$ 5,00</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">R$ 45,90</p>
                    <Badge className="bg-orange-500">🚚 Entregando</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 w-full"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Plus className="w-6 h-6 text-cyan-500" />
              <span className="text-sm">Adicionar Produto</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <span className="text-sm">Relatórios</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}