// src/screens/PosScreen.tsx
import React, { useState, useMemo, useEffect, useCallback,useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Dimensions } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Printer from 'react-native-printer';

import API, { uploadAPI } from '../api';
import { useLicenseCheck } from '../hooks/useLicenseCheck';
import PrinterManager from '../components/PrinterManager';
 // ✅ Correct path
import { DishGroupManagement } from '../components/DishGroupManagement';
import { DishItemsManagement } from '../components/DishItemsManagement';
import { useLicenseTimer } from '../hooks/useLicenseTimer';
import BillPrompt from '../components/BillPrompt';
import UniversalPrinter from '../components/UniversalPrinter';
import CompanySettingsForm from '../components/CompanySettingsForm';
import POSSalesReport from '../components/POSSalesReport';
import PayModeSettings from '../components/PayModeSettings';
import BillPDFGenerator from '../components/BillPDFGenerator';  // ✅ ADD THIS
// Add these missing imports at the top with your other imports
import {
  TextInput,
  ActivityIndicator,
} from 'react-native';
// Import components
import { MenuGrid } from '../components/MenuGrid';
import { CartSection } from '../components/CartSection';
import { ProfileModal } from '../components/ProfileModal';

// Import constants and utils
import { themes } from '../utils/themes';
import { translations, dishNameTranslations } from '../utils/translations';

import { MenuItem } from '../types';
// Add this to track all API calls
interface PaymentMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
  order: number;
}
// SAFE PARSE HELPER - Use this EVERYWHERE
const safeJSONParse = (data: any): any => {
  if (!data) return null;
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log('Parse error, returning original:', data);
    return data;
  }
};
const { width } = Dimensions.get('window');

export default function PosScreen() {
  const { theme: savedTheme, language: savedLanguage, setTheme: setSettingsTheme, setLanguage: setSettingsLanguage } = useSettings();
  const insets = useSafeAreaInsets();
    useLicenseCheck();
  const { user, logout } = useAuth();

  const validLanguage = savedLanguage && translations[savedLanguage] ? savedLanguage : 'en';
  
  const [theme, setTheme] = useState<string>(savedTheme || 'light');
  const [language, setLanguage] = useState<string>(validLanguage);
  const [prevLanguage, setPrevLanguage] = useState<string>('en');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<string>('theme');
  const [profileMode, setProfileMode] = useState<string>('full');
  const [showHomeMenu, setShowHomeMenu] = useState<boolean>(false);
 const [state, setState] = useState<any[]>([]); 



  const [summary, setSummary] = useState({
  totalSales: 0,
  totalRevenue: 0,
  totalItems: 0,
  paymentBreakdown: {}
});
  const currentTheme = themes[theme] || themes.light;
  const t = translations[language] || translations.en;
  
 const [categories, setCategories] = useState<string[]>([]);
  const companyLogo = require('../../assets/images/unipro-logo-white.png');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(8);
  const { licenseInfo, timeLeft, setIsVisible } = useLicenseTimer();
  const [isMobile, setIsMobile] = useState<boolean>(width < 768);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string>('main');
  const [loadingModes, setLoadingModes] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [balanceAmount, setBalanceAmount] = useState<number>(0);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [showSalesReport, setShowSalesReport] = useState<boolean>(false);
  const [selectedSalesFilter, setSelectedSalesFilter] = useState<string>('today');
  const [startDate, setStartDate] = useState<Date>(new Date());
const [endDate, setEndDate] = useState<Date>(new Date());
const [showPicker, setShowPicker] = useState<boolean>(false);
const [pickerType, setPickerType] = useState<'start' | 'end'>('start');
const [tempDate, setTempDate] = useState<Date>(new Date());
const tempDateRef = useRef<Date>(new Date());
const timeLeftRef = useRef({ days: 0, hours: 0, minutes: 0, seconds: 0 });
const [showPayModeSettings, setShowPayModeSettings] = useState(false);
const [showBillPrompt, setShowBillPrompt] = useState(false);
const [showCompanySettings, setShowCompanySettings] = useState(false);
const [pendingSaleData, setPendingSaleData] = useState<any>(null);
const [userPaymentModes, setUserPaymentModes] = useState<PaymentMode[]>([]);
const [selectedBillStyle, setSelectedBillStyle] = useState<string>('professional');
const [showStyleSelector, setShowStyleSelector] = useState<boolean>(false);

// ===== SIMPLE HANDLERS =====
const openStartPicker = () => {
  setPickerType('start');
  setTempDate(startDate);
  tempDateRef.current = startDate;
  setShowPicker(true);
};

const openEndPicker = () => {
  setPickerType('end');
  setTempDate(endDate);
  tempDateRef.current = endDate;
  setShowPicker(true);
};
const loadPaymentModes = async () => {
  try {
    const response = await API.get(`/user/payment-modes/${user?.id}`);
    console.log('📥 Loaded payment modes:', response.data);
    
    const modes = response.data.paymentModes || [];
    setUserPaymentModes(modes);
  } catch (error) {
    console.error('Error loading payment modes:', error);
  }
};
useEffect(() => {
  // code
}, []);
// Call this when component mounts and after save
useEffect(() => {
  if (user?.id) {
    loadPaymentModes();
  }
}, [user?.id]);
const handlePaymentModesUpdate = (modes: PaymentMode[]) => {
  console.log('🔄 Updating payment modes:', modes);
  setUserPaymentModes(modes);
   loadPaymentModes();
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
const onDateChange = (event: any, selectedDate?: Date) => {
  if (event.type === 'set' && selectedDate) {
    if (pickerType === 'start') {
      console.log('📅 Start date selected:', selectedDate);
      setStartDate(selectedDate);
      tempDateRef.current = selectedDate;
    } else {
      console.log('📅 End date selected:', selectedDate);
      setEndDate(selectedDate);
      tempDateRef.current = selectedDate;
    }
  }
  setShowPicker(false);
};
  
 const [dishGroups, setDishGroups] = useState<any[]>([]);
  
  const [showAddGroup, setShowAddGroup] = useState<boolean>(false);
  const [showEditGroup, setShowEditGroup] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [showAddDish, setShowAddDish] = useState<boolean>(false);
  const [showEditDish, setShowEditDish] = useState<boolean>(false);
  const [editingDish, setEditingDish] = useState<any>(null);
  const [newDish, setNewDish] = useState<any>({
    name: '',
    price: '',
    category: categories[0],
    imageUri: null,
  });
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [cart, setCart] = useState<any[]>([]);

  // Helper functions
  // Helper function to translate category names (both ways)
const translateCategory = (categoryName: string, targetLang: string): string => {
  if (targetLang === 'en') return categoryName;
  
  // Map of English to Tamil translations
  const translationMap: Record<string, string> = {
    'Maja': translations[targetLang]?.maja || 'Maja',
    'Appetiser': translations[targetLang]?.appetiser || 'Appetiser',
    'Main Course': translations[targetLang]?.mainCourse || 'Main Course',
    'Hot Drinks': translations[targetLang]?.hotDrinks || 'Hot Drinks',
    'Desserts': translations[targetLang]?.desserts || 'Desserts',
  };
  
  return translationMap[categoryName] || categoryName;
};
  const translateDishName = (englishName: string, lang: string): string => {
    if (lang === 'en') return englishName;
    return dishNameTranslations[lang]?.[englishName] || englishName;
  };
  // Add this useEffect to monitor temp date changes




useEffect(() => {
  console.log('📅 startDate changed to:', startDate);
}, [startDate]);

useEffect(() => {
  console.log('📅 endDate changed to:', endDate);
}, [endDate]);

 const [menuItems, setMenuItems] = useState<any[]>([]); // Start empty
  // ============ LICENSE COUNTDOWN (Keep but optimize) ============

  // ============ API FUNCTIONS ============
  // Add ALL these functions HERE ⬇️

  // Load dish groups from database
// In PosScreen.tsx, find where categories are set from dishGroups

// When loading dish groups
const loadDishGroups = async () => {
  try {
    const response = await API.get('/dishgroups');
    console.log('📦 Raw dishGroups response:', response.data);
    
    const groups = response.data.map((group: any) => ({
      id: group.Id,
      name: group.Name,
      itemCount: group.ItemCount,
      active: group.active
    }));
    
    console.log('📋 Processed dishGroups:', groups);
    
    setDishGroups(groups);
    
    // Only show active categories in POS
    const activeGroups = groups.filter(g => g.active !== false);
    const activeGroupNames = activeGroups.map(g => g.name);
    setCategories(activeGroupNames);
    
    console.log('✅ Active categories:', activeGroupNames);
    
    if (activeGroupNames.length > 0 && !activeGroupNames.includes(activeCategory)) {
      setActiveCategory(activeGroupNames[0]);
    }
    
  } catch (error) {
    console.error('Error loading dish groups:', error);
    Alert.alert(t.error, 'Failed to load dish groups');
  }
};
useEffect(() => {
  // Update categories based on active dish groups
  const activeGroups = dishGroups.filter(g => g.active !== false);
  const activeGroupNames = activeGroups.map(g => g.name);
  
  // Only update if different
  if (JSON.stringify(activeGroupNames) !== JSON.stringify(categories)) {
    setCategories(activeGroupNames);
    
    // Update active category if current one is inactive
    if (activeGroupNames.length > 0 && !activeGroupNames.includes(activeCategory)) {
      setActiveCategory(activeGroupNames[0]);
    }
  }
}, [dishGroups]);

  // Load dish items from database
 // Load dish items from database
const loadDishItems = async () => {
  try {
    const response = await API.get('/dishitems');
    console.log('Raw items response:', response.data);
    
    const items = (response.data || []).map((item: any) => ({
      id: item.Id || item.id,
      name: item.Name || item.name,
      price: parseFloat(item.Price || item.price || 0),
      category: item.CategoryId?.toString() || item.category,
      imageUri: item.imageUri || item.ImageUrl 
        ? `http://192.168.0.169:5000${item.imageUri || item.ImageUrl}`
        : null,
      originalName: item.OriginalName || item.originalName || item.name,
      originalCategory: item.OriginalCategory || item.originalCategory,
      displayCategory: item.DisplayCategory || item.displayCategory,
      // ✅ Make sure category is set correctly
      categoryName: item.categoryName || item.CategoryName,
    }));
    
    console.log('📊 Items with categories:', items.map(i => ({
      name: i.name,
      category: i.category,
      categoryName: i.categoryName,
      displayCategory: i.displayCategory
    })));
    
    setMenuItems(items);
    
    // ✅ Update dish group counts based on actual items
    const counts: Record<string, number> = {};
    items.forEach((item: any) => {
      const categoryId = item.category;
      counts[categoryId] = (counts[categoryId] || 0) + 1;
    });
    
    console.log('📊 Category counts:', counts);
    
    // Update dishGroups with correct counts
    setDishGroups(prev => prev.map(group => ({
      ...group,
      itemCount: counts[group.id?.toString()] || 0
    })));
    
  } catch (error) {
    console.error('Error loading dish items:', error);
    Alert.alert(t.error, 'Failed to load dish items');
  }
};

  // Helper function to get category ID
  // Helper function to get category ID
const getCategoryIdByName = (categoryName: string): number => {
  console.log('🔍 Finding category for name:', categoryName);
  console.log('🔍 Available dishGroups:', dishGroups);
  
  if (!dishGroups || dishGroups.length === 0) {
    console.log('⚠️ No dish groups available');
    return 1; // Default fallback
  }
  
 const category = dishGroups.find(g => 
  g.name === categoryName  // Use the parameter passed to function
);
  
  console.log('🔍 Found category:', category);
  
  if (!category) {
    console.log('⚠️ Category not found, using first available');
    return dishGroups[0]?.id || 1;
  }
  
  return category.id;
};

// Helper function to get English category name
const getEnglishCategory = (categoryName: string): string => {
  // Reverse mapping from Tamil to English
  if (!t) return categoryName;
  
  const reverseMap: Record<string, string> = {
    [t.maja || 'Maja']: 'Maja',
    [t.appetiser || 'Appetiser']: 'Appetiser',
    [t.mainCourse || 'Main Course']: 'Main Course',
    [t.hotDrinks || 'Hot Drinks']: 'Hot Drinks',
    [t.desserts || 'Desserts']: 'Desserts',
  };
  
  return reverseMap[categoryName] || categoryName;
};
  // Settings functions
  const loadSettings = async (): Promise<void> => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedLanguage = await AsyncStorage.getItem('language');
      
      if (savedTheme) setTheme(savedTheme);
      if (savedLanguage && translations[savedLanguage]) setLanguage(savedLanguage);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleThemeChange = async (newTheme: string): Promise<void> => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
    await setSettingsTheme(newTheme);
  };

  const handleLanguageChange = async (newLanguage: string): Promise<void> => {
    if (!translations[newLanguage]) {
      console.error('Invalid language:', newLanguage);
      return;
    }
    setPrevLanguage(language);
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    await setSettingsLanguage(newLanguage);
  };

  useEffect(() => {
    loadSettings();
    loadDishGroups();
  loadDishItems();
  }, []);

  useEffect(() => {
  if (!t) return;
  
  console.log('🔄 Language changed to:', language);
  console.log('📦 Current dishGroups:', dishGroups);
  
  // ✅ ONLY translate if we have existing dishGroups
  if (dishGroups.length > 0) {
    // Just translate the names, don't create new categories
    setDishGroups(prev => prev.map(group => ({
      ...group,
      name: translateCategory(group.name, language)  // Translate existing names
    })));
    
    // Update categories array from translated dishGroups
    const translatedCategories = dishGroups.map(g => translateCategory(g.name, language));
    setCategories(translatedCategories);
  }
  
  // ✅ Translate menu items
  setMenuItems(prev => prev.map(item => ({
    ...item,
    name: translateDishName(item.originalName, language),
    displayCategory: translateCategory(item.originalCategory, language),
  })));
  
  // ✅ Translate cart items
  setCart(prev => prev.map(item => {
    const menuItem = menuItems.find(m => m.id === item.id);
    if (menuItem) {
      return {
        ...item,
        name: translateDishName(menuItem.originalName, language),
      };
    }
    return item;
  }));
  
  // ✅ Update active category if needed
  if (activeCategory && categories.length > 0) {
    const oldIndex = categories.findIndex(c => c === activeCategory);
    if (oldIndex !== -1 && dishGroups[oldIndex]) {
      setActiveCategory(translateCategory(dishGroups[oldIndex].name, language));
    }
  }
  
  setPrevLanguage(language);
}, [language]);
  // UI Handlers
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsMobile(window.width < 768);
    });
    return () => subscription?.remove();
  }, []);
