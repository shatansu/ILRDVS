/**
 * Application-wide constants for BhoomiVerify AI
 */

/** Supported file extensions for upload */
export const SUPPORTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif'] as const;

/** MIME types accepted */
export const ACCEPTED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
};

/** Accepted file input string */
export const ACCEPT_FILE_INPUT = '.pdf,.jpg,.jpeg,.png,.tiff,.tif';

/** Maximum file size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum number of files per upload */
export const MAX_FILES_PER_UPLOAD = 10;

/** Indian states for metadata */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

/** Document type options for metadata */
export const DOCUMENT_TYPES = [
  'Record of Rights (RoR)',
  'Khasra / Girdawari',
  'Khatauni',
  'Mutation Record',
  'Sale Deed / Registry',
  'Revenue Court Order',
  'Cadastral Map',
  'Settlement Record',
  'Other',
] as const;

/** Supported languages */
export const SUPPORTED_LANGUAGES = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Tamil',
  'Telugu',
  'Kannada',
  'Punjabi',
  'Odia',
  'Urdu',
  'Other',
] as const;

/** Navigation items for the sidebar */
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/' },
  { id: 'upload', label: 'Upload Document', icon: 'Upload', href: '/upload' },
  { id: 'documents', label: 'Documents', icon: 'FileStack', href: '/documents' },
  { id: 'verification', label: 'Verification Queue', icon: 'ShieldCheck', href: '/verification', badge: 42 },
  { id: 'records', label: 'Land Records', icon: 'Database', href: '/records' },
  { id: 'gis', label: 'GIS Map', icon: 'Map', href: '/gis' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', href: '/analytics' },
  { id: 'audit', label: 'Audit Trail', icon: 'ScrollText', href: '/audit' },
  { id: 'admin', label: 'Admin', icon: 'Settings', href: '/admin' },
] as const;
