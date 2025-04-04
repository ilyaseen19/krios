// Mock settings data for the application

export interface GeneralSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currencySymbol: string;
  taxRate: string;
  dateFormat: string;
  timeZone: string;
  receiptCounter: number;
  customerId?: string;
  businessName?: string;
  backupInterval?: number; // Backup interval in hours
  lastBackupTime?: number; // Timestamp of last backup
}

export interface NotificationSettings {
  lowStockAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

export const defaultGeneralSettings: GeneralSettings = {
  storeName: 'Krios Store',
  storeEmail: 'info@kriosstore.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Main Street, City, State, 12345',
  currencySymbol: '$',
  taxRate: '10',
  dateFormat: 'MM/DD/YYYY',
  timeZone: 'UTC-5 (Eastern Time)',
  receiptCounter: 1,
  backupInterval: 2, // Default 2-hour backup interval
  lastBackupTime: 0, // Initialize with 0 timestamp
};

export const defaultNotificationSettings: NotificationSettings = {
  lowStockAlerts: true,
  dailyReports: true,
  weeklyReports: true,
  monthlyReports: true,
};

export const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

export const timeZones = [
  'UTC-5 (Eastern Time)',
  'UTC-6 (Central Time)',
  'UTC-7 (Mountain Time)',
  'UTC-8 (Pacific Time)'
];