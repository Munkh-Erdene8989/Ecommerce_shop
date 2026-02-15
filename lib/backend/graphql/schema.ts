export const typeDefs = `#graphql
  type Profile {
    id: ID!
    email: String!
    full_name: String
    avatar_url: String
    phone: String
    role: String!
    created_at: String!
    updated_at: String!
  }

  type Brand {
    id: ID!
    name: String!
    slug: String!
    created_at: String!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    created_at: String!
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    brand: String!
    category: String!
    price: Int!
    original_price: Int
    cost_price: Int
    image: String!
    images: [String]
    barcode: String
    stock_quantity: Int!
    rating: Float!
    reviews_count: Int!
    description: String!
    in_stock: Boolean!
    skin_type: [String!]!
    benefits: [String!]!
    is_featured: Boolean!
    is_new: Boolean!
    is_bestseller: Boolean!
    created_at: String!
    updated_at: String!
  }

  type Variant {
    id: ID!
    product_id: ID!
    sku: String
    name: String!
    price_adjustment: Int!
    stock_quantity: Int!
    created_at: String!
  }

  type Review {
    id: ID!
    product_id: ID!
    user_id: ID!
    rating: Int!
    body: String
    created_at: String!
  }

  type OrderItem {
    id: ID!
    order_id: ID!
    product_id: ID!
    product_name: String!
    quantity: Int!
    price: Int!
    created_at: String!
  }

  type Order {
    id: ID!
    user_id: ID!
    total: Int!
    subtotal: Int!
    shipping_cost: Int!
    status: String!
    payment_method: String!
    payment_status: String!
    qpay_invoice_id: String
    qpay_qr_text: String
    qpay_urls: JSON
    shipping_address: JSON!
    customer_info: JSON!
    created_at: String!
    updated_at: String!
    order_items: [OrderItem!]
  }

  type Customer {
    id: ID!
    email: String!
    full_name: String
    phone: String
    created_at: String!
    order_count: Int
    total_spent: Int
  }

  type Coupon {
    id: ID!
    code: String!
    type: String!
    value: Int!
    min_order_amount: Int
    max_uses: Int
    used_count: Int!
    valid_from: String
    valid_until: String
    created_at: String!
  }

  type InventoryMovement {
    id: ID!
    product_id: ID!
    quantity_delta: Int!
    reason: String!
    reference_id: ID
    created_at: String!
  }

  type DashboardStats {
    totalRevenue: Int!
    totalOrders: Int!
    pendingOrders: Int!
    totalProducts: Int!
    outOfStock: Int!
    recentOrdersCount: Int!
  }

  type MarketingEventAgg {
    event_name: String!
    count: Int!
  }

  scalar JSON

  input ProductsFilter {
    category: String
    brand: String
    search: String
    in_stock: Boolean
    is_featured: Boolean
  }

  input PagingInput {
    limit: Int
    offset: Int
  }

  type Query {
    me: Profile
    products(filter: ProductsFilter, sort: String, limit: Int, offset: Int): [Product!]!
    productBySlug(slug: String!): Product
    categories: [Category!]!
    brands: [Brand!]!
    adminProducts(paging: PagingInput, filter: ProductsFilter): [Product!]!
    myOrders(paging: PagingInput): [Order!]!
    adminOrders(paging: PagingInput, status: String): [Order!]!
    adminCustomers(paging: PagingInput): [Customer!]!
    dashboardStats(range: String): DashboardStats!
    marketingEventCounts(range: String): [MarketingEventAgg!]!
  }

  input CreateProductInput {
    name: String!
    slug: String
    brand: String
    category: String
    price: Int!
    original_price: Int
    cost_price: Int
    image: String
    images: [String]
    barcode: String
    stock_quantity: Int
    description: String
    skin_type: [String]
    benefits: [String]
    is_featured: Boolean
    is_new: Boolean
    is_bestseller: Boolean
  }

  input UpdateProductInput {
    id: ID!
    name: String
    slug: String
    brand: String
    category: String
    price: Int
    original_price: Int
    cost_price: Int
    image: String
    images: [String]
    barcode: String
    stock_quantity: Int
    description: String
    skin_type: [String]
    benefits: [String]
    is_featured: Boolean
    is_new: Boolean
    is_bestseller: Boolean
  }

  input UpdateStockInput {
    product_id: ID!
    quantity_delta: Int!
    reason: String!
    reference_id: ID
  }

  input CreateOrderInput {
    user_id: ID!
    subtotal: Int!
    shipping_cost: Int!
    total: Int!
    payment_method: String
    shipping_address: JSON!
    customer_info: JSON!
    items: [OrderItemInput!]!
    coupon_code: String
  }

  input OrderItemInput {
    product_id: ID!
    product_name: String!
    quantity: Int!
    price: Int!
  }

  input UpdateOrderStatusInput {
    order_id: ID!
    status: String
    payment_status: String
  }

  input CreateCouponInput {
    code: String!
    type: String!
    value: Int!
    min_order_amount: Int
    max_uses: Int
    valid_from: String
    valid_until: String
  }

  type Mutation {
    upsertProfileIfMissing(id: ID, email: String, full_name: String, avatar_url: String): Profile!
    createOrUpdateProduct(input: CreateProductInput!): Product!
    updateProduct(input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    adjustInventory(input: UpdateStockInput!): Boolean!
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(input: UpdateOrderStatusInput!): Order!
    createCoupon(input: CreateCouponInput!): Coupon!
    deleteCoupon(id: ID!): Boolean!
  }
`
