import React from 'react';

const Button = ({ type = 'button', variant = 'solid', children, disabled, onClick, className = '' }) => {
  const baseStyle = 'px-4 py-2 rounded-md transition duration-300';
  const styles = {
    outline: `bg-white text-orange-500 border border-orange-500 hover:bg-orange-50`,
    solid: `bg-orange-500 text-white hover:bg-orange-600`,
  };

  return (
    <button type={type} className={`${baseStyle} ${styles[variant]} ${className}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
