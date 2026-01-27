import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { Order } from '../types/database';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import OrderDetailsModal from '../components/OrderDetailsModal';
import PaymentProofUploadModal from '../components/PaymentProofUploadModal';
import Header from '../components/Header';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      const userOrders = await orderService.getUserOrders(user.id);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'out_for_delivery': return '#2196F3';
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

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowDetailsModal(true);
  };

  const handleUploadPaymentProof = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return Colors.success;
      case 'proof_submitted': return Colors.info;
      case 'failed': return Colors.error;
      default: return Colors.warning;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.orderDate}>
        {new Date(item.created_at).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
      
      {/* Payment Status */}
      <View style={styles.paymentStatusRow}>
        <Text style={styles.paymentLabel}>Payment:</Text>
        <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(item.payment_status) + '20' }]}>
          <Text style={[styles.paymentStatusText, { color: getPaymentStatusColor(item.payment_status) }]}>
            {getPaymentStatusLabel(item.payment_status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.totalAmount}>${item.total_amount.toFixed(2)} USD</Text>
          <Text style={styles.totalAmountSub}>≈ R{(item.total_amount / 0.056).toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.buttonGroup}>
        {item.payment_status === 'pending' && (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={() => handleUploadPaymentProof(item)}
          >
            <Text style={styles.uploadButtonText}>📤 Upload Proof</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => handleViewDetails(item.id)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Orders" />

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>My Orders</Text>
        <Text style={styles.heroSubtitle}>Track your Lobi orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>
            Start shopping by scraping a Shein cart
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {selectedOrderId && (
        <OrderDetailsModal
          visible={showDetailsModal}
          orderId={selectedOrderId}
          onClose={() => setShowDetailsModal(false)}
          isAdmin={false}
        />
      )}

      {selectedOrder && (
        <PaymentProofUploadModal
          visible={showPaymentModal}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.order_number}
          totalAmount={selectedOrder.total_amount}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrder(null);
          }}
          onUploadSuccess={() => {
            loadOrders();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.bold,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  listContent: {
    padding: Spacing.md,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginRight: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  paymentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    minWidth: 130,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: Colors.text.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  totalAmountSub: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  viewButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    minWidth: 130,
    alignItems: 'center',
  },
  viewButtonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
});
