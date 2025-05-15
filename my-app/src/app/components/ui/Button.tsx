import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseClasses = "font-medium rounded-md transition duration-300";
  
  const variantClasses = {
    primary: "bg-[#ffa116] hover:bg-[#f78b07] text-white",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white",
    outline: "bg-transparent border border-[#ffa116] text-[#ffa116] hover:bg-[#ffa116] hover:bg-opacity-10"
  };
  
  const sizeClasses = {
    sm: "py-1 px-3 text-sm",
    md: "py-2 px-6 text-base",
    lg: "py-3 px-8 text-lg"
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};