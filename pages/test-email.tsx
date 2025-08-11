import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function TestEmail() {
  const [formData, setFormData] = useState({
    employeeId: 'TEST001',
    email: '', // Add your test email here
    couponCode: 'TEST-001-12/18/24',
    couponType: 'employee'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Request failed',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.container}>
      <h1>Email Test Page</h1>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '20px auto' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>Employee ID:</label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Test Email Address:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your-test-email@example.com"
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Coupon Code:</label>
          <input
            type="text"
            name="couponCode"
            value={formData.couponCode}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Coupon Type:</label>
          <select
            name="couponType"
            value={formData.couponType}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="employee">Employee</option>
            <option value="guest">Guest</option>
            <option value="newEmployee">New Employee</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Sending Test Email...' : 'Send Test Email'}
        </button>
      </form>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          maxWidth: '500px',
          margin: '20px auto'
        }}>
          <h3>Test Result:</h3>
          <p><strong>Status:</strong> {result.success ? 'SUCCESS' : 'FAILED'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          {result.messageId && <p><strong>Message ID:</strong> {result.messageId}</p>}
          {result.error && <p><strong>Error:</strong> {result.error}</p>}
          {result.testData && (
            <div>
              <h4>Test Data Used:</h4>
              <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(result.testData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
