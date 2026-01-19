import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { CartItem } from '../types/cart';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  return (
    <View style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} />
      )}
      <View style={styles.details}>
        <Text style={styles.name}>
          {item.name || 'Unknown Item'}
        </Text>
        
        {item.price && (
          <Text style={styles.price}>{item.price}</Text>
        )}
        
        <View style={styles.attributes}>
          {item.color && (
            <Text style={styles.attribute}>Color: {item.color}</Text>
          )}
          {item.size && (
            <Text style={styles.attribute}>Size: {item.size}</Text>
          )}
          {item.quantity && (
            <Text style={styles.attribute}>Qty: {item.quantity}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: 6,
    marginHorizontal: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    backgroundColor: Colors.background,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: Typography.fontFamily.semiBold,
  },
  size: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 6,
    fontFamily: Typography.fontFamily.medium,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.bold,
  },
  attributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attribute: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginRight: Spacing.md,
    marginTop: 2,
    fontFamily: Typography.fontFamily.regular,
  },
});
