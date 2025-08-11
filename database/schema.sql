-- Create schema
CREATE SCHEMA IF NOT EXISTS fcms_scm;
SET search_path TO fcms_scm;

-- Employees table
CREATE TABLE fcms_scm.employees (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons table
CREATE TABLE fcms_scm.coupons (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    coupon_code VARCHAR(50) NOT NULL UNIQUE,
    coupon_type VARCHAR(20) DEFAULT 'employee',
    date_created DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    amount DECIMAL(10,2) DEFAULT 0.00
);

-- Attendance table
CREATE TABLE fcms_scm.attendance (
    id BIGSERIAL PRIMARY KEY,
    coupon_id BIGINT REFERENCES fcms_scm.coupons(id),
    employee_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    is_present BOOLEAN DEFAULT FALSE,
    attendance_marked_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE fcms_scm.settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Files table
CREATE TABLE fcms_scm.menu_files (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) DEFAULT 'application/pdf',
    is_active BOOLEAN DEFAULT TRUE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coupons_employee_id ON fcms_scm.coupons(employee_id);
CREATE INDEX idx_coupons_date_created ON fcms_scm.coupons(date_created);
CREATE INDEX idx_attendance_date ON fcms_scm.attendance(attendance_date);
CREATE INDEX idx_menu_files_active ON fcms_scm.menu_files(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_employees_employee_id ON fcms_scm.employees(employee_id);
CREATE INDEX idx_employees_email ON fcms_scm.employees(email);

-- Sample data
INSERT INTO fcms_scm.employees (employee_id, email, full_name, department, is_active) VALUES
('AIPL0001', 'i_aditiya@amnex.com', 'Aditya Sharma', 'Engineering', TRUE),
('AIPL0002', 'nitishm@amnex.com', 'Nitish Mukherjee', 'IT', TRUE),
('AIPL0003', 'rahul19@amnex.com', 'Rahul Haldar', 'Networks', TRUE),
('AIPL0009', 'aditya.shrma.1004@gmail.com', 'Adi', 'Networks', TRUE);
INSERT INTO fcms_scm.settings (setting_key, setting_value) VALUES
('maxCoupons', '70'),
('startTime', '10'),
('startMinutes', '0'),
('endTime', '23'),
('endMinutes', '0'),
('guestCoupons', '20'),
('newEmployeeCoupons', '10'),
('emailEnabled', 'true');
