// src/components/DishGroupManagement.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../api';

interface DishGroup {
  id: number;
  name: string;
  itemCount: number;
  active: boolean;
}

interface DishGroupManagementProps {
  dishGroups: DishGroup[];
  setDishGroups: (groups: DishGroup[]) => void;
  categories: string[];
  setCategories: (categories: string[]) => void;
  setActiveCategory: (category: string) => void;
  currentTheme: any;
  t: any;
  onGroupUpdate: () => void;
}

export const DishGroupManagement: React.FC<DishGroupManagementProps> = ({
  dishGroups,
  setDishGroups,
  categories,
  setCategories,
  setActiveCategory,
  currentTheme,
  t,
  onGroupUpdate,
}) => {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DishGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [loading, setLoading] = useState(false);

  // Add Group
  const handleAddGroup = async (): Promise<void> => {
    if (!newGroupName.trim()) {
      Alert.alert(t.error, 'Please enter group name');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/dishgroups', {
        name: newGroupName.trim(),
        active: formActive
      });

      const newGroup = {
        id: response.data.Id,
        name: response.data.Name,
        itemCount: 0,
        active: response.data.active ?? formActive,
      };

      setDishGroups([...dishGroups, newGroup]);
      setCategories([...categories, newGroupName.trim()]);
      setNewGroupName('');
      setFormActive(true);
      setShowAddGroup(false);
      
      Alert.alert(t.success, `${newGroupName} ${t.addSuccess}`);
      onGroupUpdate();
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert(t.error, 'Failed to add dish group');
    } finally {
      setLoading(false);
    }
  };

  // Edit Group
  const handleEditGroup = async (): Promise<void> => {
    if (!editingGroup || !newGroupName.trim()) return;

    setLoading(true);
    try {
      const response = await API.put(`/dishgroups/${editingGroup.id}`, {
        name: newGroupName.trim(),
        active: formActive
      });

      const oldName = editingGroup.name;
      const updatedGroups = dishGroups.map(group =>
        group.id === editingGroup.id
          ? { ...group, name: newGroupName.trim(), active: formActive }
          : group
      );

      const updatedCategories = categories.map(cat =>
        cat === oldName ? newGroupName.trim() : cat
      );

      setDishGroups(updatedGroups);
      setCategories(updatedCategories);

      if (oldName === categories[0]) {
        setActiveCategory(newGroupName.trim());
      }

      setEditingGroup(null);
      setNewGroupName('');
      setFormActive(true);
      setShowEditGroup(false);
      
      Alert.alert(t.success, `${newGroupName} ${t.updateSuccess}`);
      onGroupUpdate();
    } catch (error) {
      console.error('Error editing group:', error);
      Alert.alert(t.error, 'Failed to edit dish group');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Active Status
  const toggleActive = async (group: DishGroup) => {
    setLoading(true);
    try {
      const newActiveState = !group.active;
      
      await API.put(`/dishgroups/${group.id}`, {
        name: group.name,
        active: newActiveState
      });

     const updatedGroups = dishGroups.map(g =>
  g.id === group.id ? { ...g, active: newActiveState } : g
);
setDishGroups(updatedGroups);


      Alert.alert('Success', `Group ${newActiveState ? 'activated' : 'deactivated'}`);
      onGroupUpdate();
    } catch (error) {
      console.error('Error toggling group:', error);
      Alert.alert(t.error, 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = (group: DishGroup): void => {
    Alert.alert(
      t.delete,
      `${t.confirmDelete} "${group.name}"? ${t.thisWillDelete}`,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await API.delete(`/dishgroups/${group.id}`);

              const updatedGroups = dishGroups.filter(g => g.id !== group.id);
              const updatedCategories = categories.filter(cat => cat !== group.name);

              setDishGroups(updatedGroups);
              setCategories(updatedCategories);

              if (group.name === categories[0] && updatedCategories.length > 0) {
                setActiveCategory(updatedCategories[0]);
              }

              Alert.alert(t.success, `${group.name} ${t.deleteSuccess}`);
              onGroupUpdate();
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert(t.error, 'Failed to delete dish group');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const openEditForm = (group: DishGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setFormActive(group.active);
    setShowEditGroup(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.title, { color: currentTheme.text }]}>{t.dishGroupManagement}</Text>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: currentTheme.secondary }]}
        onPress={() => {
          setFormActive(true);
          setShowAddGroup(true);
        }}
        disabled={loading}
      >
        <Text style={styles.addButtonText}>{t.addNewGroup}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={currentTheme.primary} />}

      <ScrollView style={styles.groupList} showsVerticalScrollIndicator={false}>
        {dishGroups.map((group, index) => (
          <View
            key={`group-${group.id}-${index}`}
            style={[
              styles.groupCard,
              {
                backgroundColor: currentTheme.card,
                borderColor: currentTheme.border,
                opacity: group.active ? 1 : 0.6
              }
            ]}
          >
          <View style={styles.groupInfo}>
  <Text style={[styles.groupName, { color: currentTheme.text }]}>{group.name}</Text>
  <Text style={[styles.groupCount, { color: currentTheme.textSecondary }]}>
    {group.itemCount || 0} {t.items_lower}
  </Text>
</View>

            <View style={styles.groupActions}>
              {/* Active Toggle Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { 
                  backgroundColor: group.active ? currentTheme.success : currentTheme.inactive 
                }]}
                onPress={() => toggleActive(group)}
                disabled={loading}
              >
                <Ionicons 
                  name={group.active ? "eye" : "eye-off"} 
                  size={18} 
                  color="#fff" 
                />
              </TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: currentTheme.primary }]}
                onPress={() => openEditForm(group)}
                disabled={loading}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: currentTheme.danger }]}
                onPress={() => handleDeleteGroup(group)}
                disabled={loading}
              >
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Group Modal */}
      <Modal visible={showAddGroup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t.addNewGroup}</Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: currentTheme.surface, 
                borderColor: currentTheme.border, 
                color: currentTheme.text 
              }]}
              placeholder={t.groupName}
              placeholderTextColor={currentTheme.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
              editable={!loading}
            />

            <View style={styles.activeRow}>
              <Text style={[styles.activeLabel, { color: currentTheme.text }]}>Active</Text>
              <Switch
                value={formActive}
                onValueChange={setFormActive}
                trackColor={{ false: currentTheme.inactive, true: currentTheme.success }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: currentTheme.surface }]}
                onPress={() => {
                  setShowAddGroup(false);
                  setNewGroupName('');
                  setFormActive(true);
                }}
                disabled={loading}
              >
                <Text style={[styles.cancelBtnText, { color: currentTheme.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: currentTheme.primary }]}
                onPress={handleAddGroup}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal visible={showEditGroup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{t.edit}</Text>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: currentTheme.surface, 
                borderColor: currentTheme.border, 
                color: currentTheme.text 
              }]}
              placeholder={t.groupName}
              placeholderTextColor={currentTheme.textSecondary}
              value={newGroupName}
              onChangeText={setNewGroupName}
              editable={!loading}
            />

            <View style={styles.activeRow}>
              <Text style={[styles.activeLabel, { color: currentTheme.text }]}>Active</Text>
              <Switch
                value={formActive}
                onValueChange={setFormActive}
                trackColor={{ false: currentTheme.inactive, true: currentTheme.success }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: currentTheme.surface }]}
                onPress={() => {
                  setShowEditGroup(false);
                  setEditingGroup(null);
                  setNewGroupName('');
                  setFormActive(true);
                }}
                disabled={loading}
              >
                <Text style={[styles.cancelBtnText, { color: currentTheme.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: currentTheme.primary }]}
                onPress={handleEditGroup}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.update}</Text>}
              </TouchableOpacity>
            </View>
          </View>
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
  groupList: { flex: 1 },
  groupCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, minHeight: 70 },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', marginBottom: 4, includeFontPadding: false },
  groupCount: { fontSize: 12, includeFontPadding: false },
  groupActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center', includeFontPadding: false },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 50 },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4, minHeight: 48, justifyContent: 'center' },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', includeFontPadding: false },
  saveBtn: { backgroundColor: '#4CAF50' },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600', includeFontPadding: false },
});