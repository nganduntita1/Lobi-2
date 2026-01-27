import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { orderService } from '../services/orderService';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import Header from '../components/Header';
import { Order } from '../types/database';

export default function AdminPaymentVerificationScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadOrders = async () => {
    try {
      // Load orders with proof_submitted status
      const data = await orderService.getOrdersByPaymentStatus('proof_submitted');
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleViewProof = (order: Order) => {
    setSelectedOrder(order);
    setAdminNotes('');
    setShowModal(true);
  };

  const handleVerifyPayment = async (status: 'verified' | 'failed') => {
    if (!selectedOrder) return;

    try {
      setProcessing(true);
      await orderService.updatePaymentStatus(selectedOrder.id, status, adminNotes);
      
      Alert.alert(
        'Success',
        `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
        [{ text: 'OK', onPress: () => {
          setShowModal(false);
          setSelectedOrder(null);
          loadOrders();
        }}]
      );
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      Alert.alert('Error', error.message || 'Failed to update payment status');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'proof_submitted': return Colors.info;
      case 'verified': return Colors.success;
      case 'failed': return Colors.error;
      default: return Colors.text.secondary;
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => handleViewProof(item)}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.payment_status) }]}>
            {item.payment_status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.detailValue}>${item.total_amount.toFixed(2)} USD</Text>
            <Text style={styles.detailValueSub}>≈ R{(item.total_amount / 0.056).toFixed(2)}</Text>
          </View>
        </View>
        
        {item.whatsapp_number && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>WhatsApp:</Text>
            <Text style={styles.detailValue}>{item.whatsapp_number}</Text>
          </View>
        )}

        {item.payment_reference && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference:</Text>
            <Text style={styles.detailValue}>{item.payment_reference}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.viewProofButton}
        onPress={() => handleViewProof(item)}
      >
        <Text style={styles.viewProofText}>👁 View Payment Proof</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
      <Header title="Payment Verification" />

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>✓ No pending payment verifications</Text>
          <Text style={styles.emptySubtext}>
            Orders awaiting payment proof will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Payment Proof Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Payment</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {selectedOrder && (
                <>
                  {/* Order Info */}
                  <View style={styles.modalInfoBox}>
                    <Text style={styles.modalInfoLabel}>Order: {selectedOrder.order_number}</Text>
                    <Text style={styles.modalInfoValue}>Amount: ${selectedOrder.total_amount.toFixed(2)} USD</Text>
                    <Text style={styles.modalInfoValueSub}>≈ R{(selectedOrder.total_amount / 0.056).toFixed(2)} ZAR</Text>
                    {selectedOrder.whatsapp_number && (
                      <Text style={styles.modalInfoValue}>WhatsApp: {selectedOrder.whatsapp_number}</Text>
                    )}
                  </View>

                  {/* Payment Proof Image */}
                  {selectedOrder.payment_proof_url ? (
                    <View style={styles.proofImageContainer}>
                      <Image
                        source={{ uri: selectedOrder.payment_proof_url }}
                        style={styles.proofImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View style={styles.noProofBox}>
                      <Text style={styles.noProofText}>No payment proof uploaded</Text>
                    </View>
                  )}

                  {/* Admin Notes */}
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Admin Notes:</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes about this payment verification..."
                      placeholderTextColor={Colors.text.light}
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton, processing && styles.buttonDisabled]}
                      onPress={() => handleVerifyPayment('failed')}
                      disabled={processing}
                    >
                      <Text style={styles.rejectButtonText}>✕ Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.verifyButton, processing && styles.buttonDisabled]}
                      onPress={() => handleVerifyPayment('verified')}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color={Colors.text.white} />
                      ) : (
                        <Text style={styles.verifyButtonText}>✓ Verify</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
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
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  orderDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  detailValueSub: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
  viewProofButton: {
    backgroundColor: Colors.primary + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  viewProofText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  closeText: {
    fontSize: 24,
    color: Colors.text.secondary,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalInfoBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.semiBold,
  },
  modalInfoValue: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  modalInfoValueSub: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 8,
    fontFamily: Typography.fontFamily.regular,
  },
  proofImageContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  proofImage: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.md,
  },
  noProofBox: {
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  noProofText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  notesSection: {
    marginBottom: Spacing.md,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 80,
    fontFamily: Typography.fontFamily.regular,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  rejectButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.bold,
  },
  verifyButton: {
    backgroundColor: Colors.success,
  },
  verifyButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
