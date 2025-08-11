# Amnex Food Coupon Management System

A comprehensive system for managing food coupons for employees at Amnex. This application streamlines the process of generating, tracking, and validating food coupons for company meal services.

![Amnex Food Coupon System](https://placeholder-for-screenshot.png)

## Features

- **Employee Coupon Generation**: Employees can generate one coupon per day
- **Time-restricted Access**: Configurable time windows for coupon generation
- **Admin Dashboard**: Complete control panel for administrators
- **Multiple Coupon Types**:
  - Regular employee coupons
  - Guest coupons
  - New employee coupons
  - Open coupons (for special cases)
- **QR Code Integration**: Scan QR codes to track attendance
- **Email Notifications**: Automatic emails with coupon details
- **Reporting & Analytics**: Comprehensive usage statistics and reports
- **Menu Management**: Upload and manage weekly menu PDFs
- **Attendance Tracking**: Monitor employee meal attendance

## Technology Stack

- **Frontend**: Next.js (React)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Styling**: CSS Modules
- **Email**: Nodemailer
- **QR Code**: qrcode library

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-org/amnex-food.git
cd amnex-food
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the project root:

```
# Database Configuration
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=5432

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=no-reply@your-domain.com
FROM_NAME=Amnex Food Services

# Base URL
BASE_URL=http://localhost:3000
```

4. **Initialize the database**

Execute the SQL schema script in your PostgreSQL database:

```bash
psql -U your_db_user -d your_db_name -f scripts/schema.sql
```

5. **Run the application**

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Usage

### For Employees

1. Navigate to the homepage
2. Enter your employee ID
3. Click "Generate Coupon"
4. View, download, or receive your coupon via email
5. Present the coupon/QR code at the cafeteria

### For Administrators

1. Access the admin panel at `/admin`
2. Log in with admin credentials (default: admin123)
3. Use the dashboard to:
   - View coupon statistics
   - Manage system settings
   - Generate special coupons
   - View reports and analytics
   - Upload and manage menu PDFs
   - Track attendance

## Project Structure

```
amnex-food/
├── components/         # Reusable React components
│   ├── CouponDisplay.tsx
│   ├── CouponGenerator.tsx
│   ├── CouponResult.tsx
│   └── OpenCouponGenerator.tsx
├── contexts/           # React context providers
│   └── SettingsContext.tsx
├── data/               # Local data storage
│   └── settings.json
├── pages/              # Next.js pages and API routes
│   ├── api/            # Backend API endpoints
│   │   ├── attendance/
│   │   ├── coupons/
│   │   ├── employees.ts
│   │   ├── menu/
│   │   ├── reports.ts
│   │   └── settings.ts
│   ├── admin.tsx       # Admin dashboard
│   └── index.tsx       # Homepage
├── public/             # Static assets
│   ├── images/
│   └── uploads/        # Uploaded menu PDFs
├── styles/             # CSS module files
│   ├── Admin.module.css
│   ├── CouponGenerator.module.css
│   └── globals.css
└── utils/              # Utility functions
    └── aws-config.js   # Database connection utilities
```

## Configuration

### System Settings

The application's settings can be managed through the admin panel, including:

- Maximum daily coupons
- Time restrictions (start/end times)
- Coupon type limits (guest, new employee, open)

These settings are stored both in the database and in `data/settings.json` for failover purposes.

### Database Schema

The system uses four main tables:
- `employees` - Employee information
- `coupons` - Coupon records
- `settings` - Application configuration
- `attendance` - Meal attendance records

## API Documentation

### Coupon APIs
- `GET /api/coupons` - Retrieve coupon data
- `POST /api/coupons` - Generate regular employee coupon
- `POST /api/coupons/generate` - Generate open coupon for specific employee
- `POST /api/coupons/special` - Generate special coupons (guest, new employee, open)
- `GET /api/coupons/stats` - Get coupon statistics

### Employee APIs
- `GET /api/employees` - Retrieve employee list

### Settings APIs
- `GET /api/settings` - Retrieve system settings
- `POST /api/settings` - Update system settings

### Attendance APIs
- `GET /api/attendance/list` - Get attendance records
- `POST /api/attendance/mark` - Mark attendance using coupon code

### Menu APIs
- `GET /api/menu` - Get daily menu data
- `GET /api/menu/pdf` - Get menu PDF URL
- `POST /api/menu/upload` - Upload menu PDF
- `POST /api/menu/cleanup` - Clean up old menu files

### Report APIs
- `GET /api/reports` - Generate reports based on date range

## Security

- Admin access is password-protected
- Database credentials are stored in environment variables
- Input validation on all API endpoints
- Rate limiting for coupon generation

## Troubleshooting

### Common Issues

- **Coupon Generation Failures**: Check time restrictions and daily limits
- **Email Delivery Issues**: Verify SMTP configuration
- **QR Code Scanning Problems**: Ensure proper lighting and camera focus
- **Database Connection Errors**: Confirm database credentials

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [QRCode](https://www.npmjs.com/package/qrcode)
- [Nodemailer](https://nodemailer.com/)

