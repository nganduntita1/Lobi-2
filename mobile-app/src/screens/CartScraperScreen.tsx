import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CartItem } from '../types/cart';
import CartItemCard from '../components/CartItemCard';
import SizeSelectionModal from '../components/SizeSelectionModal';
import DeliveryAddressModal from '../components/DeliveryAddressModal';
import OrderReviewModal from '../components/OrderReviewModal';
import Header from '../components/Header';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';

interface DeliveryAddress {
  id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code?: string;
}

export default function CartScraperScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemColor, setItemColor] = useState('');
  const [itemSize, setItemSize] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [cartScreenshotUri, setCartScreenshotUri] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!itemName.trim()) {
      if (Platform.OS !== 'web') {
        Alert.alert('Missing Name', 'Please enter a product name.');
      }
      return;
    }

    if (!itemPrice.trim()) {
      if (Platform.OS !== 'web') {
        Alert.alert('Missing Price', 'Please enter a price.');
      }
      return;
    }

    const newItem: CartItem = {
      name: itemName.trim(),
      price: itemPrice.trim(),
      quantity: itemQuantity.trim() || '1',
      color: itemColor.trim() || undefined,
      size: itemSize.trim() || undefined,
      sku: itemSku.trim() || undefined,
    };

    setCartItems((prev) => [newItem, ...prev]);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
    setItemColor('');
    setItemSize('');
    setItemSku('');
  };

  const handleClearForm = () => {
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
    setItemColor('');
    setItemSize('');
    setItemSku('');
  };

  const handlePlaceOrder = () => {
    if (!cartScreenshotUri) {
      if (Platform.OS !== 'web') {
        Alert.alert('Screenshot Needed', 'Please attach a screenshot of your cart first.');
      }
      return;
    }
    setShowSizeModal(true);
  };

  const handlePickScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      if (Platform.OS !== 'web') {
        Alert.alert('Permission needed', 'Please allow photo access to upload your cart screenshot.');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCartScreenshotUri(result.assets[0].uri);
    }
  };

  const handleRemoveScreenshot = () => {
    setCartScreenshotUri(null);
  };

  const handleSizeConfirm = (itemsWithSizes: CartItem[]) => {
    setCartItems(itemsWithSizes);
    setShowSizeModal(false);
    // Open address selection modal
    setShowAddressModal(true);
  };

  const handleAddressSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
    // Open order review modal
    setShowReviewModal(true);
  };

  const handleOrderPlaced = () => {
    // Clear cart and reset state
    setCartItems([]);
    setSelectedAddress(null);
    setShowReviewModal(false);
    setCartScreenshotUri(null);
    
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Order Placed! 🎉',
        'Thank you for your order. You can track its status in the Orders tab.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Home" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Lobi</Text>
          <Text style={styles.heroSubtitle}>
            Upload your cart screenshot, then add items manually
          </Text>
        </View>

        <View style={styles.screenshotContainer}>
          <View style={styles.screenshotHeader}>
            <Text style={styles.screenshotTitle}>Cart Screenshot</Text>
            <Text style={styles.screenshotHint}>Required</Text>
          </View>

          {cartScreenshotUri ? (
            <View style={styles.screenshotPreview}>
              <Image
                source={{ uri: cartScreenshotUri }}
                style={styles.screenshotImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, styles.removeButton]}
                onPress={handleRemoveScreenshot}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickScreenshot}>
              <Text style={styles.uploadTitle}>Attach cart screenshot</Text>
              <Text style={styles.uploadSubtitle}>We use it to verify items before ordering</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Product name</Text>
          <TextInput
            style={[styles.input, styles.firstInput]}
            value={itemName}
            onChangeText={setItemName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>Price</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={itemPrice}
                onChangeText={setItemPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>Qty</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={itemQuantity}
                onChangeText={setItemQuantity}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>Color (optional)</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={itemColor}
                onChangeText={setItemColor}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.inputLabel}>Size (optional)</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                value={itemSize}
                onChangeText={setItemSize}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>SKU/Item code (optional)</Text>
          <TextInput
            style={styles.input}
            value={itemSku}
            onChangeText={setItemSku}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.formRow}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton, styles.halfButton]} onPress={handleClearForm}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={handleAddItem}>
              <Text style={styles.buttonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {cartItems.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Found {cartItems.length} items
              </Text>
              <TouchableOpacity
                style={styles.placeOrderButton}
                onPress={handlePlaceOrder}
              >
                <Text style={styles.placeOrderText}>Place Order</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={cartItems}
              keyExtractor={(item, index) => `${item.sku || index}`}
              renderItem={({ item }) => <CartItemCard item={item} />}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
            />
          </View>
        )}

      <SizeSelectionModal
        visible={showSizeModal}
        items={cartItems}
        onClose={() => setShowSizeModal(false)}
        onConfirm={handleSizeConfirm}
      />

      <DeliveryAddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSelectAddress={handleAddressSelect}
      />

      {selectedAddress && (
        <OrderReviewModal
          visible={showReviewModal}
          items={cartItems}
          cartUrl={'manual-entry'}
            cartScreenshotUri={cartScreenshotUri}
          deliveryAddress={selectedAddress}
          onClose={() => setShowReviewModal(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

        {cartItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Upload a cart screenshot and add items to get started
            </Text>
            <Text style={styles.emptySubtext}>
              Include name, price, quantity, and image URL if available
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
    fontFamily: Typography.fontFamily.bold,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 5,
    fontFamily: Typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  inputContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginTop: 10,
  },
  screenshotContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    marginTop: 10,
  },
  screenshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  screenshotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  screenshotHint: {
    fontSize: 12,
    color: Colors.text.light,
    fontFamily: Typography.fontFamily.regular,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
  screenshotPreview: {},
  screenshotImage: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 48,
    marginTop: Spacing.md,
    backgroundColor: Colors.background,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  firstInput: {
    marginTop: 0,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  halfInput: {
    minHeight: 48,
  },
  halfField: {
    width: '48%',
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  halfButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  secondaryButtonText: {
    color: Colors.text.primary,
  },
  resultsContainer: {
    marginTop: Spacing.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  placeOrderText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  listContent: {
    padding: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.text.light,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.regular,
  },
});
