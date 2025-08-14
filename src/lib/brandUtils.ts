/**
 * ProSpaces Brand Guidelines Utilities
 * 
 * This file contains utility functions and constants to ensure
 * consistent application of brand guidelines across all components.
 */

// Brand Colors Map
export const BRAND_COLORS = {
  primary: 'hsl(var(--primary))',
  electricBlue: 'hsl(var(--brand-electric-blue))',
  orange: 'hsl(var(--brand-orange))',
  evGreen: 'hsl(var(--brand-ev-green))',
  lightGray: 'hsl(var(--brand-light-gray))',
  navy: 'hsl(var(--brand-navy))',
} as const;

// Status Colors (following brand guidelines)
export const STATUS_COLORS = {
  sent: 'status-sent',
  pending: 'status-pending', 
  accepted: 'status-accepted',
  declined: 'status-declined',
  expired: 'bg-muted text-muted-foreground',
  complete: 'status-accepted',
  active: 'status-sent',
} as const;

// Icon Background Classes
export const ICON_BACKGROUNDS = {
  electricBlue: 'icon-bg-electric-blue',
  orange: 'icon-bg-orange', 
  evGreen: 'icon-bg-ev-green',
  lightGray: 'icon-bg-light-gray',
  navy: 'icon-bg-navy',
} as const;

// Typography Classes
export const TYPOGRAPHY = {
  heading1: 'brand-heading-1',
  heading2: 'brand-heading-2',
  heading3: 'brand-heading-3',
  body: 'brand-body',
  title: 'brand-title',
} as const;

// Button Variants
export const BUTTON_VARIANTS = {
  primary: 'btn-brand-primary',
  secondary: 'btn-brand-secondary', 
  accent: 'btn-brand-accent',
} as const;

// Badge Variants
export const BADGE_VARIANTS = {
  electricBlue: 'badge-electric-blue',
  evGreen: 'badge-ev-green',
  orange: 'badge-orange',
  lightGray: 'badge-light-gray',
  navy: 'badge-navy',
} as const;

/**
 * Get status color class based on status
 */
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground';
};

/**
 * Get icon background class for specific brand color
 */
export const getIconBackground = (color: keyof typeof ICON_BACKGROUNDS): string => {
  return ICON_BACKGROUNDS[color];
};

/**
 * Get typography class for specific text type
 */
export const getTypographyClass = (type: keyof typeof TYPOGRAPHY): string => {
  return TYPOGRAPHY[type];
};

/**
 * Get button variant class
 */
export const getButtonVariant = (variant: keyof typeof BUTTON_VARIANTS): string => {
  return BUTTON_VARIANTS[variant];
};

/**
 * Get badge variant class
 */
export const getBadgeVariant = (variant: keyof typeof BADGE_VARIANTS): string => {
  return BADGE_VARIANTS[variant];
};

/**
 * Brand-compliant tile configuration for dashboard cards
 */
export const DASHBOARD_TILES = {
  quotes: {
    iconBg: getIconBackground('electricBlue'),
    iconColor: 'text-brand-electric-blue',
    badgeBg: 'bg-brand-electric-blue-light/20',
    badgeText: 'text-brand-electric-blue',
  },
  projects: {
    iconBg: getIconBackground('evGreen'),
    iconColor: 'text-brand-ev-green', 
    badgeBg: 'bg-brand-ev-green-light/20',
    badgeText: 'text-brand-ev-green',
  },
  messages: {
    iconBg: getIconBackground('orange'),
    iconColor: 'text-brand-orange',
    badgeBg: 'bg-brand-orange-light/20', 
    badgeText: 'text-brand-orange',
  },
  payments: {
    iconBg: getIconBackground('lightGray'),
    iconColor: 'text-primary',
    badgeBg: 'bg-brand-light-gray/50',
    badgeText: 'text-primary',
  },
  documents: {
    iconBg: getIconBackground('navy'),
    iconColor: 'text-brand-navy',
    badgeBg: 'bg-brand-navy/20',
    badgeText: 'text-brand-navy',
  },
} as const;

/**
 * Common page layouts following brand guidelines
 */
export const PAGE_LAYOUTS = {
  fullPage: 'brand-page',
  container: 'brand-container',
  loadingSpinner: 'brand-spinner',
  card: 'brand-card',
  interactiveCard: 'brand-card-interactive',
} as const;