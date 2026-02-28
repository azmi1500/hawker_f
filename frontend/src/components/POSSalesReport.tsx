// components/POSSalesReport.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import API from '../api';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onApplyCustomFilter: () => void;
  theme: any;
  t: any;
  isMobile: boolean;
}

const POSSalesReport: React.FC<Props> = ({
  visible,
  onClose,
  selectedFilter,
  onFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyCustomFilter,
  theme,
  t,
  isMobile
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');
  const [tempDate, setTempDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    paymentBreakdown: {}
  });
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, selectedFilter, startDate, endDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      let summaryUrl = '/sales/summary';
      if (selectedFilter === 'custom') {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        summaryUrl += `?filter=custom&startDate=${start}&endDate=${end}`;
      } else {
        summaryUrl += `?filter=${selectedFilter}`;
      }
      
      const summaryRes = await API.get(summaryUrl);
      setSummary(summaryRes.data);

      let salesUrl = '/sales';
      if (selectedFilter === 'custom') {
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        salesUrl += `?filter=custom&startDate=${start}&endDate=${end}`;
      } else {
        salesUrl += `?filter=${selectedFilter}`;
      }
      
      const salesRes = await API.get(salesUrl);
      setSalesHistory(salesRes.data);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStartPicker = useCallback(() => {
    setPickerType('start');
    setTempDate(startDate);
    setShowPicker(true);
  }, [startDate]);

  const openEndPicker = useCallback(() => {
    setPickerType('end');
    setTempDate(endDate);
    setShowPicker(true);
  }, [endDate]);

  const onDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      if (pickerType === 'start') {
        onStartDateChange(selectedDate);
      } else {
        onEndDateChange(selectedDate);
      }
    }
    setShowPicker(false);
  }, [pickerType, onStartDateChange, onEndDateChange]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.container, isMobile && styles.containerMobile, { backgroundColor: theme.background }]}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>{t.salesReport}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            {['today', 'week', 'month', 'custom'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterBtn,
                  { 
                    backgroundColor: selectedFilter === filter ? theme.primary : theme.surface,
                    borderColor: theme.border 
                  }
                ]}
                onPress={() => onFilterChange(filter)}
              >
                <Text style={[
                  styles.filterBtnText,
                  { color: selectedFilter === filter ? '#fff' : theme.text }
                ]}>
                  {t[filter] || filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedFilter === 'custom' && (
            <View style={[styles.customDateContainer, { backgroundColor: theme.surface }]}>
              <View style={styles.datePickerRow}>
                <Text style={[styles.dateLabel, { color: theme.text }]}>{t.startDate}</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={openStartPicker}
                >
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    {startDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerRow}>
                <Text style={[styles.dateLabel, { color: theme.text }]}>{t.endDate}</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={openEndPicker}
                >
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    {endDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.applyButton, { backgroundColor: theme.secondary }]}
                onPress={onApplyCustomFilter}
              >
                <Text style={styles.applyButtonText}>{t.applyFilter}</Text>
              </TouchableOpacity>
            </View>
          )}

          {showPicker && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <ScrollView 
            style={styles.contentScrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : (
              <>
                <View style={styles.summaryContainer}>
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t.totalSales}</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.totalSales}</Text>
                  </View>
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t.totalItems_report}</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{summary.totalItems}</Text>
                  </View>
                 <View style={[styles.summaryCard, styles.summaryCardHighlight, { backgroundColor: theme.primary }]}>
  <Text style={styles.summaryLabel}>Revenue</Text>   
  <Text style={styles.summaryValueHighlight}>${summary.totalRevenue.toFixed(2)}</Text>
</View>
                </View>

                <View style={[styles.paymentBreakdownContainer, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.breakdownTitle, { color: theme.text }]}>{t.paymentMethods}</Text>
                  {Object.entries(summary.paymentBreakdown).map(([method, amount], index) => (
                    <View key={`breakdown-${method}-${index}`} style={[styles.breakdownRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.breakdownMethod, { color: theme.textSecondary }]}>{method}</Text>
                      <Text style={[styles.breakdownAmount, { color: theme.primary }]}>${(amount as number).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.salesListTitle, { color: theme.text }]}>{t.transactionHistory}</Text>
                {salesHistory.map((sale, index) => (
                  <View key={`sale-${sale.id}-${index}`}style={[styles.saleItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.saleHeader}>
                      <View style={styles.saleHeaderLeft}>
                        <Text style={[styles.saleDate, { color: theme.textSecondary }]}>
                          {new Date(sale.date).toLocaleDateString()}
                        </Text>
                        <Text style={[styles.saleTime, { color: theme.textSecondary }]}>
                          {new Date(sale.date).toLocaleTimeString()}
                        </Text>
                      </View>
                      <View style={[styles.paymentBadge, { backgroundColor: theme.success + '20' }]}>
                        <Text style={[styles.paymentBadgeText, { color: theme.success }]}>
                          {sale.paymentMethod}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.saleItemsContainer}>
                      {sale.items?.map((item: any, idx: number) => (
                        <View key={`item-${sale.id}-${idx}`} style={styles.saleItemRow}>
                          <View style={styles.saleItemLeft}>
                            <Text style={[styles.saleItemName, { color: theme.text }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[styles.saleItemQuantity, { color: theme.textSecondary }]}>
                              x{item.quantity}
                            </Text>
                          </View>
                          <Text style={[styles.saleItemPrice, { color: theme.primary }]}>
                            ${(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <View style={[styles.saleTotalContainer, { borderTopColor: theme.border }]}>
                      <Text style={[styles.saleTotalLabel, { color: theme.text }]}>{t.total}:</Text>
                      <Text style={[styles.saleTotalValue, { color: theme.primary }]}>
                        ${sale.total?.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}

                {salesHistory.length === 0 && (
                  <View style={styles.noSalesContainer}>
                    <Text style={[styles.noSalesText, { color: theme.textSecondary }]}>{t.noSales}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ✅ STYLES MUST BE BEFORE THE EXPORT
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  containerMobile: {
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 12,
    marginTop: 12,
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
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  customDateContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 12,
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
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 12,
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
  summaryCardHighlight: {
    backgroundColor: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryValueHighlight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
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
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  breakdownMethod: {
    fontSize: 14,
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  salesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    marginBottom: 2,
  },
  saleTime: {
    fontSize: 11,
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
    marginRight: 8,
  },
  saleItemQuantity: {
    fontSize: 12,
    marginRight: 8,
    minWidth: 35,
  },
  saleItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  saleTotalContainer: {
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
  },
  saleTotalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  noSalesContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noSalesText: {
    fontSize: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ✅ EXPORT AT THE END
export default React.memo(POSSalesReport);