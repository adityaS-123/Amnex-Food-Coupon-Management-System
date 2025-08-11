import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import styles from '../styles/Admin.module.css';
import Image from 'next/image';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [reportStartDate, setReportStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState({
    employeeStats: {
      totalUniqueEmployees: 0,
      activeEmployees: 0,
      employeeList: []
    },
    salesStats: {
      totalSales: 0
    },
    orderStats: {
      totalOrders: 0
    },
    dateRange: {
      startDate: null,
      endDate: null
    },
    raw: [],
    totalCoupons: 0,
    dailyBreakdown: {}
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportView, setReportView] = useState('overview');
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [menuData, setMenuData] = useState({
    lunch: { items: [''], time: '12:00 PM - 2:00 PM' },
    specialNote: ''
  });
  const [couponData, setCouponData] = useState([]);
  const [todaysCoupons, setTodaysCoupons] = useState([]); // New state for today's coupons
  const [couponStats, setCouponStats] = useState({
    totalCoupons: 0,
    dailyCoupons: 0,
    employeeCount: 0
  });
  const [showReport, setShowReport] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    maxCoupons: 70,
    startTime: 10,
    startMinutes: 0,
    endTime: 23,
    endMinutes: 0,
    guestCoupons: 20,
    newEmployeeCoupons: 10,
    openCoupons: 15 // Add default value for open coupons
  });
  const [message, setMessage] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [newlyGeneratedCoupon, setNewlyGeneratedCoupon] = useState('');
  const [lastGeneratedSpecialCoupon, setLastGeneratedSpecialCoupon] = useState(null);
  const { settings, updateSettings } = useSettings();

  const ADMIN_PASSWORD = 'admin123';
  const [loading, setLoading] = useState(false);
  const [menuPdf, setMenuPdf] = useState(null);
  const [menuPdfUrl, setMenuPdfUrl] = useState('');
  const [menuUploadProgress, setMenuUploadProgress] = useState(0);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setTempSettings({
        maxCoupons: settings.maxCoupons || 70,
        startTime: settings.startTime || 10,
        startMinutes: settings.startMinutes || 0,
        endTime: settings.endTime || 23,
        endMinutes: settings.endMinutes || 0,
        guestCoupons: (settings as any).guestCoupons || 20,
        newEmployeeCoupons: (settings as any).newEmployeeCoupons || 10,
        openCoupons: (settings as any).openCoupons || 15 // Load openCoupons setting
      });
    }
  }, [settings]);

  // Fetch today's coupon data
  useEffect(() => {
    const fetchTodaysCoupons = async () => {
      if (isAuthenticated) {
        const today = new Date().toISOString().split('T')[0];
        try {
          const response = await fetch(`/api/coupons?date=${today}`);
          if (response.ok) {
            const data = await response.json();
            setTodaysCoupons(data);
            
            // Update today's stats
            setCouponStats(prev => ({
              ...prev,
              dailyCoupons: data.length,
              employeeCount: new Set(data.map(coupon => coupon.employeeId)).size
            }));
          }
        } catch (error) {
          console.error('Error fetching today\'s coupons:', error);
        }
      }
    };
    
    fetchTodaysCoupons();
  }, [isAuthenticated]); // Only depends on authentication, not report dates

  // Fetch coupon data when report date changes (for reports only)
  useEffect(() => {
    const fetchCoupons = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          const response = await fetch(`/api/coupons?date=${reportStartDate}`);
          if (response.ok) {
            const data = await response.json();
            setCouponData(data);
          } else {
            console.error('Failed to fetch coupon data');
          }
        } catch (error) {
          console.error('Error fetching coupon data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchCoupons();
  }, [reportStartDate, isAuthenticated]);
  
  // Fetch total coupon count on initial load
  useEffect(() => {
    const fetchTotalCoupons = async () => {
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/coupons/stats');
          if (response.ok) {
            const data = await response.json();
            setCouponStats(prev => ({
              ...prev,
              totalCoupons: data.totalCount || 0
            }));
          }
        } catch (error) {
          console.error('Error fetching coupon stats:', error);
        }
      }
    };
    
    fetchTotalCoupons();
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setMessage('Invalid password');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setMessage('');
  };

  // Fetch settings directly from file system on page load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          console.log('LOADED SETTINGS:', data);
          // Make sure we're setting state with the exact values from the server
          setTempSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Save settings without merging with defaults
  const handleSaveSettings = async () => {
    setMessage('');
    try {
      // Log what we're about to send
      console.log('SAVING SETTINGS:', settings);
      
      // Send exactly what we have in state
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tempSettings),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update state with confirmed saved settings
        setTempSettings(data.settings);
        setMessage('Settings saved successfully!');
        
        // Show exactly what was saved
        console.log('SETTINGS SAVED CONFIRMATION:', data.settings);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings. Please try again.');
    }
  };

  // Direct update of state with the actual value
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempSettings(prev => ({
      ...prev,
      [name]: value.includes('.') ? parseFloat(value) : parseInt(value, 10)
    }));
  };

  // Generates a unique coupon code (simple random alphanumeric string)
  function generateUniqueCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  const handleGenerateCoupon = async () => {
    if (!employeeId) {
      alert('Please enter an Employee ID.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const newCouponCode = generateUniqueCode();
      console.log('Generating coupon with code:', newCouponCode);
      
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          couponCode: newCouponCode
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Coupon created successfully:', data);
        setNewlyGeneratedCoupon(data.coupon.couponCode);
        setEmployeeId(''); // Clear input after generation
        setMessage('Coupon generated successfully! Email notification sent.');
        
        // Refresh today's coupons regardless of report date
        const today = new Date().toISOString().split('T')[0];
        const todayResponse = await fetch(`/api/coupons?date=${today}`);
        if (todayResponse.ok) {
          const todayData = await todayResponse.json();
          setTodaysCoupons(todayData);
          setCouponStats(prev => ({
            ...prev,
            dailyCoupons: todayData.length,
            employeeCount: new Set(todayData.map(coupon => coupon.employeeId)).size
          }));
        }
        
        // Also refresh report data if the generated coupon is for the report date
        if (data.coupon.dateCreated === reportStartDate) {
          await fetchCouponsForDate(reportStartDate);
        }
      } else {
        console.error('Failed to generate coupon:', data);
        setMessage(`Error: ${data.message || 'Failed to generate coupon'}`);
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      setMessage('An error occurred while generating the coupon.');
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (newlyGeneratedCoupon) setNewlyGeneratedCoupon('');
      }, 5000);
    }
  };

  // Create a reusable function for fetching coupons
  const fetchCouponsForDate = async (date: string) => {
    setLoading(true);
    try {
      console.log('Fetching coupons for date:', date);
      const response = await fetch(`/api/coupons?date=${date}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('Fetched coupons:', data.length);
        setCouponData(data);
        return data;
      } else {
        console.error('API error:', data);
        setMessage(`Error fetching coupons: ${data.message || 'Unknown error'}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setMessage('Failed to fetch coupon data.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to use the new function
  useEffect(() => {
    if (isAuthenticated) {
      fetchCouponsForDate(reportStartDate);
    }
  }, [reportStartDate, isAuthenticated]);

  const handleDownload = () => {
    if (couponData.length === 0) {
      alert(`No data available for ${reportStartDate}`);
      return;
    }

    // Convert data to CSV format
    const headers = ['Employee ID', 'Coupon Code', 'Creation Date'];
    const csvContent = [
      headers.join(','),
      ...couponData.map(item => `${item.employeeId},${item.couponCode},${item.createdAt}`)
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `coupon_report_${reportStartDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewReport = () => {
    setShowReport(true);
    setReportData({
      employeeStats: {
        totalUniqueEmployees: new Set(couponData.map(item => item.employeeId)).size,
        activeEmployees: new Set(couponData.map(item => item.employeeId)).size,
        employeeList: Array.from(
          couponData.reduce((acc, item) => {
            acc.set(item.employeeId, (acc.get(item.employeeId) || 0) + 1);
            return acc;
          }, new Map())
        ).map(([employeeId, count]) => ({ employeeId, couponCount: count }))
      },
      salesStats: {
        totalSales: couponData.reduce((sum, item) => sum + (item.amount || 0), 0)
      },
      orderStats: {
        totalOrders: couponData.length
      },
      dateRange: {
        startDate: reportStartDate,
        endDate: reportStartDate
      },
      raw: couponData,
      totalCoupons: couponData.length,
      dailyBreakdown: {
        [reportStartDate]: couponData.length
      }
    });
  };

  const formatTime12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const convert12HourTo24Hour = (hour12: number, period: string) => {
    if (period === 'AM' && hour12 === 12) return 0;
    if (period === 'PM' && hour12 !== 12) return hour12 + 12;
    return hour12;
  };

  const convert24HourTo12Hour = (hour24: number) => {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setMessage('');
    
    try {
      const response = await fetch(
        `/api/reports?startDate=${reportStartDate}&endDate=${reportEndDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setShowReport(true);
        setMessage(`Report generated successfully! Found ${data.totalCoupons} coupons between ${reportStartDate} and ${reportEndDate}`);
      } else {
        const errorData = await response.json();
        setMessage(`Error generating report: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setMessage('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportData) return;

    const csvData = [
      ['Employee ID', 'Coupon Code', 'Date Created', 'Time Created'],
      ...reportData.raw.map(item => [
        item.employeeId,
        item.couponCode,
        item.dateCreated,
        new Date(item.createdAt).toLocaleString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amnex_coupon_report_${reportStartDate}_to_${reportEndDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateSpecialCoupon = async () => {
    setMessage('');
    try {
      // Get today's date in M/D/YY format
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear().toString().substr(-2);
      const dateFormatted = `${month}/${day}/${year}`;
      
      // Generate sequence number
      const timestamp = Date.now();
      const sequenceNumber = Math.floor(timestamp % 10000);
      
      // Format: AMNEX-[Sequence Number]-[Date]
      const couponCode = `AMNEX-${sequenceNumber}-${dateFormatted}`;
      
      const selectedType = (document.querySelector('input[name="couponType"]:checked') as HTMLInputElement)?.value;
      
      if (!selectedType) {
        alert('Please select a coupon type (Guest or New Employee)');
        return;
      }

      setLoading(true);
      setMessage('');

      const response = await fetch('/api/coupons/special', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponType: selectedType,
          couponCode // Include the generated coupon code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${selectedType} coupon generated successfully! Code: ${data.coupon.couponCode}. Remaining: ${data.remaining}`);
        setLastGeneratedSpecialCoupon({
          ...data.coupon,
          type: selectedType
        });
        
        // Reset radio selection
        (document.querySelector('input[name="couponType"]:checked') as HTMLInputElement).checked = false;
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error generating special coupon:', error);
      setMessage('An error occurred while generating the coupon.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpecialCoupon = () => {
    if (!lastGeneratedSpecialCoupon) return;

    const couponData = {
      code: lastGeneratedSpecialCoupon.couponCode,
      type: lastGeneratedSpecialCoupon.type,
      generatedDate: new Date(lastGeneratedSpecialCoupon.createdAt).toLocaleDateString(),
      generatedTime: new Date(lastGeneratedSpecialCoupon.createdAt).toLocaleTimeString(),
      validFor: lastGeneratedSpecialCoupon.type === 'guest' ? 'Guest Access' : 'New Employee Access'
    };

    const csvContent = [
      ['Coupon Code', 'Type', 'Generated Date', 'Generated Time', 'Valid For'],
      [couponData.code, couponData.type, couponData.generatedDate, couponData.generatedTime, couponData.validFor]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lastGeneratedSpecialCoupon.type}_coupon_${lastGeneratedSpecialCoupon.couponCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareSpecialCoupon = async () => {
    if (!lastGeneratedSpecialCoupon) return;

    // Create a visual coupon display with QR code
    const couponWindow = window.open('', '_blank', 'width=800,height=700');
    const couponHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AMNEX Food Coupon</title>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #FFF8E1 0%, #FFE0B2 100%);
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .coupon-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            border: 3px solid #FF6B35;
            max-width: 600px;
            text-align: center;
            position: relative;
          }
          .coupon-header {
            background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
            color: white;
            padding: 20px;
            margin: -40px -40px 30px -40px;
            border-radius: 20px 20px 0 0;
          }
          .coupon-title {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
          }
          .coupon-type {
            background: #FF6B35;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            display: inline-block;
          }
          .coupon-code {
            font-size: 36px;
            font-weight: bold;
            color: #8B4513;
            background: #FFD166;
            padding: 15px 30px;
            border-radius: 15px;
            border: 2px dashed #FF6B35;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
          }
          .coupon-details {
            font-size: 16px;
            color: #666;
            margin: 20px 0;
          }
          .coupon-footer {
            background: #FFF8E1;
            padding: 15px;
            margin: 30px -40px -40px -40px;
            border-radius: 0 0 20px 20px;
            font-size: 14px;
            color: #8B4513;
          }
          .print-button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px 10px;
          }
          .print-button:hover {
            background: #45a049;
          }
          .qr-section {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: #FFF8E1;
            border: 2px dashed #FF6B35;
            border-radius: 15px;
          }
          .qr-canvas {
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .qr-instructions {
            margin-top: 10px;
            color: #8B4513;
            font-weight: bold;
          }
          @media print {
            body { background: white; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="coupon-container">
          <div class="coupon-header">
            <h1 class="coupon-title">AMNEX FOOD COUPON</h1>
          </div>
          
          <div class="coupon-type">
            ${lastGeneratedSpecialCoupon.type === 'guest' ? 'GUEST COUPON (PAID)' : 'NEW EMPLOYEE COUPON (PAID)'}
          </div>
          
          <div class="coupon-code">
            ${lastGeneratedSpecialCoupon.couponCode}
          </div>
          
          <div class="qr-section">
            <canvas id="qr-canvas" class="qr-canvas"></canvas>
            <div class="qr-instructions">Scan this QR code to mark attendance</div>
          </div>
          
          <div class="coupon-details">
            <p><strong>Generated:</strong> ${new Date(lastGeneratedSpecialCoupon.createdAt).toLocaleDateString()}</p>
            <p><strong>Valid For:</strong> Today's meal service</p>
            <p><strong>Type:</strong> ${lastGeneratedSpecialCoupon.type === 'guest' ? 'Guest Access' : 'New Employee Access'}</p>
          </div>
          
          <button class="print-button" onclick="window.print()">🖨️ Print Coupon</button>
          <button class="print-button" onclick="window.close()">✕ Close</button>
          
          <div class="coupon-footer">
            <p>Present this coupon at the cafeteria for your meal</p>
            <p>© ${new Date().getFullYear()} AMNEX. All rights reserved.</p>
          </div>
        </div>
        
        <script>
          // Generate QR code after page loads
          window.onload = function() {
            const canvas = document.getElementById('qr-canvas');
            const attendanceUrl = window.location.origin + '/scan-qr?code=${encodeURIComponent(lastGeneratedSpecialCoupon.couponCode)}&auto=true';
            QRCode.toCanvas(canvas, attendanceUrl, {
              width: 150,
              color: {
                dark: '#8B4513',
                light: '#FFFFFF'
              }
            });
          };
        </script>
      </body>
      </html>
    `;
    
    couponWindow.document.write(couponHtml);
    couponWindow.document.close();
  };

  const fetchAttendanceData = async () => {
    setIsLoadingAttendance(true);
    setMessage('');
    try {
      const params = new URLSearchParams();
      if (attendanceDate) params.append('date', attendanceDate);
      if (attendanceFilter !== 'all') params.append('status', attendanceFilter);

      console.log('Fetching attendance with params:', params.toString());
      const response = await fetch(`/api/attendance/list?${params}`);
      const data = await response.json();
      
      console.log('Attendance response:', data);
      
      if (response.ok) {
        setAttendanceData(data);
        setMessage(`Loaded ${data.totalCoupons} records for ${attendanceDate}`);
      } else {
        console.error('Failed to fetch attendance:', data);
        setMessage(`Failed to fetch attendance: ${data.message}`);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setMessage('Error fetching attendance data. Check console for details.');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const downloadAttendanceReport = () => {
    if (!attendanceData) return;

    const csvData = [
      ['Employee ID', 'Type', 'Coupon Code', 'Status', 'Marked At'],
      ...attendanceData.attendanceList.map(item => [
        item.employeeId,
        item.couponType,
        item.couponCode,
        item.isPresent ? 'Present' : 'Absent',
        item.attendanceMarkedAt ? new Date(item.attendanceMarkedAt).toLocaleString() : 'N/A'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${attendanceDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchMenuData = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
      } else {
        console.error('Failed to fetch menu data');
        setMessage('Failed to fetch menu data');
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      setMessage('Error fetching menu data');
    }
  };

  // Fetch menu PDF with error handling
  const fetchMenuPdf = async () => {
    try {
      console.log('Fetching menu PDF...');
      const response = await fetch('/api/menu/pdf');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Menu PDF data received:', data);
        
        if (data.pdfUrl) {
          setMenuPdfUrl(data.pdfUrl);
          setMessage(`Menu loaded successfully`);
        } else {
          console.log('No PDF URL in response');
          setMessage('Menu data found but no PDF URL available');
        }
      } else {
        const errorData = await response.json();
        console.log('No menu PDF available:', errorData.message);
        setMessage('No menu PDF available yet');
      }
    } catch (error) {
      console.error('Error fetching menu PDF:', error);
      setMessage('Error loading menu PDF');
    }
  };

  const handleMenuPdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setMenuPdf(file);
    } else {
      setMessage('Please select a valid PDF file');
    }
  };

  const handleUploadMenuPdf = async () => {
    if (!menuPdf) {
      setMessage('Please select a PDF file first');
      return;
    }

    setMessage('Uploading menu PDF to local storage...');
    setMenuUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('menuPdf', menuPdf);
      
      console.log('Uploading file:', {
        name: menuPdf.name,
        size: menuPdf.size,
        type: menuPdf.type
      });
      
      const response = await fetch('/api/menu/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setMenuUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      const responseData = await response.json();
      console.log('Upload response:', responseData);
      
      if (!response.ok) {
        console.error('Upload error:', responseData);
        setMessage(`Upload failed: ${responseData.message || 'Unknown error'}`);
        return;
      }
      
      setMenuPdfUrl(responseData.pdfUrl);
      setMessage(`Menu PDF uploaded successfully to local storage! File: ${responseData.fileName}`);
      setMenuPdf(null);
      
      // Reset the file input
      const fileInput = document.getElementById('menuPdf') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh menu data after a short delay
      setTimeout(() => {
        fetchMenuPdf();
      }, 2000);
      
    } catch (error) {
      console.error('Error uploading menu PDF:', error);
      setMessage('Error uploading menu PDF to local storage. Please try again.');
    } finally {
      setTimeout(() => {
        setMenuUploadProgress(0);
      }, 3000);
    }
  };

  // Add manual cleanup function
  const handleManualCleanup = async () => {
    setMessage('Starting manual cleanup of old menu files...');
    try {
      const response = await fetch('/api/menu/cleanup', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Cleanup completed: ${data.deletedCount} files deleted, ${data.failedCount} failed`);
      } else {
        setMessage(`Cleanup failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Manual cleanup error:', error);
      setMessage('Manual cleanup failed. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoContainer}>
            <Image 
              src="/amnex-logo.png" 
              alt="AMNEX" 
              fill
              className={styles.logo}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1></h1>
        </header>
        
        <div className={styles.loginForm}>
          <h2>Enter Admin Password</h2>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className={styles.input}
          />
          <button onClick={handleLogin} className={styles.button}>
            Login
          </button>
          {message && <p className={styles.error}>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Image 
            src="/amnex-logo.png" 
            alt="AMNEX" 
            fill
            className={styles.logo}
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1></h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.adminContent}>
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tabButton} ${reportView === 'overview' ? styles.active : ''}`}
            onClick={() => setReportView('overview')}
          >
            Dashboard
          </button>
          <button 
            className={`${styles.tabButton} ${reportView === 'menu' ? styles.active : ''}`}
            onClick={() => {
              setReportView('menu');
              fetchMenuData();
            }}
          >
            Menu Management
          </button>
          <button 
            className={`${styles.tabButton} ${reportView === 'attendance' ? styles.active : ''}`}
            onClick={() => {
              setReportView('attendance');
              fetchAttendanceData();
            }}
          >
            Attendance
          </button>
          <button 
            className={`${styles.tabButton} ${reportView === 'reports' ? styles.active : ''}`}
            onClick={() => setReportView('reports')}
          >
            Reports & Analytics
          </button>
          <button 
            className={`${styles.tabButton} ${reportView === 'settings' ? styles.active : ''}`}
            onClick={() => setReportView('settings')}
          >
            Settings
          </button>
        </div>

        {reportView === 'overview' && (
          <div className={styles.tabContent}>
            <h2>Dashboard Overview</h2>
            <div className={styles.statsCards}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🎫</div>
                <div className={styles.statInfo}>
                  <h3>Total Coupons</h3>
                  <p className={styles.statValue}>{couponStats.totalCoupons}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📅</div>
                <div className={styles.statInfo}>
                  <h3>Today's Coupons</h3>
                  <p className={styles.statValue}>{couponStats.dailyCoupons}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statInfo}>
                  <h3>Unique Employees</h3>
                  <p className={styles.statValue}>{couponStats.employeeCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportView === 'menu' && (
          <div className={styles.tabContent}>
            <h2>Menu Management</h2>
            
            <div className={styles.menuEditor}>
              <div className={styles.menuUploadSection}>
                <h3>Upload Weekly Menu PDF</h3>
                <p className={styles.instructions}>
                  Upload a PDF file for the weekly menu. This will be stored locally and displayed on the landing page for all employees. Old files are automatically deleted after 8 days.
                </p>
                
                <div className={styles.fileUploadContainer}>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    id="menuPdf" 
                    className={styles.fileInput}
                    onChange={handleMenuPdfChange}
                  />
                  <label htmlFor="menuPdf" className={styles.fileInputLabel}>
                    {menuPdf ? menuPdf.name : 'Choose PDF file'}
                  </label>
                  
                  <button 
                    onClick={handleUploadMenuPdf} 
                    className={styles.uploadButton}
                    disabled={!menuPdf || menuUploadProgress > 0}
                  >
                    {menuUploadProgress > 0 ? 'Uploading...' : 'Upload PDF'}
                  </button>
                  
                  <button 
                    onClick={handleManualCleanup} 
                    className={styles.cleanupButton}
                    title="Manually clean up old menu files"
                  >
                    🧹 Cleanup Old Files
                  </button>
                  
                  <button 
                    onClick={fetchMenuPdf} 
                    className={styles.refreshButton}
                    title="Refresh menu display"
                  >
                    🔄 Refresh Menu
                  </button>
                </div>
                
                {menuUploadProgress > 0 && (
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${menuUploadProgress}%` }}
                    ></div>
                    <span className={styles.progressText}>{menuUploadProgress}%</span>
                  </div>
                )}
              </div>
              
              {menuPdfUrl && (
                <div className={styles.currentMenuSection}>
                  <h3>Current Weekly Menu PDF</h3>
                  <div className={styles.menuDebugInfo}>
                    <p><strong>PDF URL:</strong> {menuPdfUrl.substring(0, 100)}...</p>
                    <p><strong>Status:</strong> Available locally</p>
                  </div>
                  <div className={styles.pdfPreview}>
                    <iframe
                      src={`${menuPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className={styles.pdfFrame}
                      title="Menu PDF"
                      onLoad={() => console.log('PDF iframe loaded')}
                      onError={() => console.error('PDF iframe failed to load')}
                    ></iframe>
                  </div>
                  <div className={styles.menuPdfInfo}>
                    <a 
                      href={menuPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.viewPdfButton}
                    >
                      View Full PDF
                    </a>
                    <p className={styles.localStorageInfo}>
                      
                    </p>
                  </div>
                </div>
              )}
              
              {!menuPdfUrl && (
                <div className={styles.noMenuSection}>
                  <p>No menu PDF available. Upload a PDF file to get started.</p>
                  <button onClick={fetchMenuPdf} className={styles.refreshButton}>
                    🔄 Check for Menu
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {reportView === 'attendance' && (
          <div className={styles.tabContent}>
            <h2>Attendance Management</h2>
            
            <div className={styles.attendanceControls}>
              <div className={styles.attendanceFilters}>
                <div className={styles.dateField}>
                  <label>Date:</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => {
                      setAttendanceDate(e.target.value);
                      setAttendanceData(null); // Clear previous data
                    }}
                    className={styles.dateInput}
                  />
                </div>
                <div className={styles.filterField}>
                  <label>Filter:</label>
                  <select
                    value={attendanceFilter}
                    onChange={(e) => {
                      setAttendanceFilter(e.target.value);
                      setAttendanceData(null); // Clear previous data
                    }}
                    className={styles.filterSelect}
                  >
                    <option value="all">All</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <button 
                  onClick={fetchAttendanceData}
                  disabled={isLoadingAttendance}
                  className={styles.button}
                >
                  {isLoadingAttendance ? 'Loading...' : 'Load Attendance'}
                </button>
              </div>
              
              {message && (
                <div className={styles.attendanceMessage}>
                  {message}
                </div>
              )}
            </div>

            {attendanceData ? (
              <div className={styles.attendanceResults}>
                <div className={styles.attendanceHeader}>
                  <h3>Attendance for {attendanceDate}</h3>
                  <button 
                    onClick={downloadAttendanceReport} 
                    className={styles.downloadButton}
                  >
                    📥 Download Report
                  </button>
                </div>

                <div className={styles.attendanceStats}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                      <h4>Total Coupons</h4>
                      <p className={styles.statValue}>{attendanceData.totalCoupons}</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                      <h4>Present</h4>
                      <p className={styles.statValue}>{attendanceData.presentCount}</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>❌</div>
                    <div className={styles.statInfo}>
                      <h4>Absent</h4>
                      <p className={styles.statValue}>{attendanceData.absentCount}</p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statInfo}>
                      <h4>Attendance Rate</h4>
                      <p className={styles.statValue}>{attendanceData.summary.attendanceRate}%</p>
                    </div>
                  </div>
                </div>

                {attendanceData.attendanceList.length > 0 ? (
                  <div className={styles.attendanceTable}>
                    <h4>Attendance List ({attendanceData.attendanceList.length} records)</h4>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Employee ID</th>
                          <th>Type</th>
                          <th>Coupon Code</th>
                          <th>Status</th>
                          <th>Marked At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.attendanceList.map((item, index) => (
                          <tr key={index} className={item.isPresent ? styles.presentRow : styles.absentRow}>
                            <td>{item.employeeId}</td>
                            <td>
                              <span className={`${styles.typeBadge} ${styles[item.couponType]}`}>
                                {item.couponType}
                              </span>
                            </td>
                            <td>{item.couponCode}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${item.isPresent ? styles.present : styles.absent}`}>
                                {item.isPresent ? '✅ Present' : '❌ Absent'}
                              </span>
                            </td>
                            <td>{item.attendanceMarkedAt ? new Date(item.attendanceMarkedAt).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.noData}>
                    <p>No attendance records found for the selected criteria.</p>
                    <p>Try selecting a different date or filter option.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.attendancePlaceholder}>
                <p>Click "Load Attendance" to view attendance data for the selected date.</p>
              </div>
            )}
          </div>
        )}

        {reportView === 'reports' && (
          <div className={styles.tabContent}>
            <h2>Reports & Analytics</h2>
            
            <div className={styles.reportControls}>
              <div className={styles.dateRangeSelector}>
                <div className={styles.dateField}>
                  <label>Start Date:</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
                <div className={styles.dateField}>
                  <label>End Date:</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
                <button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className={styles.button}
                >
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>

            {reportData && (
              <div className={styles.reportResults}>
                <div className={styles.reportHeader}>
                  <h3>Report Results</h3>
                  <button onClick={handleDownloadReport} className={styles.downloadButton}>
                    📥 Download CSV
                  </button>
                </div>

                <div className={styles.reportSummary}>
                  <div className={styles.summaryCard}>
                    <h4>Total Coupons</h4>
                    <p className={styles.summaryValue}>{reportData.totalCoupons}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Unique Employees</h4>
                    <p className={styles.summaryValue}>
                      {reportData?.employeeStats?.totalUniqueEmployees || 0}
                    </p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Date Range</h4>
                    <p className={styles.summaryValue}>
                      {reportData?.dateRange?.startDate 
                        ? new Date(reportData.dateRange.startDate).toLocaleDateString() 
                        : 'N/A'} - 
                      {reportData?.dateRange?.endDate 
                        ? new Date(reportData.dateRange.endDate).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className={styles.reportCharts}>
                  <div className={styles.chartContainer}>
                    <h4>Daily Breakdown</h4>
                    <div className={styles.dailyChart}>
                      {Object.entries(reportData.dailyBreakdown).map(([date, count]) => (
                        <div key={date} className={styles.dailyBar}>
                          <div className={styles.barLabel}>{new Date(date).toLocaleDateString()}</div>
                          <div 
                            className={styles.bar} 
                            style={{ 
                              height: `${(Number(count) / Math.max(...Object.values(reportData.dailyBreakdown).map(Number))) * 100}%` 
                            }}
                          >
                            <span className={styles.barValue}>{String(count)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.chartContainer}>
                    <h4>Top Employees</h4>
                    <div className={styles.employeeList}>
                      {reportData.employeeStats.employeeList
                        .sort((a, b) => b.couponCount - a.couponCount)
                        .slice(0, 10)
                        .map(emp => (
                          <div key={emp.employeeId} className={styles.employeeRow}>
                            <span className={styles.employeeId}>{emp.employeeId}</span>
                            <span className={styles.employeeCoupons}>{emp.couponCount} coupons</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className={styles.reportTable}>
                  <h4>Detailed Report</h4>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Coupon Code</th>
                        <th>Date</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.raw.slice(0, 50).map((item, index) => (
                        <tr key={index}>
                          <td>{item.employeeId}</td>
                          <td>{item.couponCode}</td>
                          <td>{item.dateCreated}</td>
                          <td>{new Date(item.createdAt).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.raw.length > 50 && (
                    <p className={styles.tableNote}>
                      Showing first 50 entries. Download CSV for complete data.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {reportView === 'settings' && (
          <div className={styles.tabContent}>
            <h2>Coupon Settings</h2>
            
            <div className={styles.settingGroup}>
              <label>Maximum Coupons Per Day:</label>
              <input
                type="number"
                min="1"
                max="200"
                value={tempSettings.maxCoupons}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  maxCoupons: parseInt(e.target.value) || 70
                })}
                className={styles.numberInput}
              />
            </div>

            <div className={styles.settingGroup}>
              <h3>Guest Coupons</h3>
              <label>Maximum Guest Coupons Per Day:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={tempSettings.guestCoupons}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  guestCoupons: parseInt(e.target.value) || 0
                })}
                className={styles.numberInput}
              />
              <p className={styles.settingDescription}>
                Coupons available for guests who don't have employee IDs
              </p>
            </div>

            <div className={styles.settingGroup}>
              <h3>New Employee Coupons</h3>
              <label>Maximum New Employee Coupons Per Day:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={tempSettings.newEmployeeCoupons}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  newEmployeeCoupons: parseInt(e.target.value) || 0
                })}
                className={styles.numberInput}
              />
              <p className={styles.settingDescription}>
                Coupons available for new employees who haven't received their employee ID yet
              </p>
            </div>

            <div className={styles.settingGroup}>
              <h3>Open Coupons</h3>
              <label>Maximum Open Coupons Per Day:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={tempSettings.openCoupons}
                onChange={(e) => setTempSettings({
                  ...tempSettings,
                  openCoupons: parseInt(e.target.value) || 0
                })}
                className={styles.numberInput}
              />
              <p className={styles.settingDescription}>
                Coupons available for special use cases that don't fit the regular employee or guest categories
              </p>
            </div>

            <div className={styles.settingGroup}>
              <label>Start Time:</label>
              <div className={styles.timeInputGroup}>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={convert24HourTo12Hour(tempSettings.startTime)}
                  onChange={(e) => {
                    const hour12 = parseInt(e.target.value) || 1;
                    const period = tempSettings.startTime >= 12 ? 'PM' : 'AM';
                    const hour24 = convert12HourTo24Hour(hour12, period);
                    setTempSettings({
                      ...tempSettings,
                      startTime: hour24
                    });
                  }}
                  className={styles.numberInput}
                />
                <span className={styles.timeSeparator}>:</span>
                <select
                  value={tempSettings.startMinutes}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    startMinutes: parseInt(e.target.value)
                  })}
                  className={styles.minuteSelect}
                >
                  <option value={0}>00</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                </select>
                <select
                  value={tempSettings.startTime >= 12 ? 'PM' : 'AM'}
                  onChange={(e) => {
                    const period = e.target.value;
                    const hour12 = convert24HourTo12Hour(tempSettings.startTime);
                    const hour24 = convert12HourTo24Hour(hour12, period);
                    setTempSettings({
                      ...tempSettings,
                      startTime: hour24
                    });
                  }}
                  className={styles.periodSelect}
                  name="startTimePeriod"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <span className={styles.timeHelper}>
                Current: {formatTime12Hour(tempSettings.startTime, tempSettings.startMinutes || 0)}
              </span>
            </div>

            <div className={styles.settingGroup}>
              <label>End Time:</label>
              <div className={styles.timeInputGroup}>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={convert24HourTo12Hour(tempSettings.endTime)}
                  onChange={(e) => {
                    const hour12 = parseInt(e.target.value) || 1;
                    const period = tempSettings.endTime >= 12 ? 'PM' : 'AM';
                    const hour24 = convert12HourTo24Hour(hour12, period);
                    setTempSettings({
                      ...tempSettings,
                      endTime: hour24
                    });
                  }}
                  className={styles.numberInput}
                />
                <span className={styles.timeSeparator}>:</span>
                <select
                  value={tempSettings.endMinutes}
                  onChange={(e) => setTempSettings({
                    ...tempSettings,
                    endMinutes: parseInt(e.target.value)
                  })}
                  className={styles.minuteSelect}
                >
                  <option value={0}>00</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={45}>45</option>
                </select>
                <select
                  value={tempSettings.endTime >= 12 ? 'PM' : 'AM'}
                  onChange={(e) => {
                    const period = e.target.value;
                    const hour12 = convert24HourTo12Hour(tempSettings.endTime);
                    const hour24 = convert12HourTo24Hour(hour12, period);
                    setTempSettings({
                      ...tempSettings,
                      endTime: hour24
                    });
                  }}
                  className={styles.periodSelect}
                  name="endTimePeriod"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <span className={styles.timeHelper}>
                Current: {formatTime12Hour(tempSettings.endTime, tempSettings.endMinutes || 0)}
              </span>
            </div>

            <button onClick={handleSaveSettings} className={styles.saveButton}>
              Save Settings
            </button>

            <div className={styles.guestCouponSection}>
              <h3>Generate Guest/New Employee Coupon</h3>
              <div className={styles.couponTypeSelector}>
                <label>
                  <input 
                    type="radio" 
                    name="couponType" 
                    value="guest"
                    className={styles.radioInput}
                  />
                  Guest Coupon (Paid)
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="couponType" 
                    value="newEmployee"
                    className={styles.radioInput}
                  />
                  New Employee Coupon (Paid)
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="couponType" 
                    value="open"
                    className={styles.radioInput}
                  />
                  Open Coupon (Unrestricted)
                </label>
              </div>
              <button 
                onClick={() => handleGenerateSpecialCoupon()}
                className={styles.specialCouponButton}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Special Coupon'}
              </button>

              {lastGeneratedSpecialCoupon && (
                <div className={styles.generatedCouponActions}>
                  <h4>Last Generated Coupon</h4>
                  <div className={styles.couponPreview}>
                    <div className={styles.miniCoupon}>
                      <div className={styles.miniCouponHeader}>
                        <span className={styles.miniCouponTitle}>AMNEX COUPON</span>
                      </div>
                      <div className={styles.miniCouponType}>
                        {lastGeneratedSpecialCoupon.type === 'guest' ? 'GUEST (PAID)' : 
                         lastGeneratedSpecialCoupon.type === 'newEmployee' ? 'NEW EMPLOYEE (PAID)' : 
                         'OPEN COUPON'}
                      </div>
                      <div className={styles.miniCouponCode}>
                        {lastGeneratedSpecialCoupon.couponCode}
                      </div>
                      <div className={styles.miniCouponDate}>
                        {new Date(lastGeneratedSpecialCoupon.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles.couponActions}>
                    <button 
                      onClick={handleDownloadSpecialCoupon}
                      className={styles.actionButton}
                    >
                      📥 Download CSV
                    </button>
                    <button 
                      onClick={handleShareSpecialCoupon}
                      className={styles.actionButton}
                    >
                      👁️ View Coupon
                    </button>
                    <button 
                      onClick={() => setLastGeneratedSpecialCoupon(null)}
                      className={styles.clearButton}
                    >
                      ✕ Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {message && <div className={styles.message}>{message}</div>}
          </div>
        )}
      </div>
    </div>
  );
}