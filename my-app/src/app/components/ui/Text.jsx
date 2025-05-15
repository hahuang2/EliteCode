import React from 'react';

export const Heading = ({ 
  children, 
  className = '',
  ...props 
}) => {
  // Primary text with LeetCode orange color
  const baseClasses = "text-[#ffa116]";
  const classes = `${baseClasses} ${className}`;
  
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
};

export const MainText = ({ 
  children, 
  className = '',
  ...props 
}) => {
  // Main text with LeetCode gray color
  const baseClasses = "text-black";
  const classes = `${baseClasses} ${className}`;
  
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
};

export const SubText = ({ 
  children, 
  className = '',
  ...props 
}) => {
  // Subtext with LeetCode lighter gray color
  const baseClasses = "text-[#b3b3b3]";
  const classes = `${baseClasses} ${className}`;
  
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
};

// Export all components
export { Heading, MainText, SubText };