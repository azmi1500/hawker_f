// src/components/MenuGrid.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MenuItem } from '../types';

interface MenuGridProps {
  currentItems: MenuItem[];
  addToCart: (item: MenuItem) => void;
  totalPages: number;
  currentPage: number;
  prevPage: () => void;
  nextPage: () => void;
  setCurrentPage: (page: number) => void;
  categoryItems: MenuItem[];
  t: any;
  theme: any;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ 
  currentItems, 
  addToCart, 
  totalPages, 
  currentPage, 
  prevPage, 
  nextPage, 
  setCurrentPage, 
  categoryItems, 
  t, 
  
  theme 
}) => {
  
  // ✅ Filter out inactive items before displaying
  const activeItems = currentItems.filter(item => item.isActive !== false);
  
  // ✅ Also filter categoryItems count for pagination
  const activeCategoryItems = categoryItems.filter(item => item.isActive !== false);
  
  return (
    <View style={styles.menuGridContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.menuGrid}>
          {activeItems.length > 0 ? (
            activeItems.map(item => (
              <TouchableOpacity 
                key={`menu-${item.id}`}  
                style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} 
                onPress={() => addToCart(item)}
              >
                <View style={[styles.menuItemImageContainer, { backgroundColor: theme.surface }]}>
                  {item.imageUri ? (
                    <Image 
                      source={{ uri: item.imageUri }} 
                      style={styles.menuItemImage}
                      onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    />
                  ) : (
                    <View style={styles.menuItemImagePlaceholder}>
                      <Text style={styles.menuItemImagePlaceholderText}>🍽️</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.menuItemName, { color: theme.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.menuItemPrice, { color: theme.primary }]}>
                  ${item.price?.toFixed ? item.price.toFixed(2) : '0.00'}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noItemsContainer}>
              <Text style={[styles.noItemsText, { color: theme.textSecondary }]}>
                No active items in this category
              </Text>
            </View>
          )}
        </View>
        
        {totalPages > 1 && (
          <View style={[styles.paginationWrapper, { backgroundColor: theme.surface, borderTopColor: theme.border, borderBottomColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.paginationButton, { backgroundColor: theme.primary }, currentPage === 1 && { backgroundColor: theme.surface }]}
              onPress={prevPage} disabled={currentPage === 1}
            >
              <Text style={[styles.paginationButtonText, { color: '#ffffff' }, currentPage === 1 && { color: theme.textSecondary }]}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.pageNumbersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <TouchableOpacity
                      key={pageNum}
                      style={[
                        styles.pageNumberButton, 
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        currentPage === pageNum && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => setCurrentPage(pageNum)}
                    >
                      <Text style={[
                        styles.pageNumberText, 
                        { color: theme.textSecondary },
                        currentPage === pageNum && { color: '#ffffff' }
                      ]}>
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            
            <TouchableOpacity 
              style={[styles.paginationButton, { backgroundColor: theme.primary }, currentPage === totalPages && { backgroundColor: theme.surface }]}
              onPress={nextPage} disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationButtonText, { color: '#ffffff' }, currentPage === totalPages && { color: theme.textSecondary }]}>→</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Text style={[styles.itemCountText, { color: theme.textSecondary }]}>
          {t.showing} {activeItems.length} {t.of} {activeCategoryItems.length} {t.items_lower}
        </Text>
      </ScrollView>
    </View>
  );
};

// Add new styles
const styles = StyleSheet.create({
  menuGridContainer: { flex: 1 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 4 },
  menuItem: { width: '50%', padding: 8, borderBottomWidth: 1, borderRightWidth: 1, alignItems: 'center', minHeight: 150 },
  menuItemImageContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  menuItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  menuItemImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' },
  menuItemImagePlaceholderText: { fontSize: 32 },
  menuItemName: { fontSize: 13, marginBottom: 4, textAlign: 'center', paddingHorizontal: 4, includeFontPadding: false },
  menuItemPrice: { fontSize: 14, fontWeight: '600', includeFontPadding: false },
  paginationWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  paginationButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, minWidth: 44, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  paginationButtonText: { fontSize: 16, fontWeight: '600', includeFontPadding: false },
  pageNumbersContainer: { flex: 1, marginHorizontal: 8, height: 44 },
  pageNumberButton: { width: 38, height: 38, borderRadius: 19, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pageNumberText: { fontSize: 13, fontWeight: '500', includeFontPadding: false },
  itemCountText: { textAlign: 'center', fontSize: 11, paddingVertical: 8, includeFontPadding: false },
  // ✅ New styles
  noItemsContainer: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});