useEffect(() => {
    const checkLicense = async () => {
        try {
            const response = await API.get('/license/status');
            const expiryDate = new Date(response.data.ExpiryDate);
            
            if (expiryDate < new Date()) {
                Alert.alert(
                    'License Expired',
                    'Your license has expired. Please contact admin.',
                    [
                        { 
                            text: 'OK', 
                            onPress: () => logout() 
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('License check failed:', error);
        }
    };
    
    checkLicense();
    
    // Check every minute
    const interval = setInterval(checkLicense, 60 * 1000);
    return () => clearInterval(interval);
}, []);
  useEffect(() => {
    if (!categories.includes(activeCategory) && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

const categoryItems = useMemo(() => {
  if (!t || !activeCategory) return [];
  
  // ✅ Filter based on displayCategory (translated)
  return menuItems.filter(item => 
    item.displayCategory === activeCategory
  );
}, [activeCategory, menuItems, language]);

  const totalPages = Math.ceil(categoryItems.length / itemsPerPage);
  
  const currentItems = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return categoryItems.slice(startIndex, endIndex);
}, [categoryItems, currentPage, itemsPerPage]);

  const handleCategoryChange = (category: string): void => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const nextPage = (): void => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = (): void => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const calculateTotal = (): string => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const addToCart = (item: any): void => {
    setCart(prevCart => {
      const existing = prevCart.find((i: any) => i.id === item.id);
      if (existing) {
        return prevCart.map((i: any) => i.id === item.id ? {...i, quantity: i.quantity + 1} : i);
      }
      return [...prevCart, {...item, quantity: 1}];
    });
  };

  const increaseQuantity = (itemId: number): void => {
    setCart(cart.map(item => 
      item.id === itemId 
        ? {...item, quantity: item.quantity + 1} 
        : item
    ));
  };
  
  const decreaseQuantity = (itemId: number): void => {
    const item = cart.find(item => item.id === itemId);
    if (item && item.quantity === 1) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId 
          ? {...item, quantity: item.quantity - 1} 
          : item
      ));
    }
  };

  const removeItem = (itemId: number): void => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleCheckout = (): void => {
    if (cart.length === 0) {
      Alert.alert(t.cartEmpty, t.tapToAdd);
      return;
    }
    setShowPaymentModal(true);
  };

// Update handlePaymentSelect
// In PosScreen.tsx, update handlePaymentSelect function

const handlePaymentSelect = async (payment: any): Promise<void> => {
  const totalAmount = parseFloat(calculateTotal());
  
  if (payment.name === t.cash) {
    setShowPaymentModal(false);
    setShowCashModal(true);
    setCashAmount('');
    setBalanceAmount(0);
    return;
  }
  
  setProcessingPayment(true);
  setProcessingPaymentId(payment.id);
  setSelectedPayment(payment);
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const saleData = {
      total: totalAmount,
      paymentMethod: payment.name,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      cashier: user?.username || 'Admin'
    };
    
    const response = await API.post('/sales', saleData);
    
    const newSale = {
      id: response.data.id || response.data.Id,
      total: response.data.total || response.data.Total,
      paymentMethod: response.data.paymentMethod || response.data.PaymentMethod,
      date: response.data.date || response.data.SaleDate,
      items: response.data.items || response.data.ItemsJson || []
    };
    
    setSalesHistory(prev => [newSale, ...prev]);
    
    setPaymentSuccess(true);
    
    setTimeout(() => {
      setPaymentSuccess(false);
      setShowPaymentModal(false);
      setProcessingPayment(false);
      setProcessingPaymentId(null);
      setSelectedPayment(null);
      
      // ✅ Show Bill Prompt
      setPendingSaleData({
        ...saleData,
        id: newSale.id
      });
      setShowBillPrompt(true);
      
    }, 1500);
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    Alert.alert('Error', 'Payment failed');
    setProcessingPayment(false);
    setProcessingPaymentId(null);
  }
};
// Handle Print Bill
// In PosScreen.tsx - Add this function if not exists
// Add with other functions
// In PosScreen.tsx - Update handlePrintBill

const handlePrintBill = async () => {
  if (!pendingSaleData || !user?.id) return;
  
  // Use PrinterManager for complete flow
  await PrinterManager.handleBillPrint(
    pendingSaleData, 
    user.id,
    () => {
      // On complete - clear cart and close
      setShowBillPrompt(false);
      setPendingSaleData(null);
      setCart([]);
    }
  );
};

// Keep skip handler same
const handleSkipBill = () => {
  setShowBillPrompt(false);
  setPendingSaleData(null);
  setCart([]);
  Alert.alert('✅ Success', 'Transaction completed!');
};
const handleCashPayment = async (): Promise<void> => {
  const totalAmount = parseFloat(calculateTotal());
  const cashPaid = parseFloat(cashAmount);
  
  if (!cashAmount || isNaN(cashPaid)) {
    Alert.alert(t.error, 'Please enter cash amount');
    return;
  }
  
  if (cashPaid < totalAmount) {
    Alert.alert(t.insufficientCash, `${t.insufficientCash} $${calculateTotal()}`);
    return;
  }
  
  const balance = cashPaid - totalAmount;
  setBalanceAmount(balance);
  
  setSelectedPayment({ id: 1, name: t.cash, icon: '💰', description: t.payWithCash });
  setPaymentSuccess(true);
  
  try {
    const saleData = {
      total: totalAmount,
      paymentMethod: t.cash,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      change: balance,
      cashier: user?.username || 'Admin'
    };

    const response = await API.post('/sales', saleData);
    console.log('✅ Sale saved:', response.data);
    
    const newSale = {
      id: response.data.id || response.data.Id,
      total: response.data.total || response.data.Total || 0,
      paymentMethod: response.data.paymentMethod || response.data.PaymentMethod || '',
      date: response.data.date || response.data.SaleDate || new Date(),
      items: response.data.items || response.data.ItemsJson || [],
      change: balance
    };
    
    setSalesHistory(prev => [newSale, ...prev]);
    
    // ✅ Show Bill Prompt
    setTimeout(() => {
      setPaymentSuccess(false);
      setShowCashModal(false);
      setSelectedPayment(null);
      setCashAmount('');
      
      // Store sale data and show prompt
    setPendingSaleData({
    ...saleData,
    id: newSale.id,
    change: balance,
    userId: user?.id  // Add userId
  });
      setShowBillPrompt(true);
      
    }, 1500);
    
  } catch (error: any) {
    console.error('❌ Error:', error);
    Alert.alert('Error', 'Payment failed');
  }
};
const loadSalesSummary = useCallback(async () => {
  try {
    let url = '/sales/summary';
    
    if (selectedSalesFilter === 'custom') {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      url += `?filter=custom&startDate=${start}&endDate=${end}`;
    } else {
      url += `?filter=${selectedSalesFilter}`;
    }
    
    console.log('📊 Loading summary:', url);
    const response = await API.get(url);
    setSummary(response.data);
  } catch (error) {
    console.error('❌ Error loading summary:', error);
  }
}, [selectedSalesFilter, startDate, endDate]);
const setStartDateWrapper = useCallback((date: Date) => {
  setStartDate(date);
}, []);

const setEndDateWrapper = useCallback((date: Date) => {
  setEndDate(date);
}, []);
// Make sure this function is in your component
const loadSalesData = useCallback(async () => {
  try {
    let url = '/sales';
    
    if (selectedSalesFilter === 'custom') {
      // ✅ FIX: Create stable date strings
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      url += `?filter=custom&startDate=${start}&endDate=${end}`;
      console.log('📊 Loading custom sales:', start, 'to', end);
    } else {
      url += `?filter=${selectedSalesFilter}`;
    }
    
    const response = await API.get(url);
    const salesData = Array.isArray(response.data) ? response.data : [];
    
    const formattedSales = salesData.map(sale => ({
      id: sale.id || sale.Id,
      total: sale.total || sale.Total || 0,
      paymentMethod: sale.paymentMethod || sale.PaymentMethod || '',
      date: sale.date || sale.SaleDate || new Date(),
      items: sale.items || sale.ItemsJson || []
    }));
    
    setSalesHistory(formattedSales);
  } catch (error) {
    console.error('❌ Error loading sales:', error);
  }
}, [selectedSalesFilter, startDate, endDate]); // ✅ Proper deps

useEffect(() => {
  if (showSalesReport) {
    console.log('📊 Sales report opened, loading data...');
    loadSalesData();
    loadSalesSummary();
  }
}, [showSalesReport, selectedSalesFilter, startDate, endDate]);

  // Sales Report Functions
  const getFilteredSales = () => {
  return salesHistory; // Now salesHistory comes from database
};


  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

 useEffect(() => {
    console.log('🔄 Menu visibility changed:', menuVisible, showSalesReport);
    setIsVisible(menuVisible || showSalesReport);
  }, [menuVisible, showSalesReport]);

// Keep everything else the same

const validateDates = (start: Date, end: Date): boolean => {
  if (start > end) {
    Alert.alert('Error', 'Start date cannot be after end date');
    return false;
  }
  return true;
};

const applyCustomFilter = useCallback(() => {
  if (!validateDates(startDate, endDate)) {
    return;
  }
  
  console.log('📊 Applying custom filter:', {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  });
  setSelectedSalesFilter('custom');
  loadSalesData();
  loadSalesSummary();
}, [loadSalesData, loadSalesSummary]);


  const pickImage = async (setter: (uri: string) => void): Promise<void> => {
    try {
      setImageUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setter(result.assets[0].uri);
        Alert.alert(t.success, t.imageSelected);
      }
    } catch (error) {
      Alert.alert(t.error, 'Failed to pick image');
    } finally {
      setImageUploading(false);
    }
  };

  const captureImage = async (setter: (uri: string) => void): Promise<void> => {
    try {
      setImageUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setter(result.assets[0].uri);
        Alert.alert(t.success, t.photoCaptured);
      }
    } catch (error) {
      Alert.alert(t.error, 'Failed to capture image');
    } finally {
      setImageUploading(false);
    }
  };

  // Payment Options
