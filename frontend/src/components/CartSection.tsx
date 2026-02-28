// src/components/CartSection.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { CartItem } from '../types';

interface CartSectionProps {
  cart: CartItem[];
  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
  removeItem: (id: number) => void;
  total: string;
  handleCheckout: () => void;
  isMobile: boolean;
  t: any;
  theme: any;
}

export const CartSection: React.FC<CartSectionProps> = ({ 
  cart, 
  increaseQuantity, 
  decreaseQuantity, 
  removeItem, 
  total, 
  handleCheckout, 
  isMobile, 
  t, 
  theme 
}) => {
  if (isMobile) {
    return (
      <View style={[styles.cartContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.cartHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.cartTitle, { color: theme.text }]}>{t.cart}</Text>
          <Text style={[styles.cartItemCount, { color: theme.textSecondary }]}>{cart.length} {t.items}</Text>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.cartItems}>
          {cart.map(item => (
            <View key={`cart-${item.id}`} style={[styles.cartItem, { borderBottomColor: theme.border }]}>
              <View style={styles.cartItemRow}>
                <View style={[styles.cartItemImageContainer, { backgroundColor: theme.surface }]}>
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.cartItemImage} />
                  ) : (
                    <View style={styles.cartItemImagePlaceholder}>
                      <Text style={styles.cartItemImagePlaceholderText}>🍽️</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cartItemDetails}>
                  <Text style={[styles.cartItemQuantity, { color: theme.text }]}>{item.quantity}x</Text>
                  <Text style={[styles.cartItemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={[styles.cartItemPriceMobile, { color: theme.primary }]}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              
              <View style={styles.cartItemControlsMobile}>
                <View style={[styles.cartQuantityControls, { borderColor: theme.border }]}>
                  <TouchableOpacity 
                    style={[styles.cartQuantityBtn, { backgroundColor: theme.surface }]}
                    onPress={() => decreaseQuantity(item.id)}
                  >
                    <Text style={[styles.cartQuantityBtnText, { color: theme.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.cartQuantityText, { color: theme.text }]}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={[styles.cartQuantityBtn, { backgroundColor: theme.surface }]}
                    onPress={() => increaseQuantity(item.id)}
                  >
                    <Text style={[styles.cartQuantityBtnText, { color: theme.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={[styles.cartRemoveBtn, { backgroundColor: theme.danger + '20' }]}
                  onPress={() => removeItem(item.id)}
                >
                  <Text style={[styles.cartRemoveText, { color: theme.danger }]}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {cart.length === 0 && (
            <View style={styles.emptyCart}>
              <Text style={[styles.emptyCartText, { color: theme.textSecondary }]}>{t.cartEmpty}</Text>
              <Text style={[styles.emptyCartSubText, { color: theme.textSecondary }]}>{t.tapToAdd}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.cartFooter, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.chargeText, { color: theme.text }]}>{t.total}</Text>
            <Text style={[styles.totalAmount, { color: theme.primary }]}>${total}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.checkoutBtn, { backgroundColor: theme.primary }, cart.length === 0 && { backgroundColor: theme.inactive }]}
            onPress={handleCheckout} disabled={cart.length === 0}
          >
            <Text style={styles.checkoutBtnText}>
              {cart.length === 0 ? t.cartEmpty : t.checkout}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.cartContainer, { backgroundColor: theme.surface }]}>
      <View style={[styles.cartHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.cartTitle, { color: theme.text }]}>{t.cart}</Text>
        <Text style={[styles.cartItemCount, { color: theme.textSecondary }]}>{cart.length} {t.items}</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.cartItems}>
        {cart.map(item => (
          <View key={`cart-${item.id}`} style={[styles.cartItem, { borderBottomColor: theme.border }]}>
            <View style={styles.cartItemRow}>
              <View style={[styles.cartItemImageContainer, { backgroundColor: theme.surface }]}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.cartItemImage} />
                ) : (
                  <View style={styles.cartItemImagePlaceholder}>
                    <Text style={styles.cartItemImagePlaceholderText}>🍽️</Text>
                  </View>
                )}
              </View>
              <View style={styles.cartItemDetails}>
                <Text style={[styles.cartItemQuantity, { color: theme.text }]}>{item.quantity}x</Text>
                <Text style={[styles.cartItemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={[styles.cartItemPrice, { color: theme.primary }]}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
            
            <View style={styles.cartItemControls}>
              <View style={[styles.cartQuantityControls, { borderColor: theme.border }]}>
                <TouchableOpacity 
                  style={[styles.cartQuantityBtn, { backgroundColor: theme.surface }]}
                  onPress={() => decreaseQuantity(item.id)}
                >
                  <Text style={[styles.cartQuantityBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.cartQuantityText, { color: theme.text }]}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={[styles.cartQuantityBtn, { backgroundColor: theme.surface }]}
                  onPress={() => increaseQuantity(item.id)}
                >
                  <Text style={[styles.cartQuantityBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.cartRemoveBtn, { backgroundColor: theme.danger + '20' }]}
                onPress={() => removeItem(item.id)}
              >
                <Text style={[styles.cartRemoveText, { color: theme.danger }]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {cart.length === 0 && (
          <View style={styles.emptyCart}>
            <Text style={[styles.emptyCartText, { color: theme.textSecondary }]}>{t.cartEmpty}</Text>
            <Text style={[styles.emptyCartSubText, { color: theme.textSecondary }]}>{t.tapToAdd}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.cartFooter, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.chargeText, { color: theme.text }]}>{t.charge}</Text>
          <Text style={[styles.totalAmount, { color: theme.primary }]}>${total}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.checkoutBtn, { backgroundColor: theme.primary }, cart.length === 0 && { backgroundColor: theme.inactive }]}
          onPress={handleCheckout} disabled={cart.length === 0}
        >
          <Text style={styles.checkoutBtnText}>
            {cart.length === 0 ? t.cartEmpty : t.checkout}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cartContainer: { 
    flex: 1,
  },
  cartHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 8, // Reduced from 12
    paddingVertical: 8,
    borderBottomWidth: 1, 
    minHeight: 40,
  },
  cartTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    includeFontPadding: false,
  },
  cartItemCount: { 
    fontSize: 11, 
    fontWeight: '500', 
    includeFontPadding: false,
  },
  cartItems: { 
    flex: 1, 
    paddingHorizontal: 6, // Reduced from 8
  },
  cartItem: { 
    paddingVertical: 6, // Reduced from 8
    borderBottomWidth: 1,
  },
  cartItemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4, // Reduced from 6
  },
  cartItemImageContainer: { 
    width: 30, // Reduced from 35
    height: 30, // Reduced from 35
    borderRadius: 4, 
    overflow: 'hidden', 
    marginRight: 8, // Reduced from 10
  },
  cartItemImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover',
  },
  cartItemImagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  cartItemImagePlaceholderText: { 
    fontSize: 16, // Reduced from 18
  },
  cartItemDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
  },
  cartItemQuantity: { 
    fontSize: 11, // Reduced from 12
    fontWeight: '600', 
    marginRight: 3, // Reduced from 4
    includeFontPadding: false,
  },
  cartItemName: { 
    fontSize: 11, // Reduced from 12
    flex: 1,
    includeFontPadding: false,
  },
  cartItemPrice: { 
    fontSize: 11, // Reduced from 12
    fontWeight: '500', 
    marginLeft: 4, // Reduced from 6
    includeFontPadding: false,
  },
  cartItemPriceMobile: { 
    fontSize: 11, // Reduced from 13
    fontWeight: '600', 
    marginLeft: 4, // Reduced from 6
    includeFontPadding: false,
  },
  cartItemControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginLeft: 38, // Adjusted from 45 (30px image + 8px margin)
  },
  cartItemControlsMobile: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginLeft: 38, // Adjusted from 45
    marginTop: 4, // Reduced from 6
  },
  cartQuantityControls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 4, // Reduced from 5
    height: 28, // Reduced from 34
  },
  cartQuantityBtn: { 
    paddingHorizontal: 8, // Reduced from 10
    paddingVertical: 2, // Reduced from 3
    minWidth: 28, // Reduced from 34
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  cartQuantityBtnText: { 
    fontSize: 10, 
    fontWeight: '600', // Changed from '100' to '600' for better visibility
    includeFontPadding: false,
  },
  cartQuantityText: { 
    paddingHorizontal: 4, // Reduced from 6
    fontSize: 11, // Reduced from 12
    fontWeight: '600', 
    minWidth: 20, // Reduced from 25
    textAlign: 'center',
    includeFontPadding: false,
  },
  cartRemoveBtn: { 
    paddingHorizontal: 8, // Reduced from 10
    paddingVertical: 4, // Reduced from 5
    borderRadius: 4, // Reduced from 5
    minWidth: 32, // Reduced from 36
    minHeight: 28, // Reduced from 34
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRemoveText: { 
    fontSize: 10, // Reduced from 11
    fontWeight: '600',
  },
  emptyCart: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 20, // Reduced from 25
  },
  emptyCartText: { 
    fontSize: 12, // Reduced from 13
    fontWeight: '600', 
    marginBottom: 2, // Reduced from 3
    includeFontPadding: false,
  },
  emptyCartSubText: { 
    fontSize: 10, // Reduced from 11
    includeFontPadding: false,
  },
  cartFooter: { 
    padding: 8, // Reduced from 10
    borderTopWidth: 1, // Changed from 2
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8, // Reduced from 10
  },
  chargeText: { 
    fontSize: 12, // Reduced from 13
    fontWeight: '600',
    includeFontPadding: false,
  },
  totalAmount: { 
    fontSize: 16, // Reduced from 18
    fontWeight: '800',
    includeFontPadding: false,
  },
  checkoutBtn: { 
    paddingVertical: 10, // Reduced from 12
    borderRadius: 6, // Reduced from 8
    alignItems: 'center',
    minHeight: 40, // Reduced from 44
    justifyContent: 'center',
  },
  checkoutBtnText: { 
    color: '#ffffff', 
    fontSize: 12, // Reduced from 13
    fontWeight: '600', // Changed from '700'
    includeFontPadding: false,
  },
});