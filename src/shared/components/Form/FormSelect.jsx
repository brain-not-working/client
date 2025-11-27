import { ChevronDown, ChevronUp, Check } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  placeholder = "Select an option",
  icon,
  className = "",
  id,

  variant = "default",
  dropdownDirection = "down",
  dropdownMaxHeight = 150,

  // ⭐ NEW
  multiple = false,

  ...rest
}) => {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [resolvedDirection, setResolvedDirection] = useState("down");

  const normOptions = options.map((opt) =>
    typeof opt === "object" ? opt : { label: String(opt), value: opt }
  );

  // ⭐ Support array for multi-select
  const selectedValues = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value;

  const selectedOption = !multiple
    ? normOptions.find((o) => String(o.value) === String(value))
    : null;

  const computePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let dir = dropdownDirection;
    if (dropdownDirection === "auto") {
      if (spaceBelow >= dropdownMaxHeight) dir = "down";
      else if (spaceAbove >= dropdownMaxHeight) dir = "up";
      else dir = spaceBelow >= spaceAbove ? "down" : "up";
    }

    let top;
    let maxHeight = dropdownMaxHeight;

    if (dir === "down") {
      top = rect.bottom;
      if (spaceBelow < maxHeight) maxHeight = Math.max(40, spaceBelow - 8);
    } else {
      const estimatedHeight = Math.min(
        normOptions.length * 40,
        dropdownMaxHeight
      );
      top = rect.top - estimatedHeight;
      if (top < 8) {
        const extra = 8 - top;
        top = 8;
        maxHeight = Math.max(40, estimatedHeight - extra);
      } else {
        maxHeight = estimatedHeight;
      }
    }

    setResolvedDirection(dir);
    setDropdownPos({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  };

  useEffect(() => {
    if (!open) return;
    computePosition();
    const t = setTimeout(() => computePosition(), 0);
    return () => clearTimeout(t);
  }, [open, normOptions.length, dropdownDirection]);

  useEffect(() => {
    if (!open) return;

    const onDocClick = (e) => {
      if (
        !containerRef.current?.contains(e.target) &&
        !listRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const onScroll = () => computePosition();
    const onResize = () => computePosition();

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const toggleValue = (newVal) => {
    if (!multiple) {
      onChange?.({ target: { name, value: newVal } });
      setOpen(false);
      return;
    }

    let updated;
    if (selectedValues.includes(newVal)) {
      updated = selectedValues.filter((v) => v !== newVal);
    } else {
      updated = [...selectedValues, newVal];
    }

    onChange?.({ target: { name, value: updated } });
  };

  const BLACK = variant === "black";

  return (
    <div className={`w-full relative ${className}`} ref={containerRef} {...rest}>
      {label && (
        <label
          htmlFor={id || name}
          className={`block mb-1 text-sm font-medium text-gray-700`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`
          relative flex items-center rounded-lg border bg-white
          ${error ? "border-red-400" : "border-gray-300"}
          focus-within:ring-1 shadow-sm 
          ${BLACK ? "focus-within:ring-black" : "focus-within:ring-green-500"}
        `}
      >
        {icon && <div className="pl-3">{icon}</div>}

        <button
          type="button"
          ref={buttonRef}
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`
            w-full text-left text-sm py-2 pr-3 flex items-center gap-2 
            ${icon ? "pl-2" : "px-3"}
            ${disabled ? "text-gray-400" : BLACK ? "text-black" : "text-gray-900"}
          `}
        >
          {/* ⭐ MULTIPLE SELECT DISPLAY */}
          {!multiple ? (
            <span className="flex-1 truncate">
              {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
            </span>
          ) : (
            <span className="flex-1 flex flex-wrap gap-2">
              {selectedValues.length > 0 ? (
                selectedValues.map((v) => {
                  const opt = normOptions.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      className="px-2 py-1 rounded-md text-xs bg-black/10 text-black"
                    >
                      {opt?.label}
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </span>
          )}

          {open ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}

      {open &&
        createPortal(
          <div
            ref={listRef}
            className={`
              fixed z-50 rounded-lg border overflow-auto
              bg-white ${BLACK ? "border-black" : "border-gray-200"}
            `}
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
            }}
          >
            <ul className="py-1">
              {normOptions.map((opt, i) => {
                const isSelected = multiple
                  ? selectedValues.includes(opt.value)
                  : String(opt.value) === String(value);

                return (
                  <li
                    key={i}
                    onClick={() => toggleValue(opt.value)}
                    className={`
                      cursor-pointer px-4 py-2 text-sm flex items-center gap-2
                      ${BLACK ? "text-black" : "text-gray-800"}
                      ${isSelected ? "bg-green-500/10" : ""}
                      hover:bg-black/10
                    `}
                  >
                    {/* ⭐ Checkbox for multi-select */}
                    {multiple && (
                      <div
                        className={`w-4 h-4 rounded-sm border flex items-center justify-center
                          ${isSelected ? "bg-black text-white" : "border-gray-400"}
                        `}
                      >
                        {isSelected && <Check size={14} />}
                      </div>
                    )}

                    <span className={`${isSelected ? "font-bold" : ""}`}>
                      {opt.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
};

export default FormSelect;
