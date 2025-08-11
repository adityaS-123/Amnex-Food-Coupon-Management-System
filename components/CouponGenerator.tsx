import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useSettings } from '../contexts/SettingsContext';

interface CouponGeneratorProps {
  employeeId: string;
  couponCode: string;
  onCouponGenerated: () => void;
  onBack: () => void;
  remainingCoupons: number;
  isExistingCoupon: boolean;
}

export default function CouponGenerator() {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState(''); // Add state for employee name
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [menuPdfUrl, setMenuPdfUrl] = useState('');
  const [remainingCoupons, setRemainingCoupons] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');
  const [employeeIdError, setEmployeeIdError] = useState('');
  const [timeConstraintMessage, setTimeConstraintMessage] = useState('');
  const qrCanvasRef = useRef(null);
  const couponRef = useRef(null);

  // Get the latest settings directly from the context
  const { settings } = useSettings();
  
  // Format the time display using the current settings
  const formatTimeMessage = () => {
    const formatTime = (hour, minute) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
    };
    
    console.log('Formatting time message with settings:', settings);
    const startFormatted = formatTime(settings.startTime, settings.startMinutes || 0);
    const endFormatted = formatTime(settings.endTime, settings.endMinutes || 0);
    return `${startFormatted} to ${endFormatted}`;
  };

  useEffect(() => {
    // Fetch menu data on component mount
    fetchMenuData();
    
    // Fetch weekly menu PDF info
    fetch('/api/menu/pdf')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(data => {
        console.log('Menu PDF response:', data);
        if (data && data.pdfUrl) {
          setMenuPdfUrl(data.pdfUrl);
        }
      })
      .catch(err => {
        console.error('Error fetching weekly menu PDF:', err);
        setMenuPdfUrl(''); // Clear menu if error
      });
      
    // Fetch remaining coupons count
    fetch('/api/coupons/remaining')
      .then(response => {
        if (response.ok) return response.json();
        return null;
      })
      .then(data => {
        if (data && data.remaining !== undefined) {
          setRemainingCoupons(data);
        }
      })
      .catch(err => console.error('Error fetching remaining coupons:', err));
  }, []);

  const fetchMenuData = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    }
  };

  // Generate QR code when coupon code changes
  useEffect(() => {
    if (couponCode && qrCanvasRef.current) {
      // Create a URL that will directly mark attendance
      const attendanceUrl = `${window.location.origin}/scan-qr?code=${encodeURIComponent(couponCode)}&auto=true`;
      
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(qrCanvasRef.current, attendanceUrl, { 
          width: 150,
          color: {
            dark: '#8B4513',
            light: '#FFFFFF'
          }
        }).catch(err => console.error('QR Code generation error:', err));
      });
    }
  }, [couponCode]);

  // Validate employee ID format (AIPL followed by 4 digits)
const validateEmployeeId = (id) => {
  const employeeIdRegex = /^AIPL[A-Z]*\d+$/;
  return employeeIdRegex.test(id);
};

  // Handle employee ID input change with validation
  const handleEmployeeIdChange = (e) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase for consistency
    setEmployeeId(value);
    
    if (value && !validateEmployeeId(value)) {
      setEmployeeIdError('Employee ID must be in format: AIPL followed by your code.');
    } else {
      setEmployeeIdError('');
    }
  };

  // Remove the local generateUniqueCode function since we'll use the server-generated sequential codes
  const handleGenerateCoupon = () => {
    if (!employeeId.trim()) {
      setMessage('Please enter your Employee ID');
      return;
    }
    
    if (!validateEmployeeId(employeeId)) {
      setMessage('Invalid Employee ID format. Must be AIPL followed by your code');
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  const confirmAndGenerateCoupon = async () => {
    setShowConfirmation(false);
    setLoading(true);
    setMessage('');
    setTimeConstraintMessage('');
    
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          couponCode: 'temp',
          sendEmail: true
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCouponCode(data.coupon.couponCode);
        setEmployeeName(data.coupon.employeeName); // Store employee name from response
        
        if (data.isExisting) {
          if (data.emailSent) {
            setMessage('You already have a coupon for today! Your existing coupon has been retrieved and sent to your email.');
          } else {
            setMessage('You already have a coupon for today! Here is your existing coupon.');
          }
        } else {
          setMessage('Coupon generated successfully! Check your email for the coupon details.');
        }
        
        // Show additional email info if available
        if (data.emailSent && data.employeeEmail) {
          setTimeout(() => {
            setMessage(prev => prev + ` Email sent to ${data.employeeEmail}.`);
          }, 1500);
        }
      } else {
        // Handle error case when employee ID doesn't exist in database
        if (response.status === 404 && data.message.includes('Employee ID not found')) {
          setMessage(`Error: ${data.message}`);
        } 
        // Check if it's a time constraint error
        else if (data.message && data.message.includes('Coupon generation is only allowed between')) {
          setTimeConstraintMessage(data.message);
        } else {
          setMessage(`Error: ${data.message || 'Failed to generate coupon'}`);
        }
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      setMessage('An error occurred while generating the coupon.');
    } finally {
      setLoading(false);
    }
  };
  
  const cancelGeneration = () => {
    setShowConfirmation(false);
    setMessage('Coupon generation canceled.');
  };

  const generatePDF = async () => {
    if (!couponCode || !couponRef.current) return;
    
    setMessage('Generating PDF...');
    
    try {
      const canvas = await html2canvas(couponRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFF8E1'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A4 size: 210mm × 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate aspect ratio to fit the image
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const scaledWidth = imgWidth * ratio * 0.9; // 90% of page width
      const scaledHeight = imgHeight * ratio * 0.9; // 90% of page height
      
      // Center the image
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('AMNEX Food Service - Generated on ' + new Date().toLocaleString(), pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage('Failed to generate PDF. Please try again.');
      return null;
    }
  };

  const handleSharePDF = async () => {
    const pdf = await generatePDF();
    if (!pdf) return;
    
    const pdfBlob = pdf.output('blob');
    
    // Try using Web Share API for sharing files
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], 'coupon.pdf', { type: 'application/pdf' })] })) {
      try {
        await navigator.share({
          title: 'AMNEX Food Coupon',
          text: `Food coupon for ${employeeId}`,
          files: [new File([pdfBlob], 'coupon.pdf', { type: 'application/pdf' })]
        });
        setMessage('PDF shared successfully!');
      } catch (error) {
        console.log('Error sharing PDF:', error);
        downloadPDF(pdf);
      }
    } else {
      // Fallback to download
      downloadPDF(pdf);
    }
  };
  
  const downloadPDF = (pdf) => {
    try {
      pdf.save(`AMNEX_Coupon_${couponCode}.pdf`);
      setMessage('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setMessage('Failed to download PDF. Please try again.');
    }
  };

  return (
    <>
      {showConfirmation ? (
        <div className={styles.confirmationDialog}>
          <h3>Generate Daily Meal Coupon?</h3>
          <p>You are about to generate a meal coupon for today.</p>
          <p className={styles.confirmationNote}>
            Note: If you already have a coupon for today, we'll show your existing one. The coupon will be sent to your registered email address and is valid only for today's meal service.
          </p>
          
          <div className={styles.confirmationButtons}>
            <button 
              onClick={confirmAndGenerateCoupon} 
              className={styles.confirmButton}
              disabled={loading}
            >
              {loading ? 'Checking & Sending Email...' : 'Yes, Get My Coupon'}
            </button>
            <button 
              onClick={cancelGeneration} 
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : !couponCode ? (
        <>
          {remainingCoupons && (
            <div className={`${styles.couponCounter} ${remainingCoupons.remaining < 10 ? styles.low : ''}`}>
              <div className={styles.counterValue}>
                <span className={styles.counterNumber}>{remainingCoupons.remaining}</span>
                <span className={styles.counterLabel}>coupons remaining<br/>for today</span>
              </div>
              <div className={styles.counterProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${Math.round((remainingCoupons.remaining / remainingCoupons.total) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <label htmlFor="employeeId">Employee ID:</label>
            <input
              id="employeeId"
              type="text"
              placeholder="Enter your Employee ID"
              value={employeeId}
              onChange={handleEmployeeIdChange}
              className={`${styles.input} ${employeeIdError ? styles.inputError : ''}`}
              disabled={loading}
            />
            {employeeIdError && (
              <p className={styles.fieldError}>{employeeIdError}</p>
            )}
          </div>
          
          <button 
            onClick={handleGenerateCoupon} 
            disabled={loading || !employeeId.trim() || !!employeeIdError} 
            className={styles.button}
          >
            {loading ? 'Generating...' : 'Generate Coupon'}
          </button>

          {/* Display time constraint message above the menu */}
          {timeConstraintMessage && (
            <div className={styles.timeConstraintAlert}>
              <div className={styles.alertIcon}>⏰</div>
              <div className={styles.alertContent}>
                <strong>Service Hours:</strong>
                <p>{timeConstraintMessage}</p>
              </div>
            </div>
          )}

          {/* Display no coupons left message above the menu */}
          {remainingCoupons && remainingCoupons.remaining === 0 && (
            <div className={styles.noCouponsAlert}>
              <div className={styles.alertIcon}>🚫</div>
              <div className={styles.alertContent}>
                <strong>No Coupons Available:</strong>
                <p>All {remainingCoupons.total} coupons for today have been generated. Please try again tomorrow.</p>
              </div>
            </div>
          )}

          {menuPdfUrl && (
            <div className={styles.menuPdfContainer}>
              <h3>This Week's Menu</h3>
              <div className={styles.menuPdfDisplay}>
                <iframe
                  src={`${menuPdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className={styles.menuPdfFrame}
                  title="Weekly Menu"
                  onLoad={() => console.log('Menu PDF loaded successfully')}
                  onError={() => {
                    console.error('Menu PDF failed to load');
                    setMenuPdfUrl(''); // Clear menu if iframe fails
                  }}
                />
              </div>
              <a 
                href={menuPdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.viewFullMenuButton}
              >
                View Full Menu
              </a>
            </div>
          )}
          
          {message && (
            <div className={`${styles.message} ${message.includes('Error') || message.includes('Failed') ? styles.error : styles.success}`}>
              <p>{message}</p>
            </div>
          )}
        </>
      ) : (
        <div className={styles.generatedCoupon}>
          <div ref={couponRef} className={styles.couponContainer}>
            <div className={styles.couponHeader}>
              <h2>Your Food Coupon</h2>
              <div className={styles.couponCode}>{couponCode}</div>
            </div>
            
            <div className={styles.couponBody}>
              <div className={styles.qrCodeSection}>
                <canvas 
                  ref={qrCanvasRef}
                  className={styles.qrCanvas}
                />
                <p className={styles.qrInstructions}>
                  Scan this QR code to mark your attendance
                </p>
              </div>

              <div className={styles.couponDetails}>
                {/* Display employee name */}
                {employeeName && <p><strong>Name:</strong> {employeeName}</p>}
                <p><strong>Employee ID:</strong> {employeeId}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Valid for:</strong> Today's meal service</p>
              </div>
            </div>
          </div>

          <div className={styles.couponActions}>
            <button onClick={() => window.print()} className={styles.printButton}>
              🖨️ Print
            </button>
            <button onClick={handleSharePDF} className={styles.pdfButton}>
              📄 Share PDF
            </button>
        
            <button 
              onClick={() => {
                setCouponCode('');
                setEmployeeId('');
                setMessage('');
              }} 
              className={styles.downloadButton}
            >
              🔄 New Coupon
            </button>
          </div>
        </div>
      )}
    </>
  );
}