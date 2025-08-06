'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const selectVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
        error: 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
        success: 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectProps extends VariantProps<typeof selectVariants> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placeholder?: string;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, placeholder }}>
      <div ref={selectRef} className={cn('relative w-full', className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof selectVariants>
>(({ className, variant, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(selectVariants({ variant }), className)}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <ChevronDown 
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} 
      />
    </button>
  );
});

SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder: propPlaceholder, ...props }, ref) => {
  const { value, placeholder: contextPlaceholder } = React.useContext(SelectContext);
  const displayPlaceholder = propPlaceholder || contextPlaceholder;

  return (
    <span
      ref={ref}
      className={cn(
        'block truncate',
        !value && 'text-gray-400',
        className
      )}
      {...props}
    >
      {value || displayPlaceholder}
    </span>
  );
});

SelectValue.displayName = 'SelectValue';

interface SelectContentProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  children: React.ReactNode;
}

const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps
>(({ className, children, ...props }, ref) => {
  const { isOpen } = React.useContext(SelectContext);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          className={cn(
            'absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden',
            className
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          <div className="max-h-60 overflow-auto py-1">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectItemProps & React.HTMLAttributes<HTMLDivElement>
>(({ className, value, children, disabled, ...props }, ref) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext);
  const isSelected = value === selectedValue;

  const handleClick = () => {
    if (!disabled && onValueChange) {
      onValueChange(value);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none transition-colors',
        disabled
          ? 'pointer-events-none opacity-50'
          : 'hover:bg-gray-100 focus:bg-gray-100',
        isSelected && 'bg-blue-50 text-blue-600',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});

SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };