import React from 'react';
import { Field, ErrorMessage } from 'formik';

function FormSelect({ 
  label, 
  name, 
  options, 
  icon,
  className = '', 
  labelClass = '',
  disabled = false 
}) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className={`flex items-center ${labelClass}`}>
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </label>
      )}
      <div className="relative">
        <Field
          as="select"
          id={name}
          name={name}
          className={`${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={disabled}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Field>
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      <ErrorMessage
        name={name}
        component="div"
        className="mt-1 text-sm text-red-500"
      />
    </div>
  );
}

export default FormSelect;