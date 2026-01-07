import React from 'react';
import { ChevronDown } from 'lucide-react';

// Toggle Switch Component
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full 
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${checked ? 'bg-blue-500' : 'bg-[rgb(70,70,70)]'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 transform rounded-full 
          bg-white shadow-sm ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0.5'}
          mt-0.5
        `}
      />
    </button>
  );
};

// Select Dropdown Component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ value, options, onChange, disabled = false }) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          appearance-none bg-transparent text-[rgb(155,155,155)] text-sm
          pr-6 cursor-pointer hover:text-[rgb(200,200,200)] transition-colors
          focus:outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[rgb(37,37,37)]">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        size={14} 
        className="absolute right-0 top-1/2 -translate-y-1/2 text-[rgb(155,155,155)] pointer-events-none" 
      />
    </div>
  );
};

// Slider Component
interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  showValue = true,
  formatValue = (v) => String(v),
}) => {
  return (
    <div className="flex items-center gap-3 w-full max-w-[200px]">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={`
          flex-1 h-1 bg-[rgb(70,70,70)] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      {showValue && (
        <span className="text-sm text-[rgb(155,155,155)] min-w-[40px] text-right">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
};

// Setting Item Wrapper
interface SettingItemProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  description,
  children,
}) => {
  return (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-[rgb(45,45,45)] rounded-md transition-colors -mx-1">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="text-[rgb(155,155,155)] mt-0.5 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[rgb(230,230,230)]">{title}</div>
          {description && (
            <div className="text-xs text-[rgb(120,120,120)] mt-0.5">{description}</div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        {children}
      </div>
    </div>
  );
};

// Section Header
interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-[rgb(120,120,120)] uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export default SettingItem;
