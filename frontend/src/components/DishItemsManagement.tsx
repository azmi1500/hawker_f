// src/components/DishItemsManagement.tsx
import React, { useState } from 'react';
import API from '../api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch  // ✅ Import Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // ✅ Import Ionicons
import * as ImagePicker from 'expo-image-picker';
import { uploadAPI } from '../api';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  imageUri: string | null;
  category: string;
  originalName?: string;
  originalCategory?: string;
  displayCategory?: string;
  isActive?: boolean;  // ✅ Add isActive field
}

interface DishItemsManagementProps {
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  categories: string[];
  dishGroups: any[];
  setDishGroups: (groups: any[]) => void;
  currentTheme: any;
  t: any;
  onItemUpdate: () => void;
  imageUploading: boolean;
  setImageUploading: (loading: boolean) => void;
  pickImage: (setter: (uri: string) => void) => Promise<void>;
  captureImage: (setter: (uri: string) => void) => Promise<void>;
}

export const DishItemsManagement: React.FC<DishItemsManagementProps> = ({
  menuItems,
  setMenuItems,
  categories,
  dishGroups,
  setDishGroups,
  currentTheme,
  t,
  onItemUpdate,
  imageUploading,
  setImageUploading,
  pickImage,
  captureImage,
}) => {
  const [showAddDish, setShowAddDish] = useState(false);
  const [showEditDish, setShowEditDish] = useState(false);
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [newDish, setNewDish] = useState<any>({
    name: '',
    price: '',
    category: categories[0],
    imageUri: null,
    isActive: true,  // ✅ Default active
  });
  const [loading, setLoading] = useState(false);

  // Helper functions
const getCategoryIdByName = (categoryName: string): number => {
  console.log('🔍 ===== GET CATEGORY ID =====');
  console.log('🔍 Looking for category name:', categoryName);
  console.log('🔍 Type of categoryName:', typeof categoryName);
  console.log('🔍 dishGroups available:', dishGroups?.length || 0);
  console.log('📋 All dishGroups:', dishGroups.map(g => ({ 
    id: g.id, 
    name: g.name,
    nameType: typeof g.name,
    nameLength: g.name?.length
  })));
  
  if (!dishGroups || dishGroups.length === 0) {
    console.log('⚠️ No dish groups available - using fallback');
    return 1;
  }
  
  // Try exact match first
  let category = dishGroups.find(g => g.name === categoryName);
  
  if (!category) {
    console.log('⚠️ Exact match not found, trying case-insensitive');
    category = dishGroups.find(g => 
      g.name.toLowerCase() === categoryName.toLowerCase()
    );
  }
  
  if (!category) {
    console.log('⚠️ Still not found, trying includes');
    category = dishGroups.find(g => 
      g.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(g.name.toLowerCase())
    );
  }
  
  console.log('🔍 Found category:', category);
  
  if (!category) {
    console.log('⚠️ Category not found, using first available:', dishGroups[0]);
    return dishGroups[0]?.id || 1;
  }
  
  console.log('✅ Using category ID:', category.id);
  return category.id;
};

  const getEnglishCategory = (categoryName: string): string => {
    if (categoryName === t.appetiser) return 'Appetiser';
    if (categoryName === t.mainCourse) return 'Main Course';
    if (categoryName === t.hotDrinks) return 'Hot Drinks';
    if (categoryName === t.desserts) return 'Desserts';
    return categoryName;
  };

  // Toggle Active Status
// In DishItemsManagement.tsx - Update toggleActive with more logs
// In DishItemsManagement.tsx - Update the toggleActive function

const toggleActive = async (item: MenuItem) => {
  setLoading(true);
  try {
    const newActiveState = !(item.isActive ?? true);
    
    console.log('🔍 Toggling:', { id: item.id, from: item.isActive, to: newActiveState });
    
    const categoryId = getCategoryIdByName(item.category);
    
    const response = await API.put(`/dishitems/${item.id}`, {
      name: item.name,
      price: item.price,
      category: categoryId,
      originalName: item.originalName || item.name,
      originalCategory: item.originalCategory || item.category,
      displayCategory: item.displayCategory || item.category,
      isActive: newActiveState
    });
    
    console.log('✅ Response:', response.data);

    // ✅ Create new array with updated item
    const updatedItems = menuItems.map(i => {
      if (i.id === item.id) {
        return { ...i, isActive: newActiveState };
      }
      return i;
    });
    
    // ✅ Update state with new array
    setMenuItems(updatedItems);

    Alert.alert('Success', `Item ${newActiveState ? 'activated' : 'deactivated'}`);
    onItemUpdate();
  } catch (error: any) {
    console.error('❌ Error:', error);
    Alert.alert('Error', 'Failed to update status');
  } finally {
    setLoading(false);
  }
};


  // Add Dish
  const handleAddDish = async (): Promise<void> => {
    if (!newDish.name?.trim()) {
      Alert.alert(t.error, 'Please enter dish name');
      return;
    }

    const price = parseFloat(newDish.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert(t.error, 'Please enter valid price');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newDish.name.trim());
      formData.append('price', price.toString());
      formData.append('isActive', newDish.isActive ? 'true' : 'false');  // ✅ Add isActive

      const categoryId = getCategoryIdByName(newDish.category);
      formData.append('category', categoryId.toString());

      const englishCategory = getEnglishCategory(newDish.category);
      formData.append('originalName', newDish.name.trim());
      formData.append('originalCategory', englishCategory);
      formData.append('displayCategory', newDish.category);

      if (newDish.imageUri) {
        const filename = newDish.imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('image', {
          uri: newDish.imageUri,
          name: filename || 'image.jpg',
          type,
        } as any);
      }

      const response = await uploadAPI.post('/dishitems', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Create full image URL
      const imageUrl = response.data.imageUri || response.data.ImageUrl
        ? `http://192.168.0.169:5000${response.data.imageUri || response.data.ImageUrl}`
        : null;

      const newItem = {
        id: response.data.Id || response.data.id,
        name: response.data.Name || response.data.name,
        price: parseFloat(response.data.Price || response.data.price || price),
        category: response.data.CategoryId?.toString() || categoryId.toString(),
        imageUri: imageUrl,
        originalName: response.data.OriginalName || newDish.name,
        originalCategory: response.data.OriginalCategory || englishCategory,
        displayCategory: response.data.DisplayCategory || newDish.category,
        isActive: response.data.isActive ?? newDish.isActive,  // ✅ Set isActive
      };

      setMenuItems([...menuItems, newItem]);

      setDishGroups(dishGroups.map(group =>
        group.name === newDish.category
          ? { ...group, itemCount: (group.itemCount || 0) + 1 }
          : group
      ));

      setNewDish({ name: '', price: '', category: categories[0], imageUri: null, isActive: true });
      setShowAddDish(false);

      Alert.alert(t.success, `${newDish.name} ${t.addSuccess}`);
      onItemUpdate();
    } catch (error) {
      console.error('Error adding dish:', error);
      Alert.alert(t.error, 'Failed to add dish item');
    } finally {
      setLoading(false);
    }
  };

  // Edit Dish
  const handleEditDish = async (): Promise<void> => {
    if (!editingDish || !newDish.name?.trim()) return;

    const price = parseFloat(newDish.price);
    if (isNaN(price) || price <= 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newDish.name.trim());
      formData.append('price', price.toString());
      formData.append('isActive', newDish.isActive ? 'true' : 'false');  // ✅ Add isActive

      const categoryId = getCategoryIdByName(newDish.category);
      formData.append('category', categoryId.toString());

      const englishCategory = getEnglishCategory(newDish.category);
      formData.append('originalName', newDish.name.trim());
      formData.append('originalCategory', englishCategory);
      formData.append('displayCategory', newDish.category);

      if (newDish.imageUri && newDish.imageUri !== editingDish.imageUri) {
        const filename = newDish.imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('image', {
          uri: newDish.imageUri,
          name: filename || 'image.jpg',
          type,
        } as any);
      }

      const response = await uploadAPI.put(`/dishitems/${editingDish.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Create full image URL
      const imageUrl = response.data.imageUri || response.data.ImageUrl
        ? `http://192.168.0.169:5000${response.data.imageUri || response.data.ImageUrl}`
        : newDish.imageUri;

      const updatedItem = {
        ...editingDish,
        name: newDish.name.trim(),
        price: price,
        category: newDish.category,
        imageUri: imageUrl,
        originalName: newDish.name.trim(),
        originalCategory: englishCategory,
        displayCategory: newDish.category,
        isActive: newDish.isActive,  // ✅ Update isActive
      };

      const updatedItems = menuItems.map(item =>
        item.id === editingDish.id ? updatedItem : item
      );
      setMenuItems(updatedItems);

      // Update category counts if category changed
      if (editingDish.category !== newDish.category) {
        setDishGroups(dishGroups.map(group => {
          if (group.name === editingDish.category) {
            return { ...group, itemCount: Math.max(0, group.itemCount - 1) };
          }
          if (group.name === newDish.category) {
            return { ...group, itemCount: (group.itemCount || 0) + 1 };
          }
          return group;
        }));
      }

      setEditingDish(null);
      setNewDish({ name: '', price: '', category: categories[0], imageUri: null, isActive: true });
      setShowEditDish(false);

      Alert.alert(t.success, `${newDish.name} ${t.updateSuccess}`);
      onItemUpdate();
    } catch (error) {
      console.error('Error editing dish:', error);
      Alert.alert(t.error, 'Failed to edit dish item');
    } finally {
      setLoading(false);
    }
  };

  // Delete Dish
  const handleDeleteDish = (dish: MenuItem): void => {
    Alert.alert(
      t.delete,
      `${t.confirmDelete} "${dish.name}"?`,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await API.delete(`/dishitems/${dish.id}`);

              const updatedItems = menuItems.filter(item => item.id !== dish.id);
              setMenuItems(updatedItems);

              setDishGroups(dishGroups.map(group =>
                group.name === dish.category
                  ? { ...group, itemCount: Math.max(0, group.itemCount - 1) }
                  : group
              ));

              Alert.alert(t.success, `${dish.name} ${t.deleteSuccess}`);
              onItemUpdate();
            } catch (error) {
              console.error('Error deleting dish:', error);
              Alert.alert(t.error, 'Failed to delete dish item');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>{t.dishItems}</Text>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: currentTheme.secondary }]}
        onPress={() => {
          setNewDish({ name: '', price: '', category: categories[0], imageUri: null, isActive: true });
          setShowAddDish(true);
        }}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>{t.addNewItem}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={currentTheme.primary} />}

      <ScrollView style={styles.dishList} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <View
            key={`dish-${item.id}-${index}`}
            style={[
              styles.dishCard,
              {
                backgroundColor: currentTheme.card,
                borderColor: currentTheme.border,
                opacity: (item.isActive ?? true) ? 1 : 0.5  // ✅ Opacity for inactive
              }
            ]}
          >
            <View style={styles.dishImageContainer}>
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.dishThumbnail} />
              ) : (
                <View style={[styles.dishThumbnailPlaceholder, { backgroundColor: currentTheme.surface }]}>
                  <Text style={styles.dishThumbnailText}>🍽️</Text>
                </View>
              )}
            </View>
            <View style={styles.dishInfo}>
              <Text style={[styles.dishName, { color: currentTheme.text }]}>{item.name}</Text>
              <Text style={[styles.dishCategory, { color: currentTheme.textSecondary }]}>
                {item.displayCategory || item.category}
              </Text>
            </View>
            <Text style={[styles.dishPrice, { color: currentTheme.primary }]}>${item.price.toFixed(2)}</Text>
            <View style={styles.dishActions}>
              {/* Active Toggle Button */}
             <TouchableOpacity
  style={[styles.actionBtn, { 
    backgroundColor: (item.isActive ?? true) ? currentTheme.success : currentTheme.inactive 
  }]}
  onPress={() => toggleActive(item)}
  disabled={loading}
