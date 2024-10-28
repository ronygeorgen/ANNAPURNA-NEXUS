import React from 'react';
import { Field, ErrorMessage } from 'formik';

const FormInput = ({ label, name, type, labelClass = "text-gray-700", className = "" }) => (
  <div>
    <label htmlFor={name} className={`block text-sm font-medium ${labelClass}`}>
      {label}
    </label>
    <Field
      name={name}
      type={type}
      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${className}`}
    />
    <ErrorMessage name={name} component="div" className="text-red-500 text-sm mt-1" />
  </div>
);

export default FormInput;
