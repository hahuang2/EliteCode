import React from 'react';

export const RoundedContainer = ({ 
  children, 
  backgroundColor = 'bg-gray-200',
  borderColor = 'border-white',
  className = '',
  ...props 
}) => {
  // Base classes for the rounded container
  const baseClasses = "rounded-lg border p-4";
  
  // Combine all classes
  const classes = `${baseClasses} ${backgroundColor} ${borderColor} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
