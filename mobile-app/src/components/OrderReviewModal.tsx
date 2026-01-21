import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import { CartItem } from '../types/cart';
import { supabase } from '../config/supabase';
import { orderService } from '../services/orderService';

interface DeliveryAddress {
  id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code?: string;
}

interface OrderReviewModalProps {
  visible: boolean;
  items: CartItem[];
  cartUrl: string;
  deliveryAddress: DeliveryAddress;
  onClose: () => void;
  onOrderPlaced: () => void;
}

export default function OrderReviewModal({
  visible,
  items,
  cartUrl,
  deliveryAddress,
  onClose,
  onOrderPlaced,
}: OrderReviewModalProps) {
  const [serviceFeePercentage, setServiceFeePercentage] = useState(15);
  const [customerNotes, setCustomerNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    loadServiceFee();
    calculateSubtotal();
  }, [items]);

  const loadServiceFee = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'service_fee_percentage')
        .single();

      if (!error && data) {
        setServiceFeePercentage(parseFloat(data.value));
      }
    } catch (error) {
      console.error('Error loading service fee:', error);
    }
  };

  const calculateSubtotal = () => {
    let total = 0;
    items.forEach(item => {
      // Extract numeric value from price string (e.g., "R148" -> 148)
      const priceMatch = item.price?.match(/[\d.]+/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0]);
        const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 1);
        total += price * quantity;
      }
    });
    setSubtotal(total);
  };

  const calculateServiceFee = () => {
    return subtotal * (serviceFeePercentage / 100);
  };

  const calculateTotal = () => {
    return subtotal + calculateServiceFee();
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please select a delivery address');
      }
      return;
    }

    if (items.length === 0) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'No items in cart');
      }
      return;
    }

    try {
      setPlacing(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const orderData = {
        user_id: user.id,
        delivery_address_id: deliveryAddress.id,
        cart_url: cartUrl,
        total_amount: calculateTotal(),
        customer_notes: customerNotes || undefined,
        items: items.map(item => ({
          name: item.name || 'Unknown Item',
          price: item.price || 'R0',
          quantity: item.quantity || 1,
          image: item.image,
          sku: item.sku,
          color: item.color,
          size: item.size,
        })),
      };

      await orderService.createOrder(orderData);

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Success!',
          'Your order has been placed successfully. We will process it and update you on the status.',
          [{ text: 'OK', onPress: () => {
            onClose();
            onOrderPlaced();
          }}]
        );
      } else {
        onClose();
        onOrderPlaced();
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setPlacing(false);
    }
  };

  const getCurrency = () => {
    // Extract currency from first item price
    if (items.length > 0 && items[0].price) {
      const currencyMatch = items[0].price.match(/[R$€£¥]/);
      return currencyMatch ? currencyMatch[0] : 'R';
    }
    return 'R';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Review Order</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Delivery Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <View style={styles.addressBox}>
                <Text style={styles.addressLine}>{deliveryAddress.address_line1}</Text>
                {deliveryAddress.address_line2 && (
                  <Text style={styles.addressLine}>{deliveryAddress.address_line2}</Text>
                )}
                <Text style={styles.addressLine}>
                  {deliveryAddress.city}, {deliveryAddress.province}
                  {deliveryAddress.postal_code ? ` ${deliveryAddress.postal_code}` : ''}
                </Text>
              </View>
            </View>

            {/* Order Items Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name || 'Unknown Item'}
                    </Text>
                    <View style={styles.itemMeta}>
                      {item.color && (
                        <Text style={styles.itemMetaText}>Color: {item.color}</Text>
                      )}
                      {item.size && (
                        <Text style={styles.itemMetaText}>Size: {item.size}</Text>
                      )}
                      {item.quantity && (typeof item.quantity === 'number' ? item.quantity > 1 : parseInt(item.quantity) > 1) && (
                        <Text style={styles.itemMetaText}>Qty: {item.quantity}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </View>
              ))}
            </View>

            {/* Order Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  {getCurrency()}{subtotal.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Service Fee ({serviceFeePercentage}%):
                </Text>
                <Text style={styles.summaryValue}>
                  {getCurrency()}{calculateServiceFee().toFixed(2)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {getCurrency()}{calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Customer Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add any special instructions..."
                placeholderTextColor={Colors.text.light}
                value={customerNotes}
                onChangeText={setCustomerNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📦 Once you place this order, our team will purchase the items from Shein and have them delivered to your address.
              </Text>
              <Text style={styles.infoText}>
                🔔 You'll receive updates on your order status.
              </Text>
            </View>
          </ScrollView>

          {/* Place Order Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.placeOrderButton, placing && styles.buttonDisabled]}
              onPress={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color={Colors.text.white} />
              ) : (
                <Text style={styles.placeOrderButtonText}>
                  Place Order - {getCurrency()}{calculateTotal().toFixed(2)}
                </Text>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.semiBold,
  },
  itemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  itemMetaText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  summaryValue: {
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
  infoBox: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  placeOrderButton: {
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
  placeOrderButtonText: {
    color: Colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
