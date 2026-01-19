import { supabase } from '../config/supabase';
import { Order, CreateOrderData, OrderStatus } from '../types/database';

export const orderService = {
  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: data.user_id,
        delivery_address_id: data.delivery_address_id,
        cart_url: data.cart_url,
        subtotal: data.subtotal,
        service_fee: data.service_fee || data.subtotal * 0.1, // 10% service fee
        total_amount: data.total_amount || data.subtotal + (data.service_fee || data.subtotal * 0.1),
        customer_notes: data.customer_notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Insert order items
    if (data.items && data.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          data.items.map(item => ({
            order_id: order.id,
            ...item,
          }))
        );

      if (itemsError) throw itemsError;
    }

    return order;
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
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        ),
        delivery_addresses (
          full_name,
          street_address,
          city,
          province
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
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
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    await this.updateOrderStatus(orderId, 'cancelled', reason);
  },
};
