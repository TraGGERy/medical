'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/ui';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-300 placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20',
        error: 'border-red-500 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20',
        success: 'border-green-500 focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/20',
      },
      size: {
        sm: 'min-h-[60px] px-2 py-1 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[120px] px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  success?: string;
  floating?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    label, 
    error, 
    success, 
    floating = true, 
    maxLength,
    showCount = false,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    const [currentLength, setCurrentLength] = useState(
      typeof value === 'string' ? value.length : 0
    );
    
    const hasValue = value || props.defaultValue;
    const isFloating = floating && label;
    const textareaVariant = error ? 'error' : success ? 'success' : variant;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentLength(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="relative w-full">
        <div className="relative">
          <textarea
            className={cn(
              textareaVariants({ variant: textareaVariant, size, className }),
              isFloating && 'placeholder-transparent'
            )}
            ref={ref}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={isFloating ? ' ' : props.placeholder}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            {...props}
          />

          {(error || success) && (
            <div className="absolute right-3 top-3">
              {error && <AlertCircle className="h-4 w-4 text-red-500" />}
              {success && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
          )}
        </div>

        {isFloating && (
          <motion.label
            className={cn(
              'absolute left-3 top-3 text-gray-500 transition-all duration-300 pointer-events-none',
              (focused || hasValue) && 'top-0 left-3 -translate-y-1/2 text-xs bg-white px-1',
              error && 'text-red-500',
              success && 'text-green-500',
              focused && !error && !success && 'text-blue-500'
            )}
            initial={false}
            animate={{
              scale: focused || hasValue ? 0.85 : 1,
              y: focused || hasValue ? -12 : 0,
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {label}
          </motion.label>
        )}

        {!isFloating && label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        {(showCount || maxLength) && (
          <div className="mt-1 text-right">
            <span className={cn(
              'text-xs',
              maxLength && currentLength > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
            )}>
              {showCount && `${currentLength}`}
              {maxLength && ` / ${maxLength}`}
            </span>
          </div>
        )}

        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-1"
            >
              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {success}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };