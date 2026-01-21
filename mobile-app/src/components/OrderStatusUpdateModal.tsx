import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import { OrderStatus } from '../types/database';
import { orderService } from '../services/orderService';

interface OrderStatusUpdateModalProps {
  visible: boolean;
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: Colors.text.light },
  { value: 'processing', label: 'Processing', color: Colors.primary },
  { value: 'shipped', label: 'Shipped', color: '#2196F3' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: '#2196F3' },
  { value: 'delivered', label: 'Delivered', color: '#4CAF50' },
  { value: 'cancelled', label: 'Cancelled', color: '#F44336' },
];

export default function OrderStatusUpdateModal({
  visible,
  orderId,
  orderNumber,
  currentStatus,
  onClose,
  onStatusUpdated,
}: OrderStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [sheinOrderNumber, setSheinOrderNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    if (selectedStatus === currentStatus && !sheinOrderNumber && !adminNotes) {
      if (Platform.OS !== 'web') {
        Alert.alert('No Changes', 'Please make changes before updating.');
      }
      return;
    }

    try {
      setUpdating(true);

      // Update order status
      await orderService.updateOrderStatus(orderId, selectedStatus, adminNotes || undefined);

      // Update Shein order number if provided
      if (sheinOrderNumber.trim()) {
        await orderService.updateSheinOrderNumber(orderId, sheinOrderNumber.trim());
      }

      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Order status updated successfully!', [
          { text: 'OK', onPress: () => {
            onStatusUpdated();
            onClose();
          }}
        ]);
      } else {
        onStatusUpdated();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to update order status');
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    return STATUS_OPTIONS.find(opt => opt.value === status)?.color || Colors.text.light;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Update Order Status</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {/* Current Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) }]}>
                <Text style={styles.statusText}>
                  {STATUS_OPTIONS.find(s => s.value === currentStatus)?.label}
                </Text>
              </View>
            </View>

            {/* Select New Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select New Status</Text>
              <View style={styles.statusGrid}>
                {STATUS_OPTIONS.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusOption,
                      selectedStatus === status.value && styles.statusOptionSelected,
                      { borderColor: status.color },
                    ]}
                    onPress={() => setSelectedStatus(status.value)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        selectedStatus === status.value && styles.statusOptionTextSelected,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Shein Order Number */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shein Order Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Shein order number..."
                placeholderTextColor={Colors.text.light}
                value={sheinOrderNumber}
                onChangeText={setSheinOrderNumber}
                autoCapitalize="characters"
              />
              <Text style={styles.helperText}>
                Add the Shein order number once you've placed the order
              </Text>
            </View>

            {/* Admin Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Admin Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add internal notes about this update..."
                placeholderTextColor={Colors.text.light}
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Status Timeline Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📝 Status Update Guidelines</Text>
              <Text style={styles.infoText}>
                • <Text style={styles.infoBold}>Pending</Text> → Order received, awaiting processing
              </Text>
              <Text style={styles.infoText}>
                • <Text style={styles.infoBold}>Processing</Text> → Purchasing from Shein
              </Text>
              <Text style={styles.infoText}>
                • <Text style={styles.infoBold}>Shipped</Text> → Order shipped by Shein
              </Text>
              <Text style={styles.infoText}>
                • <Text style={styles.infoBold}>Out for Delivery</Text> → Being delivered to customer
              </Text>
              <Text style={styles.infoText}>
                • <Text style={styles.infoBold}>Delivered</Text> → Order completed
              </Text>
              <Text style={styles.infoText}>
                • <Text style={styles.infoBold}>Cancelled</Text> → Order cancelled
              </Text>
            </View>
          </ScrollView>

          {/* Update Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.buttonDisabled]}
              onPress={handleUpdateStatus}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color={Colors.text.white} />
              ) : (
                <Text style={styles.updateButtonText}>Update Order Status</Text>
              )}
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
    maxHeight: Platform.OS === 'ios' ? '85%' : '90%',
    height: Platform.OS === 'android' ? '90%' : undefined,
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
    maxHeight: Platform.OS === 'android' ? '65%' : undefined,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
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
  },
  statusText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statusOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    backgroundColor: Colors.background,
    minWidth: '48%',
    alignItems: 'center',
  },
  statusOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  statusOptionTextSelected: {
    color: Colors.text.white,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    fontFamily: Typography.fontFamily.regular,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    minHeight: 100,
    fontFamily: Typography.fontFamily.regular,
  },
  infoBox: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  infoBold: {
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
