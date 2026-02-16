import { gql } from '@apollo/client'

export const ADMIN_PRODUCTS = gql`
  query AdminProducts($paging: PagingInput, $filter: ProductsFilter) {
    adminProducts(paging: $paging, filter: $filter) {
      id
      name
      slug
      brand
      category
      price
      stock_quantity
      in_stock
      is_featured
      is_new
      is_bestseller
      created_at
      image
    }
  }
`

export const ADMIN_PRODUCTS_TOTAL = gql`
  query AdminProductsTotal($filter: ProductsFilter) {
    adminProductsTotal(filter: $filter)
  }
`

export const ADMIN_ORDERS = gql`
  query AdminOrders($paging: PagingInput, $status: String) {
    adminOrders(paging: $paging, status: $status) {
      id
      total
      status
      payment_status
      created_at
      customer_info
    }
  }
`

export const ADMIN_ORDERS_TOTAL = gql`
  query AdminOrdersTotal($status: String) {
    adminOrdersTotal(status: $status)
  }
`

export const ADMIN_ORDER = gql`
  query AdminOrder($id: ID!) {
    adminOrder(id: $id) {
      id
      total
      subtotal
      shipping_cost
      status
      payment_status
      internal_notes
      shipping_address
      customer_info
      created_at
      updated_at
      order_items {
        id
        product_name
        quantity
        price
      }
    }
  }
`

export const ADMIN_CUSTOMERS = gql`
  query AdminCustomers($paging: PagingInput) {
    adminCustomers(paging: $paging) {
      id
      email
      full_name
      phone
      created_at
      order_count
      total_spent
    }
  }
`

export const ADMIN_CUSTOMERS_TOTAL = gql`
  query AdminCustomersTotal {
    adminCustomersTotal
  }
`

export const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      id
      status
      payment_status
      internal_notes
    }
  }
`

export const ADMIN_COUPONS = gql`
  query AdminCoupons($paging: PagingInput) {
    adminCoupons(paging: $paging) {
      id
      code
      type
      value
      min_order_amount
      max_uses
      used_count
      valid_from
      valid_until
      created_at
    }
  }
`

export const ADMIN_COUPONS_TOTAL = gql`
  query AdminCouponsTotal {
    adminCouponsTotal
  }
`

export const STORE_SETTINGS = gql`
  query StoreSettings {
    storeSettings {
      store_name
      logo_url
      shipping_rate
      free_shipping_threshold
      tax_rate
    }
  }
`

export const UPDATE_STORE_SETTINGS = gql`
  mutation UpdateStoreSettings($input: StoreSettingsInput!) {
    updateStoreSettings(input: $input) {
      store_name
      logo_url
      shipping_rate
      free_shipping_threshold
      tax_rate
    }
  }
`

export const ADMIN_MARKETING_EVENTS = gql`
  query AdminMarketingEvents($paging: PagingInput, $event_name: String, $utm_campaign: String) {
    adminMarketingEvents(paging: $paging, event_name: $event_name, utm_campaign: $utm_campaign) {
      id
      event_name
      page
      utm_source
      utm_medium
      utm_campaign
      product_id
      order_id
      value
      created_at
    }
  }
`

export const ADMIN_MARKETING_EVENTS_TOTAL = gql`
  query AdminMarketingEventsTotal($event_name: String, $utm_campaign: String) {
    adminMarketingEventsTotal(event_name: $event_name, utm_campaign: $utm_campaign)
  }
`

export const MARKETING_EVENT_COUNTS = gql`
  query MarketingEventCounts($range: String) {
    marketingEventCounts(range: $range) {
      event_name
      count
    }
  }
`

export const ADMIN_AUDIT_LOGS = gql`
  query AdminAuditLogs($paging: PagingInput, $entity_type: String) {
    adminAuditLogs(paging: $paging, entity_type: $entity_type) {
      id
      user_id
      action
      entity_type
      entity_id
      created_at
    }
  }
`

export const ADMIN_AUDIT_LOGS_TOTAL = gql`
  query AdminAuditLogsTotal($entity_type: String) {
    adminAuditLogsTotal(entity_type: $entity_type)
  }
`
