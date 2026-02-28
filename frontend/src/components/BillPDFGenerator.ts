// components/BillPDFGenerator.ts - FULL WORKING VERSION

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api';

interface CompanySettings {
  name: string;
  address: string;
  gstNo: string;
  gstPercentage: number;
  phone: string;
  email: string;
  cashierName: string;
}

class BillPDFGenerator {
  
  // Load settings from database
  static async loadSettings(userId?: string | number): Promise<CompanySettings> {
    try {
      if (!userId) {
        return this.getDefaultSettings();
      }
      
      console.log('📥 Loading company settings for user:', userId);
      
      const response = await API.get(`/company-settings/${userId}`);
      
      if (response.data && response.data.success) {
        const settings = response.data.settings;
        return {
          name: settings.CompanyName || 'POS System',
          address: settings.Address || '',
          gstNo: settings.GSTNo || '',
          gstPercentage: settings.GSTPercentage || 0,
          phone: settings.Phone || '',
          email: settings.Email || '',
          cashierName: settings.CashierName || 'Admin'
        };
      }
      
      return this.getDefaultSettings();
      
    } catch (error) {
      console.log('❌ Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  private static getDefaultSettings(): CompanySettings {
    return {
      name: 'UNIPRO SOFTWARES SG PTE LTD',
      address: 'No. 123, MG Road, Pondicherry - 605004',
      gstNo: '34ABCDE1234F1Z5',
      gstPercentage: 5,
      phone: '+91 98765 43210',
      email: 'support@uniprosoftwares.com',
      cashierName: 'Admin'
    };
  }

  static async saveSettings(settings: CompanySettings, userId?: string | number): Promise<boolean> {
    try {
      if (!userId) return false;
      
      const dbSettings = {
        CompanyName: settings.name,
        Address: settings.address,
        GSTNo: settings.gstNo,
        GSTPercentage: settings.gstPercentage,
        Phone: settings.phone,
        Email: settings.email,
        CashierName: settings.cashierName
      };
      
      const response = await API.post(`/company-settings/${userId}`, dbSettings);
      return response.data?.success || false;
      
    } catch (error) {
      console.log('❌ Error saving settings:', error);
      return false;
    }
  }

  // ✅ COMPLETE HTML TEMPLATE WITH PROPER CSS
  static async generateHTML(saleData: any, userId?: string | number): Promise<string> {
    const company = await this.loadSettings(userId);
    
    const date = new Date();
    const billNo = `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random()*9000)}`;
    
    // Calculate GST
    const hasGST = company.gstPercentage > 0;
    const gstRate = hasGST ? company.gstPercentage / 2 : 0;
    
    const subtotal = saleData.total;
    const cgst = hasGST ? subtotal * (gstRate / 100) : 0;
    const sgst = hasGST ? subtotal * (gstRate / 100) : 0;
    const grandTotal = hasGST ? subtotal + cgst + sgst : subtotal;

    // Generate items HTML
    const itemsHTML = saleData.items.map((item: any) => `
      <tr>
        <td style="text-align: left; padding: 6px 4px; border-bottom: 1px dashed #ddd;">${item.name}</td>
        <td style="text-align: center; padding: 6px 4px; border-bottom: 1px dashed #ddd;">${item.quantity}</td>
        <td style="text-align: right; padding: 6px 4px; border-bottom: 1px dashed #ddd;">₹${item.price.toFixed(2)}</td>
        <td style="text-align: right; padding: 6px 4px; border-bottom: 1px dashed #ddd;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // ✅ FULL HTML WITH CSS
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Invoice</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', Courier, monospace;
            background: #f5f5f5;
            padding: 20px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
          }
          
          .bill-container {
            max-width: 320px;
            width: 100%;
            background: white;
            padding: 20px 15px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          /* Header Section */
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }
          
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #FF4444;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          
          .company-address {
            font-size: 10px;
            color: #666;
            line-height: 1.4;
            margin-bottom: 6px;
            padding: 0 5px;
          }
          
          .gst-info {
            font-size: 10px;
            color: #444;
            background: #f0f0f0;
            padding: 5px 8px;
            border-radius: 4px;
            margin: 8px 0;
            font-weight: 600;
          }
          
          .contact-info-header {
            font-size: 9px;
            color: #777;
            margin-top: 5px;
          }
          
          /* Bill Details */
          .bill-details {
            margin-bottom: 15px;
            padding: 12px 10px;
            background: #f8f8f8;
            border-radius: 8px;
            font-size: 11px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .detail-label {
            color: #666;
            font-weight: 600;
          }
          
          .detail-value {
            color: #333;
            font-weight: 500;
          }
          
          .cashier-name {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #aaa;
            font-style: italic;
          }
          
          /* Items Table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 11px;
          }
          
          .items-table th {
            background: #FF4444;
            color: white;
            padding: 8px 4px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 10px;
            text-align: center;
          }
          
          .items-table th:first-child {
            text-align: left;
            padding-left: 8px;
          }
          
          .items-table th:last-child {
            text-align: right;
            padding-right: 8px;
          }
          
          .items-table td {
            padding: 6px 4px;
          }
          
          .items-table tr:last-child td {
            border-bottom: none;
          }
          
          /* Totals Section */
          .totals {
            margin-bottom: 15px;
            padding: 12px 10px;
            background: #f8f8f8;
            border-radius: 8px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
          }
          
          .total-row.final {
            border-top: 2px solid #333;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            font-size: 13px;
            color: #FF4444;
          }
          
          /* Payment Info */
          .payment-info {
            margin-bottom: 15px;
            padding: 12px 10px;
            background: #e8f5e9;
            border-radius: 8px;
            font-size: 11px;
          }
          
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          /* Footer */
          .footer {
            text-align: center;
            padding-top: 15px;
            border-top: 2px solid #333;
          }
          
          .thankyou {
            font-size: 14px;
            font-weight: bold;
            color: #FF4444;
            margin-bottom: 8px;
          }
          
          .tamil-message {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            font-style: italic;
          }
          
          .contact-info {
            font-size: 9px;
            color: #777;
            line-height: 1.4;
            margin-bottom: 8px;
          }
          
          .copyright {
            font-size: 8px;
            color: #aaa;
            margin-top: 8px;
          }
          
          /* Utility Classes */
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="bill-container">
          
          <!-- Header -->
          <div class="header">
            <div class="company-name">${company.name}</div>
            <div class="company-address">${company.address}</div>
            ${company.gstNo ? `<div class="gst-info">GST: ${company.gstNo}</div>` : ''}
            <div class="contact-info-header">
              ${company.phone ? `📞 ${company.phone}` : ''}
              ${company.email ? `${company.phone ? ' | ' : ''}📧 ${company.email}` : ''}
            </div>
          </div>
          
          <!-- Bill Details -->
          <div class="bill-details">
            <div class="detail-row">
              <span class="detail-label">Bill No:</span>
              <span class="detail-value">${billNo}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
            </div>
            ${company.cashierName ? `
            <div class="detail-row cashier-name">
              <span class="detail-label">Cashier:</span>
              <span class="detail-value">${company.cashierName}</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="text-left">Item</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Sub Total:</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${hasGST ? `
            <div class="total-row">
              <span>CGST (${gstRate}%):</span>
              <span>₹${cgst.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>SGST (${gstRate}%):</span>
              <span>₹${sgst.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
              <span>Grand Total:</span>
              <span>₹${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <!-- Payment Details -->
          <div class="payment-info">
            <div class="payment-row">
              <span>Payment Method:</span>
              <span><strong>${saleData.paymentMethod || 'Cash'}</strong></span>
            </div>
            <div class="payment-row">
              <span>Amount Paid:</span>
              <span>₹${saleData.total.toFixed(2)}</span>
            </div>
            ${saleData.change ? `
            <div class="payment-row">
              <span>Change Returned:</span>
              <span>₹${saleData.change.toFixed(2)}</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="thankyou">${this.getTamilMessage()}</div>
            <div class="tamil-message">🌟 மீண்டும் வருக! 🌟</div>
            <div class="contact-info">
              ${company.phone ? `📞 ${company.phone}` : ''}
              ${company.email ? `${company.phone ? ' | ' : ''}📧 ${company.email}` : ''}
            </div>
            <div class="copyright">
              ${company.name}
              © ${date.getFullYear()} All Rights Reserved
            </div>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  static getTamilMessage(): string {
    const messages = [
      
      'Thank You! Come Again! 🤝',
     
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static async generatePDF(saleData: any, userId?: string | number): Promise<string> {
    try {
      const html = await this.generateHTML(saleData, userId);
      console.log('📄 Generating PDF with HTML length:', html.length);
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
        width: 612 // US Letter width in points
      });
      
      console.log('✅ PDF generated at:', uri);
      return uri;
    } catch (error) {
      console.error('❌ PDF Error:', error);
      throw error;
    }
  }

  static async downloadPDF(saleData: any, userId?: string | number): Promise<void> {
    try {
      const pdfUri = await this.generatePDF(saleData, userId);
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Bill Receipt',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('✅ PDF Generated', `Bill saved at:\n${pdfUri}`);
      }
    } catch (error) {
      console.error('❌ Share Error:', error);
      Alert.alert('Error', 'Failed to generate bill');
    }
  }
}

export default BillPDFGenerator;