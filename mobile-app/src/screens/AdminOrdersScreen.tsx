import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { orderService } from '../services/orderService';
import { Order, OrderStatus } from '../types/database';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import OrderStatusUpdateModal from '../components/OrderStatusUpdateModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import Header from '../components/Header';

const STATUS_FILTERS = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    try {
      console.log('Loading orders...');
      const allOrders = await orderService.getAllOrders();
      console.log('Orders loaded:', allOrders?.length || 0);
      setOrders(allOrders);
      filterOrders(allOrders, selectedFilter, searchQuery);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      console.error('Error details:', error?.message, error?.details);
      // Show alert if in app
      if (Platform.OS !== 'web') {
        Alert.alert('Error Loading Orders', error?.message || 'Failed to load orders. Please check your admin permissions.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filterOrders = (orderList: Order[], status: string | null, search: string) => {
    let filtered = orderList;

    if (status) {
      filtered = filtered.filter(order => order.status === status);
    }

    if (search.trim()) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_notes?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (status: string | null) => {
    setSelectedFilter(status);
    filterOrders(orders, status, searchQuery);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    filterOrders(orders, selectedFilter, text);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
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

  const handleManageOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleStatusUpdated = () => {
    loadOrders();
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
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      
      {item.customer_notes && (
        <Text style={styles.notes} numberOfLines={2}>
          📝 {item.customer_notes}
        </Text>
      )}

      {item.shein_order_number && (
        <Text style={styles.sheinOrder}>
          Shein Order: {item.shein_order_number}
        </Text>
      )}
      
      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>R{item.total_amount.toFixed(2)}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.viewButton, styles.secondaryButton]}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={[styles.viewButtonText, styles.secondaryButtonText]}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => handleManageOrder(item)}
          >
            <Text style={styles.viewButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.heroTitle}>Order Management</Text>
        <Text style={styles.heroSubtitle}>{filteredOrders.length} orders • Lobi Admin</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order number..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filtersContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[
              styles.filterChip,
              selectedFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {selectedOrder && (
        <>
          <OrderStatusUpdateModal
            visible={showStatusModal}
            orderId={selectedOrder.id}
            orderNumber={selectedOrder.order_number}
            currentStatus={selectedOrder.status as OrderStatus}
            onClose={() => setShowStatusModal(false)}
            onStatusUpdated={handleStatusUpdated}
          />
          
          <OrderDetailsModal
            visible={showDetailsModal}
            orderId={selectedOrder.id}
            onClose={() => setShowDetailsModal(false)}
            isAdmin={true}
          />
        </>
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
  searchContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: Typography.fontFamily.regular,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
    fontFamily: Typography.fontFamily.medium,
  },
  filterTextActive: {
    color: Colors.text.white,
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
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  notes: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  sheinOrder: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
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
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    shadowColor: 'transparent',
  },
  viewButtonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
  },
});
