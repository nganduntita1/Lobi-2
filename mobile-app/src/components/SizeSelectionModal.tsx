import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { CartItem } from '../types/cart';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';

interface SizeSelectionModalProps {
  visible: boolean;
  items: CartItem[];
  onClose: () => void;
  onConfirm: (itemsWithSizes: CartItem[]) => void;
}

export default function SizeSelectionModal({
  visible,
  items,
  onClose,
  onConfirm,
}: SizeSelectionModalProps) {
  const [itemSizes, setItemSizes] = useState<{ [key: number]: string }>({});

  const handleSizeChange = (index: number, size: string) => {
    setItemSizes({ ...itemSizes, [index]: size });
  };

  const handleConfirm = () => {
    const updatedItems = items.map((item, index) => ({
      ...item,
      size: itemSizes[index] || item.size || 'N/A',
    }));
    onConfirm(updatedItems);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add Size Information (Optional)</Text>
          <Text style={styles.subtitle}>
            Enter sizes for items that don't have them
          </Text>

          <ScrollView style={styles.itemsList}>
            {items.map((item, index) => {
              // Filter out invalid size values
              const validSize = item.size && 
                                item.size !== 'N/A' && 
                                !item.size.toLowerCase().includes('sold out') &&
                                !item.size.toLowerCase().includes('almost')
                                ? item.size 
                                : '';
              
              return (
                <View key={index} style={styles.itemContainer}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <TextInput
                    style={styles.sizeInput}
                    placeholder="Enter size (e.g., S, M, L, XL)"
                    value={itemSizes[index] || validSize}
                    onChangeText={(text) => handleSizeChange(index, text)}
                  />
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  itemsList: {
    maxHeight: 400,
  },
  itemContainer: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  existingSize: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: Typography.fontFamily.medium,
  },
  sizeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.text.primary,
    backgroundColor: Colors.background,
    fontFamily: Typography.fontFamily.regular,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  confirmButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
});
