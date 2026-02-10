import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography } from '../theme/colors';
import { orderService } from '../services/orderService';

interface PaymentProofUploadModalProps {
  visible: boolean;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function PaymentProofUploadModal({
  visible,
  orderId,
  orderNumber,
  totalAmount,
  onClose,
  onUploadSuccess,
}: PaymentProofUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload payment proof.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    try {
      setUploading(true);
      await orderService.uploadPaymentProof(orderId, selectedImage);
      
      Alert.alert(
        'Success!',
        'Payment proof uploaded successfully. Our team will verify it shortly.',
        [{ text: 'OK', onPress: () => {
          setSelectedImage(null);
          onClose();
          onUploadSuccess();
        }}]
      );
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      Alert.alert('Error', error.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Upload Payment Proof</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {/* Order Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Order Number:</Text>
              <Text style={styles.infoValue}>{orderNumber}</Text>
              
              <Text style={styles.infoLabel}>Amount Paid:</Text>
              <Text style={styles.infoValue}>${totalAmount.toFixed(2)} USD</Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>📸 Upload Instructions:</Text>
              <Text style={styles.instructionsText}>
                • Take a clear screenshot of your payment confirmation{'\n'}
                • Make sure the amount and transaction details are visible{'\n'}
                • Upload the image below
              </Text>
            </View>

            {/* Image Preview */}
            {selectedImage && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Buttons */}
            {!selectedImage && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
                  <Text style={styles.selectButtonText}>📷 Choose Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.selectButton} onPress={takePhoto}>
                  <Text style={styles.selectButtonText}>📸 Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Upload Button */}
            {selectedImage && (
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.buttonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={Colors.text.white} />
                ) : (
                  <Text style={styles.uploadButtonText}>✓ Upload Payment Proof</Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
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
    maxHeight: '85%',
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
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2, // Extra padding at bottom for better scrolling
  },
  infoBox: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontFamily: Typography.fontFamily.regular,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  instructionsBox: {
    backgroundColor: Colors.primary + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  instructionsText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
    fontFamily: Typography.fontFamily.regular,
  },
  imagePreview: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: BorderRadius.md,
    resizeMode: 'contain',
    backgroundColor: Colors.background,
  },
  removeImageButton: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
  },
  removeImageText: {
    color: Colors.error,
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  selectButton: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selectButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: Colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
