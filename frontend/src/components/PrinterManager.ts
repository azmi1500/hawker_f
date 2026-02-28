// components/PrinterManager.ts
import { Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import BillPDFGenerator from './BillPDFGenerator';

class PrinterManager {
  
  // ✅ STEP 1: Check if printer is available
  static async isPrinterAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      // Method 1: Check via Intent (Most reliable)
      const PrintManager = require('react-native').NativeModules.PrintManager;
      if (PrintManager) {
        const hasPrinter = await PrintManager.checkPrinter();
        return hasPrinter;
      }
      
      // Method 2: Try to get print services
      const hasPrintService = await this.checkPrintServices();
      return hasPrintService;
      
    } catch (error) {
      console.log('Printer check error:', error);
      return false;
    }
  }
  
  // Check if Android has any print services
  static async checkPrintServices(): Promise<boolean> {
    try {
      // Try to get list of print services
      const { NativeModules } = require('react-native');
      
      // For Sunmi printers
      if (NativeModules.SunmiPrinter) {
        return true;
      }
      
      // For generic Android - always return true as Android has print framework
      return true;
      
    } catch (error) {
      return false;
    }
  }
  
  // ✅ STEP 2: Try to print directly
  static async tryPrint(saleData: any, userId?: string | number): Promise<boolean> {
    try {
      const html = await BillPDFGenerator.generateHTML(saleData, userId);
      
      await Print.printAsync({
        html: html,
        orientation: Print.Orientation.portrait,
      });
      
      return true;
    } catch (error) {
      console.log('Print failed:', error);
      return false;
    }
  }
  
  // ✅ STEP 3: Generate PDF
  static async generatePDF(saleData: any, userId?: string | number): Promise<string | null> {
    try {
      const html = await BillPDFGenerator.generateHTML(saleData, userId);
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false
      });
      return uri;
    } catch (error) {
      console.log('PDF generation failed:', error);
      return null;
    }
  }
  
  // ✅ STEP 4: Share PDF
  static async sharePDF(pdfUri: string): Promise<boolean> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Bill Receipt',
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  
  // ✅ MAIN FUNCTION: Complete flow
  static async handleBillPrint(
    saleData: any, 
    userId?: string | number,
    onComplete?: () => void
  ): Promise<void> {
    
    // Show checking message
    Alert.alert(
      '🖨️ Checking Printer',
      'Please wait...',
      [{ text: 'OK' }]
    );
    
    // STEP 1: Check printer availability
    const hasPrinter = await this.isPrinterAvailable();
    
    if (hasPrinter) {
      // ✅ PRINTER AVAILABLE - Try to print
      const printed = await this.tryPrint(saleData, userId);
      
      if (printed) {
        Alert.alert(
          '✅ Print Success',
          'Bill printed successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => {
                if (onComplete) onComplete();
              }
            }
          ]
        );
      } else {
        // Printer available but print failed
        Alert.alert(
          '❌ Print Failed',
          'Printer not responding. Do you want PDF?',
          [
            { 
              text: 'Yes', 
              onPress: () => this.handlePDFOption(saleData, userId, onComplete)
            },
            { 
              text: 'No', 
              onPress: () => {
                Alert.alert(
                  '✅ Transaction Success',
                  'Sale completed without bill',
                  [{ text: 'OK', onPress: onComplete }]
                );
              },
              style: 'cancel'
            }
          ]
        );
      }
      
    } else {
      // ❌ NO PRINTER - Ask for PDF
      Alert.alert(
        '🖨️ No Printer Detected',
        'No printer is available. Do you want PDF?',
        [
          { 
            text: 'Yes', 
            onPress: () => this.handlePDFOption(saleData, userId, onComplete)
          },
          { 
            text: 'No', 
            onPress: () => {
              Alert.alert(
                '✅ Transaction Success',
                'Sale completed without bill',
                [{ text: 'OK', onPress: onComplete }]
              );
            },
            style: 'cancel'
          }
        ]
      );
    }
  }
  
  // Handle PDF option
  static async handlePDFOption(
    saleData: any, 
    userId?: string | number,
    onComplete?: () => void
  ): Promise<void> {
    
    // Generate PDF
    const pdfUri = await this.generatePDF(saleData, userId);
    
    if (pdfUri) {
      // Share PDF
      const shared = await this.sharePDF(pdfUri);
      
      if (shared) {
        Alert.alert(
          '✅ PDF Generated',
          'Bill saved successfully!',
          [{ text: 'OK', onPress: onComplete }]
        );
      } else {
        Alert.alert(
          '📄 PDF Ready',
          `Bill saved at:\n${pdfUri}`,
          [{ text: 'OK', onPress: onComplete }]
        );
      }
    } else {
      Alert.alert(
        '❌ Error',
        'Failed to generate PDF',
        [{ text: 'OK', onPress: onComplete }]
      );
    }
  }
}

export default PrinterManager;