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
import { supabase } from '../config/supabase';

interface DeliveryAddress {
  id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code?: string;
  is_default: boolean;
}

interface DeliveryAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: DeliveryAddress) => void;
}

export default function DeliveryAddressModal({
  visible,
  onClose,
  onSelectAddress,
}: DeliveryAddressModalProps) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAddresses();
    }
  }, [visible]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      setAddresses(data || []);
      
      // If no addresses, show add form
      if (!data || data.length === 0) {
        setShowAddForm(true);
      }
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to load addresses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!addressLine1.trim() || !city.trim() || !province.trim()) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please fill in all required fields');
      }
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const newAddress = {
        user_id: user.id,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        province,
        postal_code: postalCode || null,
        is_default: isDefault || addresses.length === 0, // First address is default
      };

      const { data, error } = await supabase
        .from('delivery_addresses')
        .insert([newAddress])
        .select()
        .single();

      if (error) throw error;

      // Clear form
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setProvince('');
      setPostalCode('');
      setIsDefault(false);
      
      setShowAddForm(false);
      await loadAddresses();
      
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Address saved successfully');
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to save address');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAddress = (address: DeliveryAddress) => {
    onSelectAddress(address);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {showAddForm ? 'Add Delivery Address' : 'Select Delivery Address'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : showAddForm ? (
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Address Line 1 *</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address, P.O. box"
                placeholderTextColor={Colors.text.light}
                value={addressLine1}
                onChangeText={setAddressLine1}
              />

              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                placeholder="Apartment, suite, unit, building, floor, etc."
                placeholderTextColor={Colors.text.light}
                value={addressLine2}
                onChangeText={setAddressLine2}
              />

              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.text.light}
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.label}>Province *</Text>
              <TextInput
                style={styles.input}
                placeholder="Province/State"
                placeholderTextColor={Colors.text.light}
                value={province}
                onChangeText={setProvince}
              />

              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Postal/ZIP code"
                placeholderTextColor={Colors.text.light}
                value={postalCode}
                onChangeText={setPostalCode}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                  {isDefault && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </TouchableOpacity>

              <View style={styles.formButtons}>
                {addresses.length > 0 && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, saving && styles.buttonDisabled]}
                  onPress={handleSaveAddress}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.text.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Save Address</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <>
              <ScrollView style={styles.addressList}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={styles.addressCard}
                    onPress={() => handleSelectAddress(address)}
                  >
                    {address.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                    <Text style={styles.addressLine}>{address.address_line1}</Text>
                    {address.address_line2 && (
                      <Text style={styles.addressLine}>{address.address_line2}</Text>
                    )}
                    <Text style={styles.addressLine}>
                      {address.city}, {address.province}
                      {address.postal_code ? ` ${address.postal_code}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.addButtonText}>+ Add New Address</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingBottom: Spacing.lg,
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
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  formContainer: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    fontFamily: Typography.fontFamily.regular,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addressList: {
    padding: Spacing.lg,
    maxHeight: 400,
  },
  addressCard: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  defaultBadgeText: {
    color: Colors.text.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  addressLine: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  addButton: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
});
