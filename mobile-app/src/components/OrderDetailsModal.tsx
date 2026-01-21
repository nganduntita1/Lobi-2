import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import { orderService } from '../services/orderService';

interface OrderDetailsModalProps {
  visible: boolean;
  orderId: string;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function OrderDetailsModal({
  visible,
  orderId,
  onClose,
  isAdmin = false,
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && orderId) {
      loadOrderDetails();
    }
  }, [visible, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (error: any) {
      console.error('Error loading order details:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'out_for_delivery': return '#2196F3';
      case 'shipped': return '#2196F3';
      case 'processing': return Colors.primary;
      case 'cancelled': return '#F44336';
      default: return Colors.text.light;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateSubtotal = () => {
    if (!order?.order_items) return 0;
    return order.order_items.reduce((sum: number, item: any) => {
      const priceMatch = item.price?.match(/[\d.]+/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity || '1');
      return sum + (price * quantity);
    }, 0);
  };

  const calculateServiceFee = () => {
    const subtotal = calculateSubtotal();
    return order?.total_amount ? order.total_amount - subtotal : 0;
  };

  const getCurrency = () => {
    if (order?.order_items?.length > 0 && order.order_items[0].price) {
      const currencyMatch = order.order_items[0].price.match(/[R$€£¥]/);
      return currencyMatch ? currencyMatch[0] : 'R';
    }
    return 'R';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Order Details</Text>
              {order && (
                <Text style={styles.orderNumber}>{order.order_number}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
          ) : order ? (
            <ScrollView style={styles.content}>
              {/* Status Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                </View>
                <Text style={styles.dateText}>
                  Ordered: {new Date(order.created_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Delivery Address Section */}
              {order.delivery_addresses && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                  <View style={styles.addressBox}>
                    <Text style={styles.addressLine}>{order.delivery_addresses.address_line1}</Text>
                    {order.delivery_addresses.address_line2 && (
                      <Text style={styles.addressLine}>{order.delivery_addresses.address_line2}</Text>
                    )}
                    <Text style={styles.addressLine}>
                      {order.delivery_addresses.city}, {order.delivery_addresses.province}
                      {order.delivery_addresses.postal_code ? ` ${order.delivery_addresses.postal_code}` : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Order Items Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items ({order.order_items?.length || 0})</Text>
                {order.order_items?.map((item: any, index: number) => (
                  <View key={index} style={styles.itemCard}>
                    {item.image && (
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name || 'Unknown Item'}
                      </Text>
                      <View style={styles.itemMeta}>
                        {item.color && (
                          <Text style={styles.itemMetaText}>Color: {item.color}</Text>
                        )}
                        {item.size && (
                          <Text style={styles.itemMetaText}>Size: {item.size}</Text>
                        )}
                        {item.sku && (
                          <Text style={styles.itemMetaText}>SKU: {item.sku}</Text>
                        )}
                      </View>
                      <View style={styles.itemPricing}>
                        <Text style={styles.itemQuantity}>Qty: {item.quantity || 1}</Text>
                        <Text style={styles.itemPrice}>{item.price}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Price Breakdown Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Breakdown</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Subtotal:</Text>
                  <Text style={styles.priceValue}>
                    {getCurrency()}{calculateSubtotal().toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Service Fee:</Text>
                  <Text style={styles.priceValue}>
                    {getCurrency()}{calculateServiceFee().toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    {getCurrency()}{order.total_amount?.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Customer Notes Section */}
              {order.customer_notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Customer Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>📝 {order.customer_notes}</Text>
                  </View>
                </View>
              )}

              {/* Admin-only sections */}
              {isAdmin && (
                <>
                  {order.shein_order_number && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Shein Order Number</Text>
                      <Text style={styles.sheinOrderText}>{order.shein_order_number}</Text>
                    </View>
                  )}
                  
                  {order.admin_notes && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Admin Notes</Text>
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>🔒 {order.admin_notes}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cart URL</Text>
                    <Text style={styles.urlText} numberOfLines={2}>
                      {order.cart_url}
                    </Text>
                  </View>
                </>
              )}

              {/* Status History */}
              {order.order_status_history && order.order_status_history.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Status History</Text>
                  {order.order_status_history.map((history: any, index: number) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={[styles.historyDot, { backgroundColor: getStatusColor(history.status) }]} />
                      <View style={styles.historyContent}>
                        <Text style={styles.historyStatus}>{getStatusLabel(history.status)}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(history.created_at).toLocaleString('en-ZA')}
                        </Text>
                        {history.notes && (
                          <Text style={styles.historyNotes}>{history.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load order details</Text>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
              <Text style={styles.closeFooterButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  orderNumber: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: 24,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  statusText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  dateText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  addressBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressLine: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  itemMeta: {
    marginBottom: Spacing.sm,
  },
  itemMetaText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  itemPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  notesBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  sheinOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  urlText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  historyNotes: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: Typography.fontFamily.regular,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeFooterButton: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeFooterButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
});
