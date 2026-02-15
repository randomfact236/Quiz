/**
 * ============================================================================
 * UI COMPONENTS INDEX
 * ============================================================================
 * @module components/ui
 * @description Export all UI components from a single entry point
 */

// Status Dashboard
export { StatusDashboard } from './StatusDashboard';
export type { StatusDashboardProps, StatusCountsData } from './StatusDashboard';

// Bulk Action Toolbar
export { BulkActionToolbar } from './BulkActionToolbar';
export type { BulkActionToolbarProps } from './BulkActionToolbar';

// Toast Container
export { ToastContainer } from './ToastContainer';
export type { ToastContainerProps } from './ToastContainer';

// Content Management Section
export { ContentManagementSection } from './ContentManagementSection';
export type {
    ContentManagementSectionProps,
    ContentItem,
    ContentItemStatus,
} from './ContentManagementSection';

// Theme Toggle (existing)
export { ThemeToggle } from './ThemeToggle';
export type { ThemeToggleProps } from './ThemeToggle';

// File Uploader
export * from './FileUploader';