const paymentOptions = useMemo(() => {
  console.log('💰 Current userPaymentModes:', userPaymentModes); // Debug
  
  // Filter only active modes
  const activeModes = userPaymentModes.filter(mode => mode.isActive === true);
  
  console.log('✅ Active modes:', activeModes); // Debug
  
  // Sort by order
  const sortedModes = activeModes.sort((a, b) => a.order - b.order);
  
  // Map to the format needed for display
  return sortedModes.map(mode => ({
    id: mode.id,
    name: mode.name,
    icon: mode.icon,
    description: mode.description
  }));
}, [userPaymentModes]);

  // Dish Group Functions
 const handleAddGroup = async (): Promise<void> => {
  if (newGroupName.trim()) {
    try {
      const response = await API.post('/dishgroups', {
        name: newGroupName,
        active: true
      });
      
      const newGroup = {
        id: response.data.Id,
        name: response.data.Name,
        itemCount: 0,
        active: response.data.active,
      };
      
      // Update dish groups
      const updatedGroups = [...dishGroups, newGroup];
      setDishGroups(updatedGroups);
      
      // ✅ Update categories
      const updatedCategories = [...categories, newGroupName];
      setCategories(updatedCategories);
      
      setNewGroupName('');
      setShowAddGroup(false);
      
      Alert.alert(t.success, `${newGroupName} ${t.addSuccess}`);
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert(t.error, 'Failed to add dish group');
    }
  }
};

  const handleEditGroup = (): void => {
    if (editingGroup && newGroupName.trim()) {
      const oldName = editingGroup.name;
      const updatedGroups = dishGroups.map(group => 
        group.id === editingGroup.id 
          ? {...group, name: newGroupName} 
          : group
      );
      
      const updatedCategories = categories.map(cat => 
        cat === oldName ? newGroupName : cat
      );
      
      const updatedMenuItems = menuItems.map(item => 
        item.category === oldName 
          ? {...item, category: newGroupName} 
          : item
      );
      
      setDishGroups(updatedGroups);
      setCategories(updatedCategories);
      setMenuItems(updatedMenuItems);
      
      if (activeCategory === oldName) {
        setActiveCategory(newGroupName);
      }
      
      setEditingGroup(null);
      setNewGroupName('');
      setShowEditGroup(false);
      Alert.alert(t.success, `${newGroupName} ${t.updateSuccess}`);
    }
  };

  const handleDeleteGroup = (group: any): void => {
    Alert.alert(
      t.delete,
      `${t.confirmDelete} "${group.name}"? ${t.thisWillDelete}`,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: () => {
            const updatedGroups = dishGroups.filter(g => g.id !== group.id);
            const updatedCategories = categories.filter(cat => cat !== group.name);
            const updatedMenuItems = menuItems.filter(item => item.category !== group.name);
            
            setDishGroups(updatedGroups);
            setCategories(updatedCategories);
            setMenuItems(updatedMenuItems);
            
            if (activeCategory === group.name && updatedCategories.length > 0) {
              setActiveCategory(updatedCategories[0]);
            }
            
            Alert.alert(t.success, `${group.name} ${t.deleteSuccess}`);
          }
        }
      ]
    );
  };

 // Modify handleAddDish to save to database with image
