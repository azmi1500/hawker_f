// components/UniversalPrinter.ts
import * as Print from 'expo-print';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import BillPDFGenerator from './BillPDFGenerator';

class UniversalPrinter {
  
  // ✅ UNIVERSAL METHOD - Works on ALL Android POS
  static async printBill(saleData: any, userId?: string | number): Promise<boolean> {
    try {
      console.log('🖨️ Printing bill on Android POS...');
      
      // Generate HTML bill
      const html = await BillPDFGenerator.generateHTML(saleData, userId);
      
      if (Platform.OS === 'android') {
        // ✅ ANDROID: Use built-in print service
        await Print.printAsync({
          html: html,
          orientation: Print.Orientation.portrait,
          printerUrl: null, // Android will auto-detect printer
        });
        
        Alert.alert('✅ Success', 'Print job sent to printer');
        return true;
      } else {
        // iOS or others - fallback to PDF
        return await this.fallbackToPDF(saleData, userId);
      }
      
    } catch (error: any) {
      console.log('❌ Print error:', error.message);
      
      // If direct print fails, try PDF fallback
      if (error.message?.includes('printer')) {
        return await this.fallbackToPDF(saleData, userId);
      }
      
      Alert.alert('❌ Error', 'Print failed. Try PDF option.');
      return false;
    }
  }
  
  // ✅ FALLBACK: PDF share - Works on EVERY device
  static async fallbackToPDF(saleData: any, userId?: string | number): Promise<boolean> {
    try {
      console.log('📄 Falling back to PDF...');
      
      const html = await BillPDFGenerator.generateHTML(saleData, userId);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false
      });
      
      // Share PDF (user can print from anywhere)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Print Bill',
          UTI: 'com.adobe.pdf'
        });
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.log('❌ PDF fallback error:', error);
      return false;
    }
  }
  
  // ✅ SIMPLE PRINT - Auto-detect best method
  static async smartPrint(saleData: any, userId?: string | number): Promise<void> {
    try {
      // Try direct print first
      const printed = await this.printBill(saleData, userId);
      
      if (!printed) {
        // Show options if direct print fails
        Alert.alert(
          'Print Options',
          'Choose print method:',
          [
            { text: 'Try Again', onPress: () => this.printBill(saleData, userId) },
            { text: 'Save as PDF', onPress: () => this.fallbackToPDF(saleData, userId) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
      
    } catch (error) {
      Alert.alert('Error', 'Print failed');
    }
  }
}

export default UniversalPrinter;