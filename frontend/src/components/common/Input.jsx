import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  id,
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  style = {},
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`} style={style}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-accent)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '14px', color: 'var(--color-text-muted)', display: 'flex', pointerEvents: 'none' }}>
            <Icon size={18} />
          </div>
        )}
        <input
          id={inputId}
          type={inputType}
          className="form-input"
          style={{
            paddingLeft: Icon ? '2.625rem' : '1.125rem',
            paddingRight: type === 'password' ? '2.8rem' : undefined,
            borderColor: error ? 'var(--color-danger)' : undefined
          }}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          {...props}
        />
        {type === 'password' && <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}
      </div>
      {error && <span className="form-error" style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
};

export default Input;
