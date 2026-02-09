export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          brand: string
          category: string
          price: number
          original_price: number | null
          image: string
          images: string[] | null
          rating: number
          reviews_count: number
          description: string
          in_stock: boolean
          skin_type: string[]
          benefits: string[]
          is_featured: boolean
          is_new: boolean
          is_bestseller: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          brand: string
          category: string
          price: number
          original_price?: number | null
          image: string
          images?: string[] | null
          rating?: number
          reviews_count?: number
          description: string
          in_stock?: boolean
          skin_type?: string[]
          benefits?: string[]
          is_featured?: boolean
          is_new?: boolean
          is_bestseller?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string
          category?: string
          price?: number
          original_price?: number | null
          image?: string
          images?: string[] | null
          rating?: number
          reviews_count?: number
          description?: string
          in_stock?: boolean
          skin_type?: string[]
          benefits?: string[]
          is_featured?: boolean
          is_new?: boolean
          is_bestseller?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total: number
          subtotal: number
          shipping_cost: number
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_method: string
          payment_status: 'pending' | 'paid' | 'failed'
          qpay_invoice_id: string | null
          qpay_qr_text: string | null
          qpay_urls: Json | null
          shipping_address: Json
          customer_info: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total: number
          subtotal: number
          shipping_cost: number
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_method: string
          payment_status?: 'pending' | 'paid' | 'failed'
          qpay_invoice_id?: string | null
          qpay_qr_text?: string | null
          qpay_urls?: Json | null
          shipping_address: Json
          customer_info: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total?: number
          subtotal?: number
          shipping_cost?: number
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_method?: string
          payment_status?: 'pending' | 'paid' | 'failed'
          qpay_invoice_id?: string | null
          qpay_qr_text?: string | null
          qpay_urls?: Json | null
          shipping_address?: Json
          customer_info?: Json
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Product = Tables<'products'>
export type Profile = Tables<'profiles'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type CartItem = Tables<'cart_items'>
