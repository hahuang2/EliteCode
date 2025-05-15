import React from 'react';

export const Container = ({ 
    children, 
    fullScreen = false,
    centered = false,
    className = '',
    ...props 
  }) => {
    const baseClasses = "bg-black text-gray-300";
    const layoutClasses = fullScreen ? "min-h-screen" : "";
    const centerClasses = centered ? "flex items-center justify-center" : "";
    
    const classes = `${baseClasses} ${layoutClasses} ${centerClasses} ${className}`;
    
    return (
      <div className={classes} {...props}>
        {children}
      </div>
    );
  };