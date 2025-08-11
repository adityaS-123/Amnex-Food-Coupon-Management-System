-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS fcms_scm;

-- Set search path
SET search_path TO fcms_scm;

-- Create employees table if not exists
CREATE TABLE IF NOT EXISTS employees (
    employee_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create coupons table if not exists
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    coupon_code VARCHAR(100) UNIQUE NOT NULL,
    coupon_type VARCHAR(20) DEFAULT 'employee',
    date_created DATE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- Create settings table if not exists
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create menu_files table if not exists
CREATE TABLE IF NOT EXISTS menu_files (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    upload_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) 
VALUES 
    ('maxCoupons', '70', 'Maximum number of coupons per day'),
    ('guestCoupons', '20', 'Maximum guest coupons per day'),
    ('newEmployeeCoupons', '10', 'Maximum new employee coupons per day'),
    ('startTime', '10', 'Coupon generation start time (24h format)'),
    ('startMinutes', '0', 'Coupon generation start minutes'),
    ('endTime', '23', 'Coupon generation end time (24h format)'),
    ('endMinutes', '0', 'Coupon generation end minutes')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_employee_date ON coupons(employee_id, date_created);
CREATE INDEX IF NOT EXISTS idx_coupons_date_created ON coupons(date_created);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_menu_files_active ON menu_files(is_active, upload_date);
