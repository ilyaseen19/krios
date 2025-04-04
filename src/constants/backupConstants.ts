// Constants for backup time intervals

export interface BackupInterval {
  value: number; // hours
  label: string;
}

export const BACKUP_INTERVALS: BackupInterval[] = [
  { value: 1, label: '1 Hour' },
  { value: 2, label: '2 Hours' },
  { value: 3, label: '3 Hours' },
  { value: 4, label: '4 Hours' },
  { value: 5, label: '5 Hours' },
  { value: 6, label: '6 Hours' },
  { value: 7, label: '7 Hours' },
  { value: 8, label: '8 Hours' },
  { value: 9, label: '9 Hours' },
  { value: 10, label: '10 Hours' }
];

export const DEFAULT_BACKUP_INTERVAL = 2; // Default backup interval in hours