import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../styles/Scanner.module.css';

export default function ScanQR() {
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCode, setIsProcessingCode] = useState(false); // Add this state variable
  const [hasProcessedAutoScan, setHasProcessedAutoScan] = useState(false); // Add this state variable
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  
  // Get code from URL params for auto-scanning
  const { code, auto } = router.query;

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('attendance_token');
    const name = localStorage.getItem('officer_name');
    
    if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = '/attendance-login';
      return;
    }

    // Set a timeout to prevent infinite loading state
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing state update');
        setIsLoading(false);
        setMessage('Authentication timed out. Please refresh the page.');
      }
    }, 10000); // 10-second timeout

    // Verify the token is valid
    const verifyToken = async () => {
      try {
        console.log('Verifying token...');
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        console.log('Verification response:', response.status, data);
        
        if (response.ok) {
          console.log('Token verified successfully');
          setIsAuthenticated(true);
          setOfficerName(name || 'Attendance Officer');
          
          // Always make sure loading state is updated
          setIsLoading(false);
          
          // Now check camera and handle auto-scanning if code exists
          checkCameraPermission();
          
          // Auto-scan if code parameter is provided and we haven't processed it yet
          if (code && auto === 'true' && !hasProcessedAutoScan) {
            setHasProcessedAutoScan(true);
            markAttendance(code.toString());
          }
        } else {
          console.error('Token verification failed:', data.message);
          // Clear invalid tokens
          localStorage.removeItem('attendance_token');
          localStorage.removeItem('officer_name');
          
          // Make sure to end the loading state before redirecting
          setIsLoading(false);
          window.location.href = '/attendance-login';
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setMessage('Authentication error. Please try again.');
        // Ensure loading state is always updated even on error
        setIsLoading(false);
      }
    };
    
    verifyToken();
    
    return () => {
      clearTimeout(loadingTimeout);
      stopCamera();
    };
  }, [code, auto, hasProcessedAutoScan]); // Add hasProcessedAutoScan to dependency array

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setHasCamera(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission denied:', error);
      setMessage('Camera permission is required to scan QR codes');
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setMessage('Position QR code in front of camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Set initial canvas dimensions after stream is available
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth || 640;
            canvasRef.current.height = videoRef.current.videoHeight || 480;
            console.log(`Initial canvas size set: ${canvasRef.current.width}x${canvasRef.current.height}`);
          }
        };
        videoRef.current.play();
        scanQRCode();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setMessage('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      requestAnimationFrame(scanQRCode);
      return;
    }
    
    // Ensure the canvas dimensions are set based on the video stream
    if (canvas.width === 0 || canvas.height === 0) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);
      } else {
        // Default dimensions if video dimensions aren't available yet
        canvas.width = 640;
        canvas.height = 480;
        console.log('Using default canvas dimensions');
      }
    }
    
    const context = canvas.getContext('2d');
    
    if (!context) {
      requestAnimationFrame(scanQRCode);
      return;
    }
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Ensure video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('Video dimensions not ready yet');
        requestAnimationFrame(scanQRCode);
        return;
      }
      
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use a QR code library to decode the image
        // ...existing code...
        
      } catch (error) {
        console.error('Error scanning QR code:', error);
      }
    }
    
    requestAnimationFrame(scanQRCode);
  };

  const handleManualInput = async () => {
    const couponCode = prompt('Enter coupon code (e.g., AMNEX-ABC123):');
    if (couponCode && couponCode.trim()) {
      await markAttendance(couponCode.trim());
    }
  };

  const markAttendance = async (couponCode) => {
    // Prevent multiple simultaneous API calls
    if (isProcessingCode) {
      console.log('Already processing a code, ignoring duplicate request');
      return;
    }

    try {
      setIsProcessingCode(true);
      setMessage('Marking attendance...');
      
      // Get authentication token
      const token = localStorage.getItem('attendance_token');
      
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          scanTime: new Date().toISOString(),
          officerName: officerName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAttendanceData(data);
        setMessage(`✅ Attendance marked for ${data.attendance.employeeId}`);
        stopCamera();
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage('❌ Failed to mark attendance. Please try again.');
    } finally {
      setIsProcessingCode(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('attendance_token');
    localStorage.removeItem('officer_name');
    router.push('/attendance-login');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingScreen}>
          <div className={styles.spinner}></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
 }

  return (
    <div className={styles.container}>
      <Head>
        <title>QR Scanner - AMNEX Attendance</title>
        <meta name="description" content="Scan QR codes for attendance marking" />
      </Head>

      <header className={styles.header}>
        <h1>🔍</h1>
        <div className={styles.headerRight}>
          {isAuthenticated && (
            <>
              <span className={styles.officerName}>Officer: {officerName}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
          )}
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.scannerContainer}>
          {!isScanning && !attendanceData && (
            <div className={styles.startScreen}>
              <div className={styles.instructions}>
                <h2>Scan Employee QR Code</h2>
                <p>Point your camera at the QR code on the employee's coupon to mark their attendance.</p>
                <div className={styles.exampleCode}>
                  <p><strong>Example coupon codes:</strong></p>
                  <p>• Regular: AMNEX-ABC123</p>
                  <p>• Guest: GUEST-XYZ789</p>
                  <p>• New Employee: NEWEMP-DEF456</p>
                </div>
              </div>
              
              {hasCamera ? (
                <button onClick={startCamera} className={styles.startButton}>
                  📷 Start Camera
                </button>
              ) : (
                <p className={styles.error}>Camera not available</p>
              )}
              
              <button onClick={handleManualInput} className={styles.manualButton}>
                ⌨️ Enter Code Manually
              </button>
            </div>
          )}

          {isScanning && (
            <div className={styles.cameraContainer}>
              <video ref={videoRef} className={styles.video} playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <div className={styles.scanOverlay}>
                <div className={styles.scanFrame}></div>
                <p>Position QR code within the frame</p>
              </div>
              
              <div className={styles.scanControls}>
                <button onClick={stopCamera} className={styles.stopButton}>
                  ⏹️ Stop Scanning
                </button>
                <button onClick={handleManualInput} className={styles.manualButton}>
                  ⌨️ Manual Entry
                </button>
              </div>
            </div>
          )}

          {attendanceData && (
            <div className={styles.successScreen}>
              <div className={styles.successIcon}>✅</div>
              <h2>Attendance Marked!</h2>
              <div className={styles.attendanceDetails}>
                <p><strong>Employee:</strong> {attendanceData.employeeId}</p>
                <p><strong>Type:</strong> {attendanceData.couponType}</p>
                <p><strong>Time:</strong> {new Date(attendanceData.markedAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => {
                  setAttendanceData(null);
                  setMessage('');
                }} 
                className={styles.resetButton}
              >
                🔄 Scan Another
              </button>
            </div>
          )}

          {message && (
            <div className={`${styles.message} ${message.includes('❌') ? styles.error : styles.success}`}>
              {message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}