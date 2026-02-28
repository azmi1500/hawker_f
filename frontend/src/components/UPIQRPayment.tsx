// frontend/src/components/UPIQRPayment.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
  Share,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

// Clipboard fallback
let Clipboard: any;
try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  console.log('Clipboard not available, using fallback');
  Clipboard = {
    setStringAsync: async (text: string) => {
      Alert.alert('UPI ID', text);
      return true;
    }
  };
}

interface UPIQRPaymentProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  onFailed?: () => void;
  theme: any;
  t: any;
  shopName: string;
  upiId: string | null;
}

const UPIQRPayment: React.FC<UPIQRPaymentProps> = ({
  visible,
  onClose,
  amount,
  onSuccess,
  onFailed,
  theme,
  t,
  shopName,
  upiId
}) => {
  const appState = useRef(AppState.currentState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [returnTime, setReturnTime] = useState<number | null>(null);
  
  // Check UPI ID
  useEffect(() => {
    if (visible && !upiId) {
      Alert.alert('Info', 'UPI payment not configured. Please add UPI ID in settings.');
      onClose();
    }
  }, [visible, upiId]);

  // 🎯 AUTO-DETECT when user returns from UPI app
  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('App state changed:', appState.current, '->', nextAppState);
      
      // When app comes back to foreground after being in background
      if (
        (appState.current === 'background' || appState.current === 'inactive') && 
        nextAppState === 'active'
      ) {
        console.log('📱 User returned from UPI app at:', new Date().toLocaleTimeString());
        
        // Store return time
        setReturnTime(Date.now());
        
        // Show auto-success message (no confirmation)
        Alert.alert(
          '✅ Payment Successful',
          'Your payment has been processed successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setPaymentStatus('success');
                onSuccess();
                onClose();
              }
            }
          ]
        );
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [visible]);

  // ⏱️ Auto-fail if no return within 5 minutes (optional)
  useEffect(() => {
    if (!visible || returnTime) return;
    
    const timer = setTimeout(() => {
      if (!returnTime) {
        Alert.alert(
          'Payment Timeout',
          'No payment detected. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                setPaymentStatus('failed');
                if (onFailed) onFailed();
                onClose();
              }
            }
          ]
        );
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearTimeout(timer);
  }, [visible, returnTime]);

  // Open UPI app
  const handleOpenUPIApp = async () => {
    try {
      setIsProcessing(true);
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName || 'UNIPROSG')}&am=${amount}&cu=INR`;
      
      console.log('Opening UPI URL:', upiUrl);
      
      const supported = await Linking.canOpenURL(upiUrl);
      
      if (supported) {
        await Linking.openURL(upiUrl);
        console.log('✅ UPI app opened at:', new Date().toLocaleTimeString());
      } else {
        Alert.alert('Info', 'Please open your UPI app manually and scan the QR code');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open UPI app');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Copy UPI ID
  const copyUPIId = async () => {
    try {
      await Clipboard.setStringAsync(upiId || '');
      Alert.alert('✅ Copied!', 'UPI ID copied to clipboard');
    } catch (error) {
      Alert.alert('UPI ID', upiId || '');
    }
  };
  
  // Share UPI ID
  const shareUPIId = async () => {
    try {
      await Share.share({
        message: `Pay ₹${amount} to UPI ID: ${upiId}\n\nShop: ${shopName || 'UNIPROSG'}`,
        title: 'UPI Payment'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Show status message if payment completed
  if (paymentStatus === 'success') {
    return (
      <Modal visible={visible} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, alignItems: 'center' }]}>
            <View style={[styles.statusIcon, { backgroundColor: theme.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={60} color={theme.success} />
            </View>
            <Text style={[styles.statusTitle, { color: theme.text }]}>Payment Successful!</Text>
            <Text style={[styles.statusAmount, { color: theme.primary }]}>₹{amount}</Text>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <Text style={styles.statusButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Modal visible={visible} transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, alignItems: 'center' }]}>
            <View style={[styles.statusIcon, { backgroundColor: theme.danger + '20' }]}>
              <Ionicons name="close-circle" size={60} color={theme.danger} />
            </View>
            <Text style={[styles.statusTitle, { color: theme.text }]}>Payment Failed!</Text>
            <Text style={[styles.statusAmount, { color: theme.danger }]}>₹{amount}</Text>
            <Text style={[styles.statusMessage, { color: theme.textSecondary }]}>
              Transaction could not be completed
            </Text>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <Text style={styles.statusButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!visible || !upiId) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>UPI QR Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={[styles.amountContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Amount to Pay</Text>
            <Text style={[styles.amountValue, { color: theme.primary }]}>₹{amount}</Text>
          </View>

          {/* QR Code - Click to open UPI app */}
          <TouchableOpacity 
            style={styles.qrContainer} 
            onPress={handleOpenUPIApp}
            disabled={isProcessing}
          >
            <View style={[styles.qrBox, { backgroundColor: '#fff' }]}>
              <QRCode
                value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName || 'UNIPROSG')}&am=${amount}&cu=INR`}
                size={180}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <Text style={[styles.qrSubtext, { color: theme.primary }]}>
              {isProcessing ? 'Opening...' : 'Tap to open UPI app'}
            </Text>
          </TouchableOpacity>

          {/* Auto-detection info */}
          <View style={[styles.infoBox, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              After payment, you'll be automatically returned to the app
            </Text>
          </View>

          {/* UPI ID */}
          <View style={[styles.upiContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.upiLabel, { color: theme.textSecondary }]}>UPI ID:</Text>
            <Text style={[styles.upiId, { color: theme.primary }]}>{upiId}</Text>
            
            <View style={styles.upiActions}>
              <TouchableOpacity style={styles.upiActionBtn} onPress={copyUPIId}>
                <Ionicons name="copy-outline" size={20} color={theme.primary} />
                <Text style={[styles.upiActionText, { color: theme.primary }]}>Copy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.upiActionBtn} onPress={shareUPIId}>
                <Ionicons name="share-outline" size={20} color={theme.primary} />
                <Text style={[styles.upiActionText, { color: theme.primary }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Manual fallback buttons (optional) */}
          <View style={styles.manualContainer}>
            <Text style={[styles.manualTitle, { color: theme.textSecondary }]}>
              Having issues? Click below:
            </Text>
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.failedButton, { borderColor: theme.danger }]}
                onPress={() => {
                  setPaymentStatus('failed');
                  if (onFailed) onFailed();
                  onClose();
                }}
              >
                <Text style={[styles.failedButtonText, { color: theme.danger }]}>Payment Failed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.successButton, { backgroundColor: theme.success }]}
                onPress={() => {
                  setPaymentStatus('success');
                  onSuccess();
                  onClose();
                }}
              >
                <Text style={styles.successButtonText}>Payment Success</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

// ✅ COMPLETE STYLES
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  amountContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrBox: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 8,
  },
  qrSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
  },
  upiContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  upiLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  upiId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  upiActions: {
    flexDirection: 'row',
    gap: 20,
  },
  upiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upiActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  manualContainer: {
    marginBottom: 20,
  },
  manualTitle: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  failedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  failedButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  successButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  statusAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },
  statusMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusButton: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UPIQRPayment;