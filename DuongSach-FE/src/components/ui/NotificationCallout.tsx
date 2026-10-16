import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import './NotificationCallout.css';

export type NotificationCalloutVariant = 'info' | 'success' | 'warning' | 'error';

interface NotificationCalloutProps {
  variant?: NotificationCalloutVariant;
  title: string;
  children?: React.ReactNode;
  className?: string;
  floating?: boolean;
}

const variantIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle
};

export const NotificationCallout: React.FC<NotificationCalloutProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  floating = false
}) => {
  const Icon = variantIcons[variant];

  return (
    <div
      className={[
        'notification-callout',
        `notification-callout-${variant}`,
        floating ? 'notification-callout-floating' : '',
        className
      ].filter(Boolean).join(' ')}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <Icon className="notification-callout-icon" size={18} strokeWidth={2.2} />
      <div className="notification-callout-copy">
        <strong>{title}</strong>
        {children && <span>{children}</span>}
      </div>
    </div>
  );
};
