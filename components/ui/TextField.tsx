'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, isPassword, id, name, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? name;
    const errorId = `${inputId}-error`;

    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative mt-1">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={isPassword ? (visible ? 'text' : 'password') : props.type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
              isPassword ? 'pr-10' : ''
            } ${error ? 'border-red-300' : 'border-gray-300 focus:border-brand-500'} ${className ?? ''}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
