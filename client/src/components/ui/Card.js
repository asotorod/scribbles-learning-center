import React from 'react';
import './Card.css';

const Card = ({
  children,
  title,
  subtitle,
  icon,
  variant = 'default',
  padding = 'medium',
  className = '',
  headerAction,
  ...props
}) => {
  const classes = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {(title || icon || headerAction) && (
        <div className="card-header">
          <div className="card-header-left">
            {icon && <span className="card-icon">{icon}</span>}
            <div className="card-titles">
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div className="card-header-action">{headerAction}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
};

// Stat Card variant
export const StatCard = ({ icon, value, label, trend, variant = 'default' }) => {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <h3 className="stat-card-value">{value}</h3>
        <p className="stat-card-label">{label}</p>
        {trend && (
          <span className={`stat-card-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
};

export default Card;