// Modify handleAddDish to save to database with image
const handleAddDish = async (): Promise<void> => {
  console.log('Adding dish:', newDish);
  
  if (!newDish.name || !newDish.name.trim()) {
    Alert.alert(t.error, 'Please enter dish name');
    return;
  }
  
  if (!newDish.price || isNaN(parseFloat(newDish.price)) || parseFloat(newDish.price) <= 0) {
    Alert.alert(t.error, 'Please enter valid price');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('name', newDish.name.trim());
    formData.append('price', parseFloat(newDish.price).toString());
    
    const categoryId = getCategoryIdByName(newDish.category);
    console.log('Category:', newDish.category, 'ID:', categoryId);
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
    
    console.log('Sending to server...');
    const response = await uploadAPI.post('/dishitems', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Response:', response.data);
    
    // ✅ FIX: Create full image URL
    const imageUrl = response.data.imageUri || response.data.ImageUrl
      ? `http://192.168.0.169:5000${response.data.imageUri || response.data.ImageUrl}`
      : null;
    
    const newItem = {
      id: response.data.Id || response.data.id,
      name: response.data.Name || response.data.name,
      price: parseFloat(response.data.Price || response.data.price || newDish.price),
      category: response.data.CategoryId?.toString() || categoryId.toString(),
      imageUri: imageUrl,
      originalName: response.data.OriginalName || newDish.name,
      originalCategory: response.data.OriginalCategory || englishCategory,
      displayCategory: response.data.DisplayCategory || newDish.category,
    };
    
    console.log('New item to add:', newItem);
    
    setMenuItems([...menuItems, newItem]);
    
      setDishGroups(prev => prev.map(group =>
    group.name === newDish.category
      ? { ...group, itemCount: (group.itemCount || 0) + 1 }
      : group
  ));
    
    setNewDish({ 
      name: '', 
      price: '', 
      category: categories[0],
      imageUri: null,
    });
    setShowAddDish(false);
    
    Alert.alert(t.success, `${newDish.name} ${t.addSuccess}`);
  } catch (error) {
    console.error('Error adding dish:', error);
    Alert.alert(t.error, 'Failed to add dish item: ' + (error as any).message);
  }
};

  const handleEditDish = (): void => {
    if (editingDish && newDish.name && newDish.price) {
      const oldEnglishCategory = editingDish.originalCategory || editingDish.category;
      
      const newEnglishCategory = (() => {
        if (newDish.category === t.appetiser) return 'Appetiser';
        if (newDish.category === t.mainCourse) return 'Main Course';
        if (newDish.category === t.hotDrinks) return 'Hot Drinks';
        if (newDish.category === t.desserts) return 'Desserts';
        return newDish.category;
      })();
      
      const updatedMenuItems = menuItems.map((item: any) => 
        item.id === editingDish.id 
          ? {
              ...item,
              originalName: newDish.name,
              name: newDish.name,
              category: newEnglishCategory,
              originalCategory: newEnglishCategory,
              displayCategory: newDish.category,
              price: parseFloat(newDish.price),
              imageUri: newDish.imageUri,
            }
          : item
      );
      
      setMenuItems(updatedMenuItems);
      
      if (oldEnglishCategory !== newEnglishCategory) {
        setDishGroups(dishGroups.map(group => {
          if (group.name === editingDish.displayCategory || group.name === editingDish.category) {
            return {...group, itemCount: Math.max(0, group.itemCount - 1)};
          }
          if (group.name === newDish.category) {
            return {...group, itemCount: group.itemCount + 1};
          }
          return group;
        }));
      }
      
      setEditingDish(null);
      setNewDish({ name: '', price: '', category: categories[0], imageUri: null });
      setShowEditDish(false);
      Alert.alert(t.success, `${newDish.name} ${t.updateSuccess}`);
    }
  };

  const handleDeleteDish = (dish: any): void => {
    Alert.alert(
      t.delete,
      `${t.confirmDelete} "${dish.name}"?`,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: () => {
            const updatedMenuItems = menuItems.filter((item: any) => item.id !== dish.id);
            setMenuItems(updatedMenuItems);
            
            setDishGroups(dishGroups.map(group => 
              group.name === dish.category 
                ? {...group, itemCount: Math.max(0, group.itemCount - 1)} 
                : group
            ));
            
            setCart(cart.filter((item: any) => item.id !== dish.id));
            
            Alert.alert(t.success, `${dish.name} ${t.deleteSuccess}`);
          }
        }
      ]
    );
  };

  const total = calculateTotal();

  // Render Functions
  const renderDishGroupManagement = () => (
  <DishGroupManagement
    dishGroups={dishGroups}
    setDishGroups={setDishGroups}
    categories={categories}
    setCategories={setCategories}
    setActiveCategory={setActiveCategory}
    currentTheme={currentTheme}
    t={t}
    onGroupUpdate={() => {
      loadDishGroups();
      loadDishItems();
    }}
  />
);


 const renderDishItemsManagement = () => (
  <DishItemsManagement
    menuItems={menuItems}
    setMenuItems={setMenuItems}
    categories={categories}
    dishGroups={dishGroups}
    setDishGroups={setDishGroups}
    currentTheme={currentTheme}
    t={t}
    onItemUpdate={() => {
      loadDishGroups();
      loadDishItems();
    }}
    imageUploading={imageUploading}
    setImageUploading={setImageUploading}
    pickImage={pickImage}
    captureImage={captureImage}
  />
);


 const renderMainMenu = () => (
  <View style={[styles.menuContent, { backgroundColor: currentTheme.background }]}>
  
    <TouchableOpacity 
      style={[styles.backToMainBtn, { backgroundColor: currentTheme.primary }]}
      onPress={() => {
        setMenuVisible(false);
        setActiveMenu('main');
      }}
    >
      <Text style={styles.backToMainBtnText}>{t.backToMain}</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.menuItemBtn, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
      onPress={() => setActiveMenu('dishgroup')}
    >
      <Text style={[styles.menuItemBtnText, { color: currentTheme.text }]}>{t.dishGroup}</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.menuItemBtn, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}
      onPress={() => setActiveMenu('dishitems')}
    >
      <Text style={[styles.menuItemBtnText, { color: currentTheme.text }]}>{t.dishItems}</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.menuItemBtn, styles.salesReportBtn, { backgroundColor: currentTheme.secondary }]}
      onPress={() => {
        setMenuVisible(false);
        setShowSalesReport(true);
      }}
    >
      <Text style={styles.menuItemBtnText}>{t.salesReport}</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.menuItemBtn, { 
        backgroundColor: currentTheme.secondary,
        borderColor: currentTheme.border,
        marginTop: 10
      }]}
      onPress={() => {
        setMenuVisible(false);
        setShowCompanySettings(true);
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="business-outline" size={20} color="#fff" />
        <Text style={[styles.menuItemBtnText, { color: '#fff', marginLeft: 8 }]}>
          Company Settings
        </Text>
      </View>
    </TouchableOpacity>
 
    {/* Payment Settings Button */}
    <TouchableOpacity 
      style={[styles.menuItemBtn, { 
        backgroundColor: currentTheme.secondary,
        borderColor: currentTheme.border,
        marginTop: 10
      }]}
      onPress={() => {
        setMenuVisible(false);
        setShowPayModeSettings(true);
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="settings-outline" size={20} color="#fff" />
        <Text style={[styles.menuItemBtnText, { color: '#fff', marginLeft: 8 }]}>
          Payment Modes
        </Text>
      </View>
    </TouchableOpacity>

    {/* BOTTOM COMPANY INFO - ALL TEXT IN <Text> */}
    <View style={[styles.bottomInfo, { borderTopColor: currentTheme.border }]}>
      
      {/* Shop Name */}
      <View style={styles.bottomRow}>
        <Text style={[styles.bottomShopName, { color: currentTheme.text }]}>
          {user?.shopName || 'POS System'}
        </Text>
      </View>

      {/* License Key */}
      <View style={styles.bottomRow}>
        <Text style={[styles.bottomLabel, { color: currentTheme.textSecondary }]}>
          {t.licenseKey || 'License'}:
        </Text>
        <Text style={[styles.bottomValue, { color: currentTheme.primary }]}>
          {licenseInfo?.LicenseKey || 'N/A'}
        </Text>
      </View>

      {/* Expiry Date */}
      <View style={styles.bottomRow}>
        <Text style={[styles.bottomLabel, { color: currentTheme.textSecondary }]}>
          {t.expiresOn || 'Expires'}:
        </Text>
        <Text style={[styles.bottomValue, { color: currentTheme.text }]}>
          {licenseInfo?.ExpiryDate 
            ? licenseInfo.ExpiryDate.substring(0, 10).split('-').reverse().join('/') 
            : 'N/A'}
        </Text>
      </View>

      {/* Countdown Timer */}
      <View style={[styles.countdownBox, { backgroundColor: currentTheme.surface }]}>
        <Text style={[styles.countdownLabel, { color: currentTheme.textSecondary }]}>
          ⏱️ {t.timeLeft || 'Time Left'}:
        </Text>
        <Text style={[styles.countdownTimer, { color: currentTheme.primary }]}>
          {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : 
          {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.companyDivider, { backgroundColor: currentTheme.border }]} />

      {/* Company Logo and Name */}
      <View style={styles.companyHeader}>
        <View style={[styles.companyLogoContainer, { backgroundColor: currentTheme.surface }]}>
          <Image 
            source={companyLogo}
            style={styles.companyLogoImage}
            resizeMode="contain"
            onError={(error) => console.log('Logo load error:', error)}
          />
        </View>
        <Text style={[styles.companyName, { color: currentTheme.text }]}>
          UNIPRO SOFTWARES SG PTE LTD
        </Text>
      </View>

      {/* Copyright */}
      <Text style={[styles.copyright, { color: currentTheme.textSecondary }]}>
        Copyright © 2026 - 2027 UNIPRO SOFTWARES SG PTE LTD. All rights Reserved.
      </Text>
    </View>
  </View>
);

// In PosScreen.tsx - Replace your renderPaymentModal with this

const renderPaymentModal = () => (
  <Modal
    visible={showPaymentModal}
    transparent={true}
    animationType="slide"
    onRequestClose={() => {
      if (!processingPayment) {
        setShowPaymentModal(false);
      }
    }}
  >
    <View style={styles.paymentModalOverlay}>
      <View style={[styles.paymentModalContent, isMobile && styles.paymentModalContentMobile, { backgroundColor: currentTheme.card }]}>
        
        {/* Header */}
        <View style={styles.paymentModalHeader}>
          <Text style={[styles.paymentModalTitle, { color: currentTheme.text }]}>
            {processingPayment ? 'Processing Payment' : t.selectPaymentMethod}
          </Text>
          <TouchableOpacity 
            style={styles.paymentModalClose}
            onPress={() => {
              if (!processingPayment) {
                setShowPaymentModal(false);
              }
            }}
          >
            <Text style={[styles.paymentModalCloseText, { color: currentTheme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={[styles.paymentAmountContainer, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.paymentAmountLabel, { color: currentTheme.textSecondary }]}>
            {t.totalAmount}
          </Text>
          <Text style={[styles.paymentAmountValue, { color: currentTheme.primary }]}>
            ${total}
          </Text>
        </View>

        {/* Loading or Payment Options */}
        {processingPayment ? (
          <View style={styles.paymentSuccessContainer}>
            <ActivityIndicator size="large" color={currentTheme.primary} />
            <Text style={[styles.processingText, { color: currentTheme.text }]}>
              Processing {selectedPayment?.name} payment...
            </Text>
            <Text style={[styles.processingSubText, { color: currentTheme.textSecondary }]}>
              Please wait
            </Text>
          </View>
        ) : (
          <>
            {/* Payment Options */}
            {paymentOptions.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {paymentOptions.map((option) => (
                  <TouchableOpacity
                    key={`payment-${option.id}`}
                    style={[styles.paymentOptionCard, { 
                      backgroundColor: currentTheme.surface, 
                      borderColor: currentTheme.border,
                      opacity: processingPayment && processingPaymentId === option.id ? 0.5 : 1
                    }]}
                    onPress={() => handlePaymentSelect(option)}
                    disabled={processingPayment}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <Text style={styles.paymentOptionIcon}>{option.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.paymentOptionName, { color: currentTheme.text }]}>
                          {option.name}
                        </Text>
                        <Text style={[styles.paymentOptionDescription, { color: currentTheme.textSecondary }]}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    {processingPayment && processingPaymentId === option.id ? (
                      <ActivityIndicator size="small" color={currentTheme.primary} />
                    ) : (
                      <Text style={[styles.paymentOptionArrow, { color: currentTheme.textSecondary }]}>→</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noPaymentModes}>
                <Text style={[styles.noPaymentText, { color: currentTheme.textSecondary }]}>
                  No payment modes configured. Please add in Payment Settings.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Cancel Button - Hide during processing */}
        {!processingPayment && (
          <TouchableOpacity 
            style={[styles.paymentCancelBtn, { backgroundColor: currentTheme.surface }]}
            onPress={() => setShowPaymentModal(false)}
          >
            <Text style={[styles.paymentCancelText, { color: currentTheme.text }]}>
              {t.cancel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </Modal>
);

  const renderCashModal = () => (
  <Modal
    visible={showCashModal}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setShowCashModal(false)}
  >
    <View style={styles.paymentModalOverlay}>
      <View style={[styles.paymentModalContent, isMobile && styles.paymentModalContentMobile, { backgroundColor: currentTheme.card }]}>
        <View style={styles.paymentModalHeader}>
          <Text style={[styles.paymentModalTitle, { color: currentTheme.text }]}>{t.cash}</Text>
          <TouchableOpacity 
            style={styles.paymentModalClose}
            onPress={() => {
              setShowCashModal(false);
              setCashAmount('');
            }}
          >
            <Text style={[styles.paymentModalCloseText, { color: currentTheme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.paymentAmountContainer, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.paymentAmountLabel, { color: currentTheme.textSecondary }]}>{t.totalAmount}</Text>
          <Text style={[styles.paymentAmountValue, { color: currentTheme.primary }]}>${total}</Text>
        </View>

        {paymentSuccess ? (
          <View style={styles.paymentSuccessContainer}>
            <ActivityIndicator size="large" color={currentTheme.success} />
            <Text style={[styles.paymentSuccessText, { color: currentTheme.text }]}>{t.processing} {t.cash} {t.payment}</Text>
          </View>
        ) : (
          <>
            <View style={styles.cashInputContainer}>
              <Text style={[styles.cashInputLabel, { color: currentTheme.text }]}>{t.cashReceived}</Text>
              <View style={[styles.cashInputWrapper, { borderColor: currentTheme.primary }]}>
                <Text style={[styles.cashInputCurrency, { color: currentTheme.primary }]}>$</Text>
                <TextInput
                  style={[styles.cashInput, { color: currentTheme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={currentTheme.textSecondary}
                  keyboardType="numeric"
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  autoFocus={true}
                />
              </View>
            </View>

            {cashAmount !== '' && !isNaN(parseFloat(cashAmount)) && (
              <View style={[styles.balanceContainer, { backgroundColor: currentTheme.surface }]}>
                <Text style={[styles.balanceLabel, { color: currentTheme.textSecondary }]}>
                  {parseFloat(cashAmount) >= parseFloat(total) ? t.balanceToReturn : t.additionalNeeded}
                </Text>
                <Text style={[
                  styles.balanceValue,
                  parseFloat(cashAmount) >= parseFloat(total) ? { color: currentTheme.success } : { color: currentTheme.danger }
                ]}>
                  ${Math.abs(parseFloat(cashAmount) - parseFloat(total)).toFixed(2)}
                </Text>
                {parseFloat(cashAmount) < parseFloat(total) && (
                  <Text style={[styles.balanceWarning, { color: currentTheme.danger }]}>
                    {t.insufficientCash} ${(parseFloat(total) - parseFloat(cashAmount)).toFixed(2)} {t.more}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.quickAmountContainer}>
              <Text style={[styles.quickAmountLabel, { color: currentTheme.text }]}>{t.quickAmounts}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[10, 20, 50, 100, 200, 500].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[styles.quickAmountBtn, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                    onPress={() => setCashAmount(amount.toString())}
                  >
                    <Text style={[styles.quickAmountBtnText, { color: currentTheme.text }]}>${amount}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <View style={styles.cashModalButtons}>
          <TouchableOpacity 
            style={[styles.cashModalBtn, styles.cashModalCancel, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
            onPress={() => {
              setShowCashModal(false);
              setCashAmount('');
            }}
          >
            <Text style={[styles.cashModalCancelText, { color: currentTheme.text }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.cashModalBtn, 
              styles.cashModalConfirm,
              { backgroundColor: currentTheme.success },
              (!cashAmount || parseFloat(cashAmount) < parseFloat(total)) && { backgroundColor: currentTheme.inactive, opacity: 0.5 }
            ]}
            onPress={handleCashPayment}
            disabled={!cashAmount || parseFloat(cashAmount) < parseFloat(total)}
          >
            <Text style={styles.cashModalConfirmText}>Confirm Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

  const renderMenuContent = () => {
    switch(activeMenu) {
      case 'dishgroup':
        return renderDishGroupManagement();
      case 'dishitems':
        return renderDishItemsManagement();
      default:
        return renderMainMenu();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar 
        barStyle={theme === 'night' ? 'light-content' : 'dark-content'} 
        backgroundColor={currentTheme.header}
      />
      
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: currentTheme.header, borderBottomColor: currentTheme.border }
      ]}>
        <View style={styles.headerLeft}>
          {/* Home Button with Dropdown */}
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => setShowHomeMenu(!showHomeMenu)}
          >
            <Entypo name="home" size={24} color={currentTheme.headerText} />
          </TouchableOpacity>

          {/* Home Dropdown Menu */}
          {showHomeMenu && (
            <View style={[styles.homeDropdown, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowHomeMenu(false);
                  setProfileMode('full');
                  setShowProfileModal(true);
                  setProfileTab('theme');
                }}
              >
                <Text style={styles.dropdownIcon}>🎨</Text>
                <Text style={[styles.dropdownText, { color: currentTheme.text }]}>{t.selectTheme}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowHomeMenu(false);
                  setProfileMode('full');
                  setShowProfileModal(true);
                  setProfileTab('language');
                }}
              >
                <Text style={styles.dropdownIcon}>🌐</Text>
                <Text style={[styles.dropdownText, { color: currentTheme.text }]}>{t.selectLanguage}</Text>
              </TouchableOpacity>
              
              <View style={[styles.dropdownDivider, { backgroundColor: currentTheme.border }]} />
              
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setShowHomeMenu(false);
                  setProfileMode('logout');
                  setShowProfileModal(true);
                }}
              >
                <Text style={styles.dropdownIcon}>👤</Text>
                <Text style={[styles.dropdownText, { color: currentTheme.text }]}>{t.profile}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.registerText, { color: currentTheme.headerText }]}>{t.register}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Entypo name="menu" size={24} color={currentTheme.headerText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={[styles.categoriesContainer, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => handleCategoryChange(cat)}
              style={[
                styles.categoryWrapper,
                { backgroundColor: currentTheme.surface },
                activeCategory === cat && { backgroundColor: currentTheme.primary }
              ]}
            >
              <Text style={[
                styles.categoryText,
                { color: currentTheme.textSecondary },
                activeCategory === cat && { color: '#ffffff' }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={[styles.menuSection, isMobile && styles.menuSectionMobile, { backgroundColor: currentTheme.background }]}>
          <MenuGrid 
            currentItems={currentItems}
            addToCart={addToCart}
            totalPages={totalPages}
            currentPage={currentPage}
            prevPage={prevPage}
            nextPage={nextPage}
            setCurrentPage={setCurrentPage}
            categoryItems={categoryItems}
            t={t}
            theme={currentTheme}
          />
        </View>

        <View style={[styles.cartSection, isMobile && styles.cartSectionMobile, { backgroundColor: currentTheme.surface, borderLeftColor: currentTheme.border }]}>
          <CartSection 
            cart={cart}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
            removeItem={removeItem}
            total={total}
            handleCheckout={handleCheckout}
            isMobile={isMobile}
            t={t}
            theme={currentTheme}
          />
        </View>
      </View>

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sideMenu, isMobile && styles.sideMenuMobile, { backgroundColor: currentTheme.background }]}>
            <View style={[styles.sideMenuHeader, { backgroundColor: currentTheme.primary }]}>
              <Text style={styles.sideMenuTitle}>{t.posMenu}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setMenuVisible(false);
                  setActiveMenu('main');
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {activeMenu !== 'main' && (
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}
                onPress={() => setActiveMenu('main')}
              >
                <Text style={[styles.backButtonText, { color: currentTheme.primary }]}>{t.backToMain}</Text>
              </TouchableOpacity>
            )}
            
            {renderMenuContent()}
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      {renderPaymentModal()}
      
      {/* Cash Payment Modal */}
      {renderCashModal()}

      {/* Sales Report Modal */}
    {/* Sales Report Modal - NEW VERSION */}
<POSSalesReport
  visible={showSalesReport}
  onClose={() => setShowSalesReport(false)}
  selectedFilter={selectedSalesFilter}
  onFilterChange={setSelectedSalesFilter}
  startDate={startDate}
  endDate={endDate}
  onStartDateChange={setStartDate}
  onEndDateChange={setEndDate}
  onApplyCustomFilter={applyCustomFilter}
  theme={currentTheme}
  t={t}
  isMobile={isMobile}
/>
<PayModeSettings
  visible={showPayModeSettings}
  onClose={() => setShowPayModeSettings(false)}
  userId={user?.id}
  theme={currentTheme}
  t={t}
  onUpdate={handlePaymentModesUpdate}
/>

<BillPrompt
  visible={showBillPrompt}
  onClose={() => setShowBillPrompt(false)}
  onPrintBill={handlePrintBill}
  onSkip={handleSkipBill}
  theme={currentTheme}
  t={t}
  total={calculateTotal()}
/>
<CompanySettingsForm
  visible={showCompanySettings}
  onClose={() => setShowCompanySettings(false)}
  onSave={async (settings) => {
    // Convert to string when saving
    const clientId = String(user?.clientId || user?.id || '');
    await BillPDFGenerator.saveSettings(settings, clientId);
    Alert.alert('✅ Success', 'Company settings saved!');
    setShowCompanySettings(false);
  }}
  theme={currentTheme}
  t={t}
  clientId={String(user?.clientId || user?.id || '')}
/>
      {/* Profile Modal */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        isMobile={isMobile}
        currentTheme={currentTheme}
        t={t}
        profileMode={profileMode}
        profileTab={profileTab}
        setProfileTab={setProfileTab}
        theme={theme}
        language={language}
        handleThemeChange={handleThemeChange}
        handleLanguageChange={handleLanguageChange}
        handleLogout={handleLogout}
        user={user}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  headerAndroid: { 
    paddingTop: (StatusBar.currentHeight || 0) + 10,
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: 80,
  },
  homeButton: { 
    marginRight: 16, 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: { 
    fontSize: 22,
    includeFontPadding: false,
  },
  profileButton: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: { 
    fontSize: 22,
    includeFontPadding: false,
  },
  headerCenter: { 
    alignItems: 'center',
    flex: 1,
  },
  headerRight: { 
    width: 40, 
    alignItems: 'flex-end',
  },
  registerText: { 
    fontSize: 16, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  menuButton: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: { 
    fontSize: 22,
    includeFontPadding: false,
  },
  categoriesContainer: { 
    height: 50, 
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  categoriesScrollContent: { 
    paddingHorizontal: 12, 
    alignItems: 'center',
    paddingVertical: 6,
  },
  categoryWrapper: { 
    marginRight: 10, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
  },
  categoryText: { 
    fontSize: 14, 
    fontWeight: '500',
    includeFontPadding: false,
  },
  mainContent: { 
    flex: 1, 
    flexDirection: 'row',
  },
  menuSection: { 
    flex: 0.7,
  },
  menuSectionMobile: { 
    flex: 0.6,
  },
   noPaymentModes: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPaymentText: {
    fontSize: 14,
    textAlign: 'center',
  },
  cartSection: { 
    flex: 0.3, 
    borderLeftWidth: 1,
  },
  cartSectionMobile: { 
    flex: 0.4,
  },
  menuGridContainer: { 
    flex: 1,
  },
  menuGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    padding: 4,
  },
  menuItem: { 
    width: '50%', 
    padding: 8, 
    borderBottomWidth: 1, 
    borderRightWidth: 1, 
    alignItems: 'center',
    minHeight: 150,
  },
  closeButtonTextRed: { 
    fontSize: 18, 
    fontWeight: '600',
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  menuItemImageContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 8,
  },
  menuItemImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  menuItemImagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  menuItemImagePlaceholderText: { 
    fontSize: 32,
  },
  menuItemName: { 
    fontSize: 13, 
    marginBottom: 4, 
    textAlign: 'center',
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  menuItemPrice: { 
    fontSize: 14, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  paginationWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderTopWidth: 1, 
    borderBottomWidth: 1,
  },
  paginationButton: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20, 
    minWidth: 44, 
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  paginationButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  pageNumbersContainer: { 
    flex: 1, 
    marginHorizontal: 8,
    height: 44,
  },
  pageNumberButton: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    marginHorizontal: 3, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
  },
  pageNumberText: { 
    fontSize: 13, 
    fontWeight: '500',
    includeFontPadding: false,
  },
  itemCountText: { 
    textAlign: 'center', 
    fontSize: 11, 
    paddingVertical: 8,
    includeFontPadding: false,
  },
  cartContainer: { 
    flex: 1,
  },
  cartHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    borderBottomWidth: 1,
    minHeight: 50,
  },
  cartTitle: { 
    fontSize: 14, 
    fontWeight: '700',
    includeFontPadding: false,
  },
  cartItemCount: { 
    fontSize: 13, 
    fontWeight: '500',
    includeFontPadding: false,
  },
  cartItems: { 
    flex: 1, 
    paddingHorizontal: 10,
  },
  cartItem: { 
    paddingVertical: 12, 
    borderBottomWidth: 1,
  },
  cartItemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8,
  },
  cartItemImageContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    overflow: 'hidden', 
    marginRight: 12,
  },
  cartItemImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  cartItemImagePlaceholder: { 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  cartItemImagePlaceholderText: { 
    fontSize: 20,
  },
  cartItemDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
  },
  cartItemQuantity: { 
    fontSize: 13, 
    fontWeight: '600', 
    marginRight: 6,
    includeFontPadding: false,
  },
  cartItemName: { 
    fontSize: 13, 
    flex: 1,
    includeFontPadding: false,
  },
  cartItemPrice: { 
    fontSize: 13, 
    fontWeight: '500', 
    marginLeft: 8,
    includeFontPadding: false,
  },
  cartItemPriceMobile: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginLeft: 8,
    includeFontPadding: false,
  },
  cartItemControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginLeft: 52,
  },
  cartItemControlsMobile: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginLeft: 52, 
    marginTop: 8,
  },
  cartQuantityControls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 6,
    height: 38,
  },
  cartQuantityBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    minWidth: 38, 
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  cartQuantityBtnText: { 
    fontSize: 14, 
    fontWeight: '700',
    includeFontPadding: false,
  },
  cartQuantityText: { 
    paddingHorizontal: 8, 
    fontSize: 13, 
    fontWeight: '600', 
    minWidth: 28, 
    textAlign: 'center',
    includeFontPadding: false,
  },
  cartRemoveBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 6,
    minWidth: 40,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRemoveText: { 
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCart: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 30,
  },
  emptyCartText: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 4,
    includeFontPadding: false,
  },
  emptyCartSubText: { 
    fontSize: 12,
    includeFontPadding: false,
  },
  cartFooter: { 
    padding: 12, 
    borderTopWidth: 2,
  },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  chargeText: { 
    fontSize: 14, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  totalAmount: { 
    fontSize: 20, 
    fontWeight: '800',
    includeFontPadding: false,
  },
  checkoutBtn: { 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  checkoutBtnText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: '700',
    includeFontPadding: false,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  sideMenu: { 
    width: '85%', 
    maxWidth: 400,
    height: '100%', 
    borderTopRightRadius: 20, 
    borderBottomRightRadius: 20,
  },
  sideMenuMobile: { 
    width: '90%',
  },
  salesReportMenu: { 
    width: '90%', 
    maxWidth: 800,
    alignSelf: 'center',
    borderRadius: 20,
  },
  sideMenuHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderTopRightRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    minHeight: Platform.OS === 'ios' ? 90 : 70,
  },
  sideMenuTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#ffffff',
    includeFontPadding: false,
  },
  closeButton: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { 
    fontSize: 20, 
    color: '#ffffff', 
    fontWeight: '600',
  },
  backButton: { 
    padding: 14, 
    borderBottomWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  backButtonText: { 
    fontSize: 14, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  menuContent: { 
    flex: 1, 
    padding: 16,
  },
  menuTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 16,
    includeFontPadding: false,
  },
  menuItemBtn: { 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1,
    minHeight: 55,
    justifyContent: 'center',
  },
  menuItemBtnText: { 
    fontSize: 15, 
    fontWeight: '500',
    includeFontPadding: false,
  },
  salesReportBtn: { 
    borderColor: '#45a049',
  },
  addButton: { 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  addButtonText: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  groupList: { 
    flex: 1,
  },
  groupCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 8, 
    borderWidth: 1,
    minHeight: 70,
  },
  groupInfo: { 
    flex: 1,
  },
  groupName: { 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 4,
    includeFontPadding: false,
  },
  groupCount: { 
    fontSize: 12,
    includeFontPadding: false,
  },
  groupActions: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  groupStatus: { 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 15, 
    marginRight: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  groupStatusText: { 
    color: '#ffffff', 
    fontSize: 11, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  groupEditBtn: { 
    padding: 8, 
    marginRight: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEditText: { 
    fontSize: 18,
  },
  groupDeleteBtn: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDeleteText: { 
    fontSize: 18,
  },
  dishList: { 
    flex: 1,
  },
  dishCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 8, 
    borderWidth: 1,
    minHeight: 80,
  },
  dishImageContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 8, 
    overflow: 'hidden', 
    marginRight: 12,
  },
  dishThumbnail: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  dishThumbnailPlaceholder: { 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  dishThumbnailText: { 
    fontSize: 22,
  },
  dishInfo: { 
    flex: 1,
  },
  dishName: { 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 4,
    includeFontPadding: false,
  },
  dishCategory: { 
    fontSize: 12,
    includeFontPadding: false,
  },
  dishPrice: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginRight: 12,
    includeFontPadding: false,
  },
  dishActions: { 
    flexDirection: 'row',
  },
  dishEditBtn: { 
    padding: 8, 
    marginRight: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishEditText: { 
    fontSize: 18,
  },
  dishDeleteBtn: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishDeleteText: { 
    fontSize: 18,
  },
  summaryCardHighlight: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
  },
  galleryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cameraButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  profileModal: { 
    width: '90%', 
    maxWidth: 400, 
    borderRadius: 20, 
    alignSelf: 'center',
    maxHeight: '80%',
  },
  profileModalMobile: { 
    width: '95%',
  },
  profileModalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    minHeight: Platform.OS === 'ios' ? 90 : 70,
  },
  profileModalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#ffffff',
    includeFontPadding: false,
  },
  profileTabs: { 
    flexDirection: 'row', 
    borderBottomWidth: 1,
  },
  profileTab: { 
    flex: 1, 
    paddingVertical: 14, 
    alignItems: 'center',
  },
  profileTabActive: { 
    borderBottomWidth: 2,
  },
  profileTabText: { 
    fontSize: 15,
    includeFontPadding: false,
  },
  profileContent: { 
    maxHeight: 400, 
    padding: 16,
  },
  themeOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 10, 
    marginBottom: 10, 
    borderWidth: 1,
    minHeight: 60,
  },
  themeColorPreview: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    marginRight: 14,
  },
  themeOptionText: { 
    flex: 1, 
    fontSize: 16,
    includeFontPadding: false,
  },
  themeCheck: { 
    fontSize: 20, 
    color: '#ffffff', 
    fontWeight: '600',
  },
  languageOption: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1,
    minHeight: 60,
  },
  languageOptionText: { 
    fontSize: 16,
    includeFontPadding: false,
  },
  languageCheck: { 
    fontSize: 20, 
    color: '#ffffff', 
    fontWeight: '600',
  },
  profileCancelBtn: { 
    margin: 16, 
    marginTop: 0, 
    padding: 14, 
    borderRadius: 10, 
    borderWidth: 1, 
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  profileCancelText: { 
    fontSize: 16, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  paymentModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    padding: 16,
  },
  paymentModalContent: { 
    width: '100%', 
    maxWidth: 600, 
    borderRadius: 10, 
    padding: 20, 
    maxHeight: '100%',
  },
  paymentModalContentMobile: { 
    width: '100%',
  },
  paymentModalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  paymentModalTitle: { 
    fontSize: 22, 
    fontWeight: '700',
    includeFontPadding: false,
  },
  paymentModalClose: { 
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentModalCloseText: { 
    fontSize: 22, 
    fontWeight: '600',
  },
  paymentAmountContainer: { 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 20, 
    alignItems: 'center',
  },
  paymentAmountLabel: { 
    fontSize: 16, 
    marginBottom: 8,
    includeFontPadding: false,
  },
  paymentAmountValue: { 
    fontSize: 36, 
    fontWeight: '800',
    includeFontPadding: false,
  },
  paymentOptionCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 15, 
    marginBottom: 12, 
    borderWidth: 1,
    minHeight: 80,
  },
  paymentOptionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
  },
  paymentOptionIcon: { 
    fontSize: 32, 
    marginRight: 16,
  },
  paymentOptionName: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 4,
    includeFontPadding: false,
  },
  paymentOptionDescription: { 
    fontSize: 14,
    includeFontPadding: false,
  },
  paymentOptionArrow: { 
    fontSize: 22,
  },
  paymentSuccessContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 40,
  },
  paymentSuccessText: { 
    fontSize: 18, 
    marginTop: 20, 
    textAlign: 'center',
    includeFontPadding: false,
  },
  paymentCancelBtn: { 
    marginTop: 20, 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  paymentCancelText: { 
    fontSize: 16, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  cashInputContainer: { 
    marginBottom: 20,
  },
  cashInputLabel: { 
    fontSize: 16, 
    marginBottom: 10,
    includeFontPadding: false,
  },
  cashInputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderRadius: 15, 
    paddingHorizontal: 16,
    height: 60,
  },
  cashInputCurrency: { 
    fontSize: 28, 
    fontWeight: '600', 
    marginRight: 12,
    includeFontPadding: false,
  },
  cashInput: { 
    flex: 1, 
    fontSize: 28, 
    padding: 0,
    includeFontPadding: false,
  },
  balanceContainer: { 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 20, 
    alignItems: 'center',
  },
  balanceLabel: { 
    fontSize: 16, 
    marginBottom: 8,
    includeFontPadding: false,
  },
  balanceValue: { 
    fontSize: 40, 
    fontWeight: '800',
    includeFontPadding: false,
  },
  balanceWarning: { 
    fontSize: 14, 
    marginTop: 8, 
    textAlign: 'center',
    includeFontPadding: false,
  },
 quickAmountContainer: {
  marginBottom: 20,
  width: '100%',
},

quickAmountLabel: {
  fontSize: 14,
  fontWeight: '600',
  marginBottom: 12,
  color: '#333',
},
 quickAmountBtn: {
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 10,
  marginRight: 10,
  borderWidth: 1,
  minWidth: 70,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f5f5',
},
 quickAmountBtnText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
},
quickAmountScroll: {
  flexDirection: 'row',
  marginBottom: 8,
},
  cashModalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  marginTop: 0,
  paddingHorizontal: 2,
},
 cashModalBtn: {
  flex: 1,
  paddingVertical: 1,
  paddingHorizontal: 1,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 47,
  elevation: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},

cashModalCancel: {
  borderWidth: 1,
  backgroundColor: 'transparent',
},
 cashModalCancelText: {
  fontSize: 16,
  fontWeight: '600',
  textAlign: 'center',
},

cashModalConfirm: {
  backgroundColor: '#4CAF50',
},

 cashModalConfirmText: {
  fontSize: 16,
  color: '#ffffff',
  fontWeight: '700',
  textAlign: 'center',
},
  salesHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  filterContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-around', 
    marginBottom: 20,
  },
  filterBtn: { 
    flex: 1, 
    minWidth: 70, 
    paddingVertical: 10, 
    paddingHorizontal: 10, 
    borderRadius: 25, 
    marginHorizontal: 3, 
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  filterBtnText: { 
    fontSize: 13, 
    fontWeight: '500',
    includeFontPadding: false,
  },
  customDateContainer: { 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20,
  },
  datePickerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 12,
  },
  dateLabel: { 
    fontSize: 15, 
    fontWeight: '600', 
    flex: 1,
    includeFontPadding: false,
  },
  dateButton: { 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    flex: 2, 
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  dateButtonText: { 
    fontSize: 14,
    includeFontPadding: false,
  },
  applyButton: { 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  applyButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  dateRangeDisplay: { 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 20, 
    alignItems: 'center',
  },
  dateRangeText: { 
    fontSize: 14, 
    fontWeight: '500',
    includeFontPadding: false,
  },
  summaryContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20,
  },
  summaryCard: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 12, 
    marginHorizontal: 4, 
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  summaryLabel: { 
    fontSize: 13, 
    marginBottom: 6,
    includeFontPadding: false,
  },
  summaryValue: { 
    fontSize: 20, 
    fontWeight: '700',
    includeFontPadding: false,
  },
  summaryValueHighlight: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#ffffff',
    includeFontPadding: false,
  },
  paymentBreakdownContainer: { 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20,
  },
  breakdownTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12,
    includeFontPadding: false,
  },
  breakdownRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8, 
    borderBottomWidth: 1,
  },
  breakdownMethod: { 
    fontSize: 14,
    includeFontPadding: false,
  },
  breakdownAmount: { 
    fontSize: 14, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  salesListTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12,
    includeFontPadding: false,
  },
salesList: {
  flex: 1,
  marginTop: 8,
},
 saleItem: {
  padding: 12,
  borderRadius: 10,
  marginBottom: 10,
  borderWidth: 1,
},
 saleHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  paddingHorizontal: 4,
},
saleHeaderLeft: {
  flex: 1,
},
saleDate: {
  fontSize: 14,
  fontWeight: '600',
  includeFontPadding: false,
  marginBottom: 2,
},
saleTime: {
  fontSize: 11,
  includeFontPadding: false,
},
  saleDateTime: { 
    fontSize: 13,
    includeFontPadding: false,
  },
  salePayment: { 
    fontSize: 13, 
    fontWeight: '600',
    includeFontPadding: false,
  },
 paymentBadge: {
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  marginLeft: 8,
},
paymentBadgeText: {
  fontSize: 11,
  fontWeight: '600',
  includeFontPadding: false,
},
saleItemsContainer: {
  marginBottom: 12,
  paddingHorizontal: 4,
},
  saleItemRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 6,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(0,0,0,0.05)',
},
saleItemLeft: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
},
saleItemName: {
  fontSize: 13,
  flex: 1,
  includeFontPadding: false,
  marginRight: 8,
},
  saleItemQty: { 
    fontSize: 12,
  includeFontPadding: false,
  marginRight: 8,
  minWidth: 35,
  },
  saleItemQuantity: {
  fontSize: 12,
  includeFontPadding: false,
  marginRight: 8,
  minWidth: 35,
},
saleItemPrice: {
  fontSize: 13,
  fontWeight: '600',
  includeFontPadding: false,
  minWidth: 60,
  textAlign: 'right',
},
saleTotalContainer: {  // ✅ THIS IS THE MISSING STYLE
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 8,
  paddingTop: 10,
  borderTopWidth: 1,
  paddingHorizontal: 4,
},
  saleTotal: { 
     flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 8,
  paddingTop: 10,
  borderTopWidth: 1,
  paddingHorizontal: 4,
  },
  saleTotalLabel: {
  fontSize: 14,
  fontWeight: '600',
  includeFontPadding: false,
},
  saleTotalValue: {
  fontSize: 16,
  fontWeight: '700',
  includeFontPadding: false,
},

  noSalesContainer: { 
    padding: 40, 
    alignItems: 'center',
  },
  noSalesText: { 
    fontSize: 15,
    includeFontPadding: false,
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  scrollModalContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    padding: 16,
  },
  modalContent: { 
    borderRadius: 20, 
    padding: 20, 
    margin: 16,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 20, 
    textAlign: 'center',
    includeFontPadding: false,
  },
  modalLabel: { 
    fontSize: 15, 
    fontWeight: '600', 
    marginBottom: 6, 
    marginTop: 12,
    includeFontPadding: false,
  },
  modalInput: { 
    borderWidth: 1, 
    borderRadius: 10, 
    padding: 14, 
    fontSize: 15, 
    marginBottom: 16,
    minHeight: 50,
    includeFontPadding: false,
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20,
  },
  modalBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginHorizontal: 6,
    minHeight: 50,
    justifyContent: 'center',
  },
  cancelBtn: { 
    borderWidth: 1,
  },
  cancelBtnText: { 
    fontSize: 15, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  saveBtnText: { 
    color: '#ffffff', 
    fontSize: 15, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  imageUploadContainer: { 
    marginBottom: 20,
  },
  imagePreviewContainer: { 
    width: '100%', 
    height: 180, 
    borderRadius: 12, 
    overflow: 'hidden', 
    marginBottom: 12, 
    position: 'relative', 
    borderWidth: 1,
  },
  pdfButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  styleModal: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 15,
    padding: 20,
  },
 
  styleOption: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  styleOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  removeImageButton: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  removeImageText: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '600',
  },
  imagePlaceholder: { 
    width: '100%', 
    height: 180, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12, 
    borderWidth: 1, 
    borderStyle: 'dashed',
  },
  imagePlaceholderText: { 
    fontSize: 48,
  },
  imagePlaceholderSubText: { 
    fontSize: 14, 
    marginTop: 8,
    includeFontPadding: false,
  },
  imageButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },
  imageButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 10, 
    marginHorizontal: 6,
    minHeight: 50,
  },
  imageButtonIcon: { 
    fontSize: 18, 
    color: '#ffffff', 
    marginRight: 8,
  },
  imageButtonText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: '600',
    includeFontPadding: false,
  },
  categorySelector: { 
    flexDirection: 'row', 
    marginBottom: 20,
    maxHeight: 50,
  },
  categoryChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  categoryChipText: { 
    fontSize: 13,
    includeFontPadding: false,
  },
  selectedCategoryChipText: { 
    color: '#ffffff',
  },
  backToMainBtn: { 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 20, 
    alignItems: 'center', 
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  backToMainBtnText: { 
    fontSize: 15, 
    color: '#ffffff', 
    fontWeight: '600',
    includeFontPadding: false,
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatarText: {
    fontSize: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    includeFontPadding: false,
  },
  userRole: {
    fontSize: 14,
    marginBottom: 20,
    includeFontPadding: false,
  },
  // Add to your StyleSheet
processingText: {
  fontSize: 18,
  marginTop: 20,
  textAlign: 'center',
  fontWeight: '600',
},
processingSubText: {
  fontSize: 14,
  marginTop: 8,
  textAlign: 'center',
},
  logoutButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  homeDropdown: {
  position: 'absolute',
  top: 50,
  left: 10,
  borderRadius: 12,
  borderWidth: 1,
  padding: 8,
  width: 200,
  zIndex: 1000,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
dropdownItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
  borderRadius: 8,
},
dropdownIcon: {
  fontSize: 20,
  marginRight: 12,
  width: 30,
},
dropdownText: {
  fontSize: 16,
  flex: 1,
  includeFontPadding: false,
},
// Add to your styles object
filterScrollView: {
  flexGrow: 0,
  marginBottom: 15,
},
filterScrollContent: {
  paddingHorizontal: 10,
  gap: 8,
},
customDateScrollView: {
  flexGrow: 0,
  marginBottom: 15,
},
salesMainScrollView: {
  flex: 1,
},
salesMainContent: {
  paddingBottom: 20,
},
loadingContainer: {
  padding: 40,
  alignItems: 'center',
  justifyContent: 'center',
},
// Add to your styles object
bottomInfo: {
  marginTop: 'auto',  // Pushes to bottom
  paddingTop: 16,
  borderTopWidth: 1,
},
bottomRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
bottomLogo: {
  width: 30,
  height: 30,
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
bottomLogoText: {
  fontSize: 16,
},
bottomShopName: {
  fontSize: 16,
  fontWeight: '600',
  flex: 1,
},
bottomLabel: {
  fontSize: 12,
  width: 70,
},
bottomValue: {
  fontSize: 13,
  fontWeight: '500',
  flex: 1,
},
countdownBox: {
  marginTop: 8,
  padding: 10,
  borderRadius: 8,
},
countdownLabel: {
  fontSize: 11,
  marginBottom: 4,
},
countdownTimer: {
  fontSize: 16,
  fontWeight: '700',
  textAlign: 'center',
},
// Add to your styles object
bottomCompanyContainer: {
  marginTop: 'auto',
  paddingTop: 16,
  borderTopWidth: 1,
},
licenseRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},
licenseLabel: {
  fontSize: 12,
  width: 70,
},
licenseValue: {
  fontSize: 13,
  fontWeight: '600',
  flex: 1,
},
expiryRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
expiryLabel: {
  fontSize: 12,
  width: 70,
},
expiryValue: {
  fontSize: 13,
  fontWeight: '500',
  flex: 1,
},
countdownContainer: {
  padding: 10,
  borderRadius: 8,
  marginBottom: 12,
},

companyDivider: {
  height: 1,
  marginVertical: 12,
},
companyHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
companyLogo: {
  width: 40,
  height: 40,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
companyLogoText: {
  color: '#ffffff',
  fontSize: 14,
  fontWeight: '700',
},
companyName: {
  fontSize: 14,
  fontWeight: '600',
  flex: 1,
  flexWrap: 'wrap',
},
copyright: {
  fontSize: 10,
  textAlign: 'center',
  marginTop: 4,
  marginBottom: 8,
},

companyLogoContainer: {
  width: 50,
  height: 50,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
  borderWidth: 1,
  borderColor: '#ddd',
  overflow: 'hidden',
},
companyLogoImage: {
  width: 45,
  height: 45,
},
companyTextContainer: {
  flex: 1,
},

companyTagline: {
  fontSize: 11,
},

dropdownDivider: {
  height: 1,
  marginVertical: 8,
},
});