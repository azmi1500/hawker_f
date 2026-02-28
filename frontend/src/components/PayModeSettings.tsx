// components/PayModeSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../api';

interface PayModeSettingsProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  theme: any;
  t: any;
  onUpdate: (modes: PaymentMode[]) => void;
}

interface PaymentMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
  order: number;
}

const PayModeSettings: React.FC<PayModeSettingsProps> = ({
  visible,
  onClose,
  userId,
  theme,
  t,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMode, setEditingMode] = useState<PaymentMode | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('💳');
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Available icons
  const iconOptions = ['💰', '📱', '💳', '🎫', '🏦', '🪙', '💵', '💎', '🔹', '⭐', '🛵', '🏧'];

  // Load current payment modes
  useEffect(() => {
    if (visible && userId) {
      loadPaymentModes();
    }
  }, [visible, userId]);

  const loadPaymentModes = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/user/payment-modes/${userId}`);
      const modes = response.data.paymentModes || [];
      
      // If modes is array of strings (old format), convert to objects
      if (modes.length > 0 && typeof modes[0] === 'string') {
        const convertedModes = modes.map((mode: string, index: number) => ({
          id: mode,
          name: getModeName(mode),
          icon: getModeIcon(mode),
          description: getModeDescription(mode),
          isActive: true,
          order: index
        }));
        setPaymentModes(convertedModes);
      } else {
        // Already objects
        setPaymentModes(modes);
      }
    } catch (error) {
      console.error('Error loading payment modes:', error);
      Alert.alert('Error', 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for string to object conversion
  const getModeName = (modeId: string): string => {
    const names: Record<string, string> = {
      'cash': 'Cash',
      'paynow': 'PayNow',
      'visa': 'Visa/Master',
      'cdc': 'CDC Voucher',
      'paylah': 'PayLah!',
      'grabpay': 'GrabPay'
    };
    return names[modeId] || modeId;
  };

  const getModeIcon = (modeId: string): string => {
    const icons: Record<string, string> = {
      'cash': '💰',
      'paynow': '📱',
      'visa': '💳',
      'cdc': '🎫',
      'paylah': '📱',
      'grabpay': '🛵'
    };
    return icons[modeId] || '💳';
  };

  const getModeDescription = (modeId: string): string => {
    const desc: Record<string, string> = {
      'cash': 'Pay with cash',
      'paynow': 'PayNow QR transfer',
      'visa': 'Credit/Debit card',
      'cdc': 'CDC vouchers',
      'paylah': 'DBS PayLah',
      'grabpay': 'GrabPay wallet'
    };
    return desc[modeId] || `${modeId} payment`;
  };

  const saveModes = async () => {
  if (!userId) {
    Alert.alert('Error', 'User not found');
    return;
  }

  setSaving(true);
  try {
    console.log('📤 Sending to backend:', {
      userId,
      paymentModes: paymentModes
    });

    const response = await API.put('/user/payment-modes', {
      userId,
      paymentModes
    });
    
    console.log('📥 Backend response:', response.data);
    
    if (response.data.success) {
      Alert.alert('Success', 'Payment modes updated successfully');
      onUpdate(paymentModes);
      onClose();
    } else {
      Alert.alert('Error', 'Failed to update payment modes');
    }
  } catch (error: any) {
    console.error('❌ Save error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    Alert.alert(
      'Error', 
      error.response?.data?.error || 'Failed to connect to server'
    );
  } finally {
    setSaving(false);
  }
};

  const openAddForm = () => {
    setEditingMode(null);
    setFormName('');
    setFormIcon('💳');
    setFormDesc('');
    setFormActive(true);
    setShowForm(true);
  };

  const openEditForm = (mode: PaymentMode) => {
    setEditingMode(mode);
    setFormName(mode.name);
    setFormIcon(mode.icon);
    setFormDesc(mode.description);
    setFormActive(mode.isActive);
    setShowForm(true);
  };

  const handleSubmitForm = () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter payment mode name');
      return;
    }

    if (editingMode) {
      // Update existing mode
      setPaymentModes(prev => 
        prev.map(m => 
          m.id === editingMode.id 
            ? { 
                ...m, 
                name: formName.trim(), 
                icon: formIcon, 
                description: formDesc.trim() || `${formName.trim()} payment`,
                isActive: formActive 
              }
            : m
        )
      );
    } else {
      // Add new mode (always at the end)
      const newMode: PaymentMode = {
        id: `mode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formName.trim(),
        icon: formIcon,
        description: formDesc.trim() || `${formName.trim()} payment`,
        isActive: formActive,
        order: paymentModes.length // Add at the end
      };
      setPaymentModes(prev => [...prev, newMode]);
    }

    setShowForm(false);
  };

  const toggleActive = (modeId: string) => {
    setPaymentModes(prev => 
      prev.map(mode => 
        mode.id === modeId ? { ...mode, isActive: !mode.isActive } : mode
      )
    );
  };

  const deleteMode = (modeId: string) => {
    Alert.alert(
      'Delete Payment Mode',
      'Are you sure you want to delete this payment mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentModes(prev => prev.filter(mode => mode.id !== modeId));
          }
        }
      ]
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newModes = [...paymentModes];
    [newModes[index - 1], newModes[index]] = [newModes[index], newModes[index - 1]];
    // Update order property
    newModes.forEach((mode, i) => { mode.order = i; });
    setPaymentModes(newModes);
  };

  const moveDown = (index: number) => {
    if (index === paymentModes.length - 1) return;
    const newModes = [...paymentModes];
    [newModes[index], newModes[index + 1]] = [newModes[index + 1], newModes[index]];
    // Update order property
    newModes.forEach((mode, i) => { mode.order = i; });
    setPaymentModes(newModes);
  };

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
            <Text style={[styles.title, { color: theme.text }]}>Payment Modes</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {/* Add Button */}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={openAddForm}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add Payment Mode</Text>
              </TouchableOpacity>

              {/* Add/Edit Form */}
              {showForm && (
                <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.formTitle, { color: theme.text }]}>
                    {editingMode ? 'Edit Payment Mode' : 'Add Payment Mode'}
                  </Text>

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Name *</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    placeholder="e.g. GrabPay, PayNow, etc."
                    placeholderTextColor={theme.textSecondary}
                    value={formName}
                    onChangeText={setFormName}
                  />

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Description</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    placeholder="Optional description"
                    placeholderTextColor={theme.textSecondary}
                    value={formDesc}
                    onChangeText={setFormDesc}
                  />

                  <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Select Icon</Text>
                  <ScrollView horizontal style={styles.iconList}>
                    {iconOptions.map((icon, index) => (
                      <TouchableOpacity
                        key={`icon-${index}-${icon}`}
                        style={[
                          styles.iconOption,
                          formIcon === icon && { backgroundColor: theme.primary }
                        ]}
                        onPress={() => setFormIcon(icon)}
                      >
                        <Text style={styles.iconText}>{icon}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.activeRow}>
                    <Text style={[styles.activeLabel, { color: theme.text }]}>Active</Text>
                    <Switch
                      value={formActive}
                      onValueChange={setFormActive}
                      trackColor={{ false: theme.inactive, true: theme.success }}
                      thumbColor="#fff"
                    />
                  </View>

                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={[styles.formCancel, { borderColor: theme.border }]}
                      onPress={() => setShowForm(false)}
                    >
                      <Text style={[styles.formCancelText, { color: theme.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formSave, { backgroundColor: theme.success }]}
                      onPress={handleSubmitForm}
                    >
                      <Text style={styles.formSaveText}>
                        {editingMode ? 'Update' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Payment Modes List */}
              <ScrollView style={styles.modeList}>
                {paymentModes.length === 0 ? (
                <View style={styles.emptyContainer}>
  <Ionicons name="card-outline" size={48} color={theme.textSecondary} />
  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
    No payment modes added. Click "Add Payment Mode" to create one.
  </Text>
</View>
                ) : (
                  paymentModes.map((mode, index) => (
                    <View 
                      key={`mode-${mode.id}-${index}`}
                      style={[styles.modeItem, { 
                        backgroundColor: theme.surface,
                        opacity: mode.isActive ? 1 : 0.6
                      }]}
                    >
                      <View style={styles.modeContent}>
                        <View style={styles.modeInfo}>
                          <Text style={styles.modeIcon}>{mode.icon}</Text>
                          <View>
                            <Text style={[styles.modeName, { color: theme.text }]}>{mode.name}</Text>
                            <Text style={[styles.modeDesc, { color: theme.textSecondary }]}>{mode.description}</Text>
                          </View>
                        </View>

                        <View style={styles.modeStatus}>
                          <Text style={[styles.statusText, { 
                            color: mode.isActive ? theme.success : theme.danger 
                          }]}>
                            {mode.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.modeActions}>
                        {/* Move Up/Down buttons */}
                        <View style={styles.moveButtons}>
                          <TouchableOpacity
                            style={[styles.moveBtn, { opacity: index === 0 ? 0.3 : 1 }]}
                            onPress={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            <Ionicons name="arrow-up" size={18} color={theme.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.moveBtn, { opacity: index === paymentModes.length - 1 ? 0.3 : 1 }]}
                            onPress={() => moveDown(index)}
                            disabled={index === paymentModes.length - 1}
                          >
                            <Ionicons name="arrow-down" size={18} color={theme.primary} />
                          </TouchableOpacity>
                        </View>

                        {/* Active Toggle */}
                        <TouchableOpacity
                          style={[styles.actionBtn, { 
                            backgroundColor: mode.isActive ? theme.success : theme.inactive 
                          }]}
                          onPress={() => toggleActive(mode.id)}
                        >
                          <Ionicons 
                            name={mode.isActive ? "eye" : "eye-off"} 
                            size={18} 
                            color="#fff" 
                          />
                        </TouchableOpacity>

                        {/* Edit Button */}
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                          onPress={() => openEditForm(mode)}
                        >
                          <Ionicons name="pencil" size={18} color="#fff" />
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: theme.danger }]}
                          onPress={() => deleteMode(mode.id)}
                        >
                          <Ionicons name="trash" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Save Button */}
              {paymentModes.length > 0 && (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={saveModes}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

        </View>
      </View>
    </Modal>
  );
};

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
    maxHeight: '80%',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 13,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 15,
  },
  iconList: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  iconText: {
    fontSize: 22,
  },
  activeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  formCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  formCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formSave: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  formSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modeList: {
    maxHeight: 400,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  modeItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  modeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modeIcon: {
    fontSize: 24,
  },
  modeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeDesc: {
    fontSize: 12,
  },
  modeStatus: {
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  moveBtn: {
    padding: 6,
    borderRadius: 4,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PayModeSettings;