/** @jsxImportSource react */
import React from 'react';
import { Download, Printer, FileText, Calendar, User, MapPin, CreditCard, Package, Calculator } from 'lucide-react';

interface InvoiceProps {
  order: {
    id: string;
    customer: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    amount: number;
    shippingCharges?: number;
    status: string;
    date: string;
    items: any[];
    paymentMethod?: string;
  };
  showPrintButton?: boolean;
}

const GST_RATE = 0.18; // 18% GST
const COMPANY_NAME = 'V Tech Multi Solutions';
const COMPANY_LOGO = '/logo1.png'; // Local logo file
const COMPANY_LOGO_FALLBACK = '/logo2.png'; // Fallback logo

// Enhanced Base64 encoded Boult India logo as fallback
const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDIwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIxMDAiIHk9IjM1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMUY0Njg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CT1VMVCBJTERJQTWVDPC90ZXh0Pgo8dGV4dCB4PSIxMDAiIHk9IjU1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2Mzc0OEEiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlZlaGljbGUgQ2FyZSBTb2x1dGlvbnM8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI3MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIzIiBmaWxsPSIjMUY0Njg4Ii8+Cjwvc3ZnPgo=';

const Invoice: React.FC<InvoiceProps> = ({ order, showPrintButton = true }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const shippingCharges = order.shippingCharges || 0;
  const subtotal = order.amount / (1 + GST_RATE);
  const gstAmount = order.amount - subtotal;
  const grandTotal = order.amount + shippingCharges;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const element = document.getElementById('invoice-content');
      if (!element) return;

      // Load the local logo and convert to base64
      const loadLogoAsBase64 = (): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          
          img.onerror = () => {
            // Try fallback logo
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              canvas.width = fallbackImg.width;
              canvas.height = fallbackImg.height;
              ctx?.drawImage(fallbackImg, 0, 0);
              resolve(canvas.toDataURL('image/png'));
            };
            fallbackImg.onerror = () => resolve(LOGO_BASE64);
            fallbackImg.src = COMPANY_LOGO_FALLBACK;
          };
          
          img.src = COMPANY_LOGO;
        });
      };

      const logoBase64 = await loadLogoAsBase64();

      // Generate canvas from invoice with better quality
      const canvasElement = await html2canvas(element, { 
        useCORS: true, 
        scale: 3, // Higher scale for better quality
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: element.scrollHeight,
        height: element.scrollHeight,
        width: element.scrollWidth,
        onclone: (clonedDoc) => {
          // Replace all logo images with base64 in cloned document
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img: any) => {
            if (img.src.includes('logo1.png') || img.src.includes('logo2.png') || img.alt.includes('Logo')) {
              img.src = logoBase64;
            }
          });
        }
      });
      
      // Convert to image
      const imgData = canvasElement.toDataURL('image/png', 1.0);
      
      // Create PDF with proper dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      
      // Calculate image dimensions with margins
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvasElement.height * imgWidth) / canvasElement.width;
      
      // Add company logo at the top of first page
      try {
        pdf.addImage(logoBase64, 'PNG', margin, margin, 40, 20);
      } catch (logoError) {
        console.warn('Could not add logo to PDF:', logoError);
      }
      
      // Add invoice content
      let yPosition = margin + 25; // Start below logo
      
      if (imgHeight <= pageHeight - yPosition - margin) {
        // Single page
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      } else {
        // Multiple pages
        const pageContentHeight = pageHeight - yPosition - margin;
        let remainingHeight = imgHeight;
        let sourceY = 0;
        
        while (remainingHeight > 0) {
          const currentPageHeight = Math.min(pageContentHeight, remainingHeight);
          const sourceHeight = (currentPageHeight * canvasElement.height) / imgHeight;
          
          // Create a temporary canvas for this page section
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvasElement.width;
          pageCanvas.height = sourceHeight;
          
          pageCtx?.drawImage(
            canvasElement,
            0, sourceY, canvasElement.width, sourceHeight,
            0, 0, canvasElement.width, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          pdf.addImage(pageImgData, 'PNG', margin, yPosition, imgWidth, currentPageHeight);
          
          remainingHeight -= currentPageHeight;
          sourceY += sourceHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = margin; // Reset position for new page
            // Add smaller logo to subsequent pages
            try {
              pdf.addImage(logoBase64, 'PNG', margin, margin, 30, 15);
              yPosition = margin + 20;
            } catch (logoError) {
              console.warn('Could not add logo to subsequent page:', logoError);
            }
          }
        }
      }
      
      // Add metadata
      pdf.setProperties({
        title: `Invoice ${order.id} - Boult India`,
        subject: `Invoice for Order ${order.id}`,
        author: 'Boult India - V Tech Multi Solutions',
        creator: 'Boult India Admin Panel'
      });
      
      // Save with enhanced filename
      const fileName = `BoultIndia_Invoice_${order.id}_${order.customer.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to print
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'cod': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'netbanking': return '🏦';
      default: return '💰';
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch(method) {
      case 'cod': return 'Cash on Delivery';
      case 'card': return 'Credit/Debit Card';
      case 'upi': return 'UPI Payment';
      case 'netbanking': return 'Net Banking';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white">
      {/* Enhanced Action Bar */}
      {showPrintButton && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Invoice #{order.id}</h2>
                <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold shadow-sm"
              >
                <Printer size={18} />
                Print Invoice
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Content */}
      <div id="invoice-content" className="print:p-0 p-8">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 text-white p-8 rounded-xl mb-8 shadow-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              <div className="bg-white p-3 rounded-lg shadow-md">
                <img 
                  src={COMPANY_LOGO} 
                  alt="Boult India Logo" 
                  className="h-16 w-auto"
                  onError={(e: any) => {
                    // Try fallback logo first, then base64
                    if (e.target.src === COMPANY_LOGO) {
                      e.target.src = COMPANY_LOGO_FALLBACK;
                    } else {
                      e.target.src = LOGO_BASE64;
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{COMPANY_NAME}</h1>
                <p className="text-blue-200 text-lg">Professional Vehicle Care Solutions</p>
                <p className="text-blue-300 text-sm mt-1">GST Registered | ISO Certified</p>
              </div>
            </div>
            <div className="text-right bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <p className="text-3xl font-bold text-yellow-300">INVOICE</p>
              <div className="mt-3 space-y-1">
                <p className="text-blue-200">Invoice #: <span className="text-white font-semibold">{order.id}</span></p>
                <p className="text-blue-200">Date: <span className="text-white font-semibold">{new Date(order.date).toLocaleDateString('en-IN')}</span></p>
                <p className="text-blue-200">Status: <span className="text-yellow-300 font-bold">{order.status.toUpperCase()}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Order Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Customer Information Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <User className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">BILL TO</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 font-medium">Customer Name</p>
                <p className="font-bold text-gray-900 text-lg">{order.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Email Address</p>
                <p className="text-gray-800">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                <p className="text-gray-800">{order.phone}</p>
              </div>
            </div>
          </div>

          {/* Delivery Information Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <MapPin className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">DELIVER TO</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-800 font-medium">{order.address}</p>
              <p className="text-gray-700">{order.city}, {order.state}</p>
              <p className="text-gray-700">PIN: <span className="font-semibold">{order.pincode}</span></p>
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        {order.paymentMethod && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <CreditCard className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">PAYMENT METHOD</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getPaymentMethodIcon(order.paymentMethod)}</span>
              <span className="text-lg font-semibold text-gray-800">{getPaymentMethodName(order.paymentMethod)}</span>
            </div>
          </div>
        )}

        {/* Order Items Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
            <div className="flex items-center gap-3">
              <Package className="text-white" size={20} />
              <h3 className="text-lg font-bold">ORDER ITEMS</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-gray-900">Product Details</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-900">Variant</th>
                  <th className="px-6 py-4 text-center font-bold text-gray-900">Quantity</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-900">Unit Price</th>
                  <th className="px-6 py-4 text-right font-bold text-gray-900">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">SKU: {item.id || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.variant || 'Default'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-semibold">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₹{item.price ? item.price.toLocaleString('en-IN') : '0'}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      ₹{item.price && item.quantity ? (item.price * item.quantity).toLocaleString('en-IN') : '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Summary Section */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-96">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="text-blue-600" size={20} />
                Invoice Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Subtotal (Before GST):</span>
                  <span className="text-gray-900 font-semibold">₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">GST (18%):</span>
                  <span className="text-blue-600 font-semibold">₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                {shippingCharges > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">Shipping Charges:</span>
                    <span className="text-orange-600 font-semibold">₹{shippingCharges.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total Amount:</span>
                    <span className="font-bold text-2xl">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="bg-gradient-to-r from-gray-100 to-blue-100 border-t-2 border-blue-600 rounded-xl p-6 text-center">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Thank You for Your Business!</h4>
            <p className="text-gray-700">We appreciate your trust in our premium vehicle care products.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
            <div>
              <p className="font-semibold">Customer Support</p>
              <p>support@boultindia.com</p>
            </div>
            <div>
              <p className="font-semibold">Website</p>
              <p>www.boultindia.com</p>
            </div>
            <div>
              <p className="font-semibold">Business Hours</p>
              <p>Mon-Sat: 9:00 AM - 6:00 PM</p>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-4">
            <p className="text-xs text-gray-500">This is a computer-generated invoice and does not require a signature.</p>
            <p className="text-xs text-gray-500 mt-1">© 2026 V Tech Multi Solutions. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
