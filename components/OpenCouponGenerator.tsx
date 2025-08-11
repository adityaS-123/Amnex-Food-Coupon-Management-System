import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import styles from '../styles/CouponGenerator.module.css';

interface Employee {
  id: string;
  name: string;
  department?: string;
}

export default function OpenCouponGenerator() {
  const { settings } = useSettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  useEffect(() => {
    // Fetch employees from API
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/employees');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data);
        } else {
          console.error('Failed to fetch employees');
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  const handleGenerateCoupon = async (employee: Employee) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/coupons/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employee.id,
          employeeName: employee.name,
          couponType: 'open'
        }),
      });
      
      if (response.ok) {
        setMessage(`Coupon successfully generated for ${employee.name}`);
        setMessageType('success');
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to generate coupon');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred while generating the coupon');
      setMessageType('error');
    } finally {
      setLoading(false);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };
  
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Open Coupon Generator</h3>
      <p className={styles.description}>
        Generate a coupon for any employee by clicking on their name
      </p>
      
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>
      
      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}
      
      <div className={styles.employeeList}>
        {loading ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <div 
              key={employee.id} 
              className={styles.employeeItem}
              onClick={() => handleGenerateCoupon(employee)}
            >
              <span className={styles.employeeName}>{employee.name}</span>
              {employee.department && (
                <span className={styles.employeeDept}>{employee.department}</span>
              )}
            </div>
          ))
        ) : (
          <p>No employees found matching your search.</p>
        )}
      </div>
    </div>
  );
}
