// components/CompanySettingsForm.tsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator  // ✅ Add this for loading indicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BillPDFGenerator from './BillPDFGenerator';  // ✅ IMPORT this!

interface CompanySettings {
  name: string;
  address: string;
  gstNo: string;
  gstPercentage: number;
  phone: string;
  email: string;
  cashierName: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: CompanySettings) => void;
  theme: any;
  t: any;
  clientId?: string | number;
}

const CompanySettingsForm: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  theme,
  t,
  clientId
}) => {
  const [settings, setSettings] = useState<CompanySettings>({
    name: '',
    address: '',
    gstNo: '',
    gstPercentage: 0,
    phone: '',
    email: '',
    cashierName: ''
  });
  
  const [enableGST, setEnableGST] = useState(false);
  const [saving, setSaving] = useState(false);  // ✅ DECLARE setSaving here!

  useEffect(() => {
    if (visible) {
      loadClientSettings();
    }
  }, [visible, clientId]);

  const loadClientSettings = async () => {
    try {
      if (clientId) {
        // Try to load from database via BillPDFGenerator
        const savedSettings = await BillPDFGenerator.loadSettings(clientId);
        setSettings(savedSettings);
        setEnableGST(savedSettings.gstPercentage > 0);
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!settings.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }

    const finalSettings = {
      ...settings,
      gstPercentage: enableGST ? settings.gstPercentage : 0
    };

    setSaving(true);  // ✅ Now works!
    
    try {
      // ✅ Save to database via API
      const success = await BillPDFGenerator.saveSettings(finalSettings, clientId);
      
      if (success) {
        onSave(finalSettings);
        Alert.alert('✅ Success', 'Company settings saved!');
      } else {
        Alert.alert('❌ Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('❌ Error', 'Failed to save settings');
    } finally {
      setSaving(false);  // ✅ Now works!
    }
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
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>
              🏢 Company Settings
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            
            {/* Company Name */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Company Name *
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={settings.name}
              onChangeText={(text) => setSettings({...settings, name: text})}
              placeholder="Enter company name"
              placeholderTextColor={theme.textSecondary}
              editable={!saving}
            />

            {/* Address */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Address
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={settings.address}
              onChangeText={(text) => setSettings({...settings, address: text})}
              placeholder="Enter address"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              editable={!saving}
            />

            {/* GST Toggle */}
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.text }]}>
                Enable GST
              </Text>
              <Switch
                value={enableGST}
                onValueChange={setEnableGST}
                trackColor={{ false: theme.inactive, true: theme.primary }}
                thumbColor="#fff"
                disabled={saving}
              />
            </View>

            {enableGST && (
              <>
                {/* GST Number */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  GST Number
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  value={settings.gstNo}
                  onChangeText={(text) => setSettings({...settings, gstNo: text})}
                  placeholder="Enter GST number"
                  placeholderTextColor={theme.textSecondary}
                  editable={!saving}
                />

                {/* GST Percentage */}
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  GST Percentage (Total)
                </Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  value={settings.gstPercentage.toString()}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    setSettings({...settings, gstPercentage: num});
                  }}
                  placeholder="e.g., 5"
                  keyboardType="numeric"
                  placeholderTextColor={theme.textSecondary}
                  editable={!saving}
                />
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  (Split equally as CGST & SGST)
                </Text>
              </>
            )}

            {/* Phone */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Phone Number
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={settings.phone}
              onChangeText={(text) => setSettings({...settings, phone: text})}
              placeholder="Enter phone number"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              editable={!saving}
            />

            {/* Email */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Email
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={settings.email}
              onChangeText={(text) => setSettings({...settings, email: text})}
              placeholder="Enter email"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              editable={!saving}
            />

            {/* Cashier Name */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Default Cashier Name
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={settings.cashierName}
              onChangeText={(text) => setSettings({...settings, cashierName: text})}
              placeholder="Enter cashier name"
              placeholderTextColor={theme.textSecondary}
              editable={!saving}
            />

          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff' }]}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </View>

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
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    elevation: 2,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CompanySettingsForm;