>
  <Ionicons 
    name={(item.isActive ?? true) ? "eye" : "eye-off"} 
    size={18} 
    color="#fff" 
  />
</TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: currentTheme.primary }]}
                onPress={() => {
                  setEditingDish(item);
                  setNewDish({
                    name: item.originalName || item.name,
                    price: item.price.toString(),
                    category: item.displayCategory || item.category,
                    imageUri: item.imageUri,
                    isActive: item.isActive ?? true,
                  });
                  setShowEditDish(true);
                }}
                disabled={loading}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: currentTheme.danger }]}
                onPress={() => handleDeleteDish(item)}
                disabled={loading}
              >
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Dish Modal */}
      <Modal visible={showAddDish} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModalContent}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t.addNewItem}</Text>

              {/* Image upload section (unchanged) */}
              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.dishImage}</Text>
              <View style={styles.imageUploadContainer}>
                {newDish.imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: newDish.imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setNewDish({ ...newDish, imageUri: null })}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                    <Text style={styles.imagePlaceholderText}>📸</Text>
                    <Text style={[styles.imagePlaceholderSubText, { color: currentTheme.textSecondary }]}>{t.noImage}</Text>
                  </View>
                )}

                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.imageButton, styles.galleryButton, { backgroundColor: currentTheme.secondary }]}
                    onPress={() => pickImage((uri) => setNewDish({ ...newDish, imageUri: uri }))}
                    disabled={imageUploading || loading}
                  >
                    {imageUploading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.imageButtonIcon}>🖼️</Text>
                        <Text style={styles.imageButtonText}>{t.gallery}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageButton, styles.cameraButton, { backgroundColor: currentTheme.primary }]}
                    onPress={() => captureImage((uri) => setNewDish({ ...newDish, imageUri: uri }))}
                    disabled={imageUploading || loading}
                  >
                    {imageUploading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.imageButtonIcon}>📷</Text>
                        <Text style={styles.imageButtonText}>{t.camera}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.dishName}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                placeholder={t.dishName}
                placeholderTextColor={currentTheme.textSecondary}
                value={newDish.name}
                onChangeText={(text) => setNewDish({ ...newDish, name: text })}
                editable={!loading}
              />

              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.price} ($)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                placeholder="0.00"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                value={newDish.price}
                onChangeText={(text) => setNewDish({ ...newDish, price: text })}
                editable={!loading}
              />

              {/* ✅ Active Switch */}
              <View style={styles.activeRow}>
                <Text style={[styles.activeLabel, { color: currentTheme.text }]}>Active</Text>
                <Switch
                  value={newDish.isActive}
                  onValueChange={(value) => setNewDish({ ...newDish, isActive: value })}
                  trackColor={{ false: currentTheme.inactive, true: currentTheme.success }}
                  thumbColor="#fff"
                />
              </View>

              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.selectCategory}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={`cat-${index}-${cat}`}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
                      newDish.category === cat && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }
                    ]}
                    onPress={() => setNewDish({ ...newDish, category: cat })}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: currentTheme.textSecondary },
                        newDish.category === cat && styles.selectedCategoryChipText
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: currentTheme.surface }]}
                  onPress={() => {
                    setShowAddDish(false);
                    setNewDish({ name: '', price: '', category: categories[0], imageUri: null, isActive: true });
                  }}
                  disabled={loading}
                >
                  <Text style={[styles.cancelBtnText, { color: currentTheme.text }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn, { backgroundColor: currentTheme.primary }]}
                  onPress={handleAddDish}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Dish Modal */}
      <Modal visible={showEditDish} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollModalContent}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t.edit}</Text>

              {/* Image upload section (same as add) */}
              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.dishImage}</Text>
              <View style={styles.imageUploadContainer}>
                {newDish.imageUri ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: newDish.imageUri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setNewDish({ ...newDish, imageUri: null })}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                    <Text style={styles.imagePlaceholderText}>📸</Text>
                    <Text style={[styles.imagePlaceholderSubText, { color: currentTheme.textSecondary }]}>{t.noImage}</Text>
                  </View>
                )}

                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.imageButton, styles.galleryButton, { backgroundColor: currentTheme.secondary }]}
                    onPress={() => pickImage((uri) => setNewDish({ ...newDish, imageUri: uri }))}
                    disabled={imageUploading || loading}
                  >
                    {imageUploading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.imageButtonIcon}>🖼️</Text>
                        <Text style={styles.imageButtonText}>{t.gallery}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageButton, styles.cameraButton, { backgroundColor: currentTheme.primary }]}
                    onPress={() => captureImage((uri) => setNewDish({ ...newDish, imageUri: uri }))}
                    disabled={imageUploading || loading}
                  >
                    {imageUploading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.imageButtonIcon}>📷</Text>
                        <Text style={styles.imageButtonText}>{t.camera}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.dishName}</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                placeholder={t.dishName}
                placeholderTextColor={currentTheme.textSecondary}
                value={newDish.name}
                onChangeText={(text) => setNewDish({ ...newDish, name: text })}
                editable={!loading}
              />

              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.price} ($)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                placeholder="0.00"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                value={newDish.price}
                onChangeText={(text) => setNewDish({ ...newDish, price: text })}
                editable={!loading}
              />

              {/* ✅ Active Switch in Edit */}
              <View style={styles.activeRow}>
                <Text style={[styles.activeLabel, { color: currentTheme.text }]}>Active</Text>
                <Switch
                  value={newDish.isActive}
                  onValueChange={(value) => setNewDish({ ...newDish, isActive: value })}
                  trackColor={{ false: currentTheme.inactive, true: currentTheme.success }}
                  thumbColor="#fff"
                />
              </View>

              <Text style={[styles.modalLabel, { color: currentTheme.text }]}>{t.selectCategory}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={`cat-${index}-${cat}`}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
                      newDish.category === cat && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }
                    ]}
                    onPress={() => setNewDish({ ...newDish, category: cat })}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: currentTheme.textSecondary },
                        newDish.category === cat && styles.selectedCategoryChipText
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: currentTheme.surface }]}
                  onPress={() => {
                    setShowEditDish(false);
                    setEditingDish(null);
                    setNewDish({ name: '', price: '', category: categories[0], imageUri: null, isActive: true });
                  }}
                  disabled={loading}
                >
                  <Text style={[styles.cancelBtnText, { color: currentTheme.text }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveBtn, { backgroundColor: currentTheme.primary }]}
                  onPress={handleEditDish}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.update}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16, includeFontPadding: false },
  addButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 16, minHeight: 50, justifyContent: 'center' },
  addButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600', includeFontPadding: false },
  dishList: { flex: 1 },
  dishCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, minHeight: 80 },
  dishImageContainer: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden', marginRight: 12 },
  dishThumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  dishThumbnailPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  dishThumbnailText: { fontSize: 22 },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 15, fontWeight: '600', marginBottom: 4, includeFontPadding: false },
  dishCategory: { fontSize: 12, includeFontPadding: false },
  dishPrice: { fontSize: 16, fontWeight: '700', marginRight: 12, includeFontPadding: false },
  dishActions: { flexDirection: 'row' },
  dishEditBtn: { padding: 8, marginRight: 6, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dishEditText: { fontSize: 18 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  activeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dishDeleteBtn: { padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dishDeleteText: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  scrollModalContent: { flexGrow: 1, justifyContent: 'center' },
  modalContent: { borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center', includeFontPadding: false },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 8, includeFontPadding: false },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 50 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4, minHeight: 48, justifyContent: 'center' },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', includeFontPadding: false },
  saveBtn: { backgroundColor: '#4CAF50' }, // ✅ ADD THIS
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', includeFontPadding: false },
  imageUploadContainer: { marginBottom: 16 },
  imagePreviewContainer: { width: '100%', height: 150, borderRadius: 8, overflow: 'hidden', marginBottom: 8, position: 'relative', borderWidth: 1 },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  removeImageText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  imagePlaceholder: { width: '100%', height: 150, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderStyle: 'dashed' },
  imagePlaceholderText: { fontSize: 40 },
  imagePlaceholderSubText: { fontSize: 12, marginTop: 4, includeFontPadding: false },
  imageButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  imageButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, marginHorizontal: 4, minHeight: 48 },
  imageButtonIcon: { fontSize: 16, color: '#ffffff', marginRight: 4 },
  imageButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '600', includeFontPadding: false },
  galleryButton: { backgroundColor: '#2196F3' },
  cameraButton: { backgroundColor: '#FF4444' },
  categorySelector: { flexDirection: 'row', marginBottom: 16, maxHeight: 50 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, minHeight: 40, justifyContent: 'center' },
  categoryChipText: { fontSize: 13, includeFontPadding: false },
  selectedCategoryChipText: { color: '#ffffff' },
});