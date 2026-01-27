import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { CartItem } from '../types/cart';
import CartItemCard from '../components/CartItemCard';
import SizeSelectionModal from '../components/SizeSelectionModal';
import DeliveryAddressModal from '../components/DeliveryAddressModal';
import OrderReviewModal from '../components/OrderReviewModal';
import Header from '../components/Header';
import { scrapeCart } from '../services/api';
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
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);

  const handleScrapeWithBackend = async () => {
    if (!url.trim()) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Please enter a Shein cart URL');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await scrapeCart(url);
      
      if (response.success && response.items.length > 0) {
        setCartItems(response.items);
        if (Platform.OS !== 'web') {
          Alert.alert('Success', `Found ${response.items.length} items!`);
        }
      } else {
        if (Platform.OS !== 'web') {
          Alert.alert('No Items', response.message || 'No items found in the cart');
        }
      }
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message || 'Failed to scrape cart');
      }
      console.error('Scrape error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    setShowSizeModal(true);
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
    setUrl('');
    setSelectedAddress(null);
    setShowReviewModal(false);
    
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

      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Lobi</Text>
        <Text style={styles.heroSubtitle}>Extract items from shared cart URLs</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Paste Shein cart URL here..."
          placeholderTextColor="#999"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleScrapeWithBackend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Scrape Cart</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Promo Cards Section */}
      {cartItems.length === 0 && !loading && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.promoSection}
          contentContainerStyle={styles.promoContent}
        >
          <View style={styles.promoCard}>
            <Image
              source={require('../../assets/packaging.png')}
              style={styles.promoImage}
              resizeMode="cover"
            />
            <View style={styles.promoTextContainer}>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
              <Text style={styles.promoTitle}>Premium Packaging</Text>
              <Text style={styles.promoDescription}>
                Quality packaging for safe delivery
              </Text>
            </View>
          </View>

          <View style={styles.promoCard}>
            <Image
              source={require('../../assets/merch.png')}
              style={styles.promoImage}
              resizeMode="cover"
            />
            <View style={styles.promoTextContainer}>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
              <Text style={styles.promoTitle}>Exclusive Merch</Text>
              <Text style={styles.promoDescription}>
                Unique Lobi branded merchandise
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

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
          cartUrl={url}
          deliveryAddress={selectedAddress}
          onClose={() => setShowReviewModal(false)}
          onOrderPlaced={handleOrderPlaced}
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
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: Colors.background,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  resultsContainer: {
    flex: 1,
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
  promoSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    maxHeight: 200,
  },
  promoContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  promoCard: {
    width: 180,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promoImage: {
    width: '100%',
    height: 100,
  },
  promoTextContainer: {
    padding: Spacing.sm,
  },
  comingSoonBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    fontFamily: Typography.fontFamily.semiBold,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.semiBold,
  },
  promoDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontFamily: Typography.fontFamily.regular,
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
