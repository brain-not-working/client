import React, { useState } from "react";

const FormInput = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  icon,
  rightIcon,
  className = "",
  variant = "default",

  // NEW universal props
  inputMode,  
  pattern,    
  numbersOnly = false, // <— NEW FLAG

  ...rest
}) => {
  const [touched, setTouched] = useState(false);
  const showError = required && touched && !value;

  const BLACK = variant === "black";

  // Prevent non-numeric input if numbersOnly is true
  const handleInput = (e) => {
    if (numbersOnly) {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">

        {label && (
          <label
            htmlFor={name}
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div
          className={`
            relative flex items-center rounded-lg border 
            ${showError || error ? "border-red-400" : "border-gray-300"}
            bg-white
            transition-all
            focus-within:ring-1 
            ${
              BLACK
                ? "focus-within:ring-black focus-within:border-black"
                : "focus-within:ring-primary focus-within:border-primary"
            }
          `}
        >
          {icon && (
            <div className="pl-3 pointer-events-none text-gray-400">
              {icon}
            </div>
          )}

          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={() => setTouched(true)}
            onInput={handleInput}   // NEW
            placeholder={placeholder}
            disabled={disabled}
            inputMode={inputMode}   // NEW
            pattern={pattern}       // NEW
            className={`
              w-full outline-none text-sm rounded-lg bg-transparent py-2
              placeholder-gray-400
              ${icon ? "pl-2 pr-4" : "px-4"}
              ${
                disabled
                  ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                  : BLACK
                  ? "text-black"
                  : "text-gray-900"
              }
            `}
            {...rest}
          />

          {rightIcon && (
            <span
              className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${
                BLACK ? "text-black" : "text-gray-500"
              }`}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {(showError || error) && (
          <p className="mt-1 text-sm font-medium text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
};

export default FormInput;
