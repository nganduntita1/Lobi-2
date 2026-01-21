import { supabase } from '../config/supabase';
import { Order, CreateOrderData, OrderStatus } from '../types/database';

export const orderService = {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    // Generate unique order number with retry logic
    let orderNumber: string;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        // Generate order number with timestamp and random component
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        orderNumber = `LB${timestamp}${random}`;

        const { data: order, error } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            user_id: data.user_id,
            delivery_address_id: data.delivery_address_id,
            cart_url: data.cart_url,
            total_amount: data.total_amount,
            customer_notes: data.customer_notes,
            status: 'pending',
          })
          .select()
          .single();

        if (error) {
          // If it's a duplicate key error, retry with a new number
          if (error.code === '23505') {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
            continue;
          }
          throw error;
        }

        // Success! Break the loop
        if (!order) throw new Error('Failed to create order');

        // Insert order items
        if (data.items && data.items.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(
              data.items.map(item => ({
                order_id: order.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                image: item.image,
                sku: item.sku,
                color: item.color,
                size: item.size,
              }))
            );

          if (itemsError) throw itemsError;
        }

        return order;
        
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        attempts++;
      }
    }

    throw new Error('Failed to generate unique order number after multiple attempts');
  },

  /**
   * Get orders for a specific user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        delivery_addresses (*),
        order_status_history (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;

    // Insert status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        notes,
      });

    if (historyError) throw historyError;
  },

  /**
   * Get dashboard stats (admin only)
   */
  async getDashboardStats() {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total_amount, created_at');

    if (error) throw error;

    const stats = {
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      total_revenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_amount, 0),
      deliveries_today: orders.filter(o => {
        const today = new Date().toDateString();
        return o.status === 'out_for_delivery' && 
               new Date(o.created_at).toDateString() === today;
      }).length,
    };

    return stats;
  },

  /**
   * Update Shein order number
   */
  async updateSheinOrderNumber(orderId: string, sheinOrderNumber: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ shein_order_number: sheinOrderNumber })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'cancelled', reason);
  },
};
