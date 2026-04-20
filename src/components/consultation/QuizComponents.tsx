'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Option {
  label: string;
  value: string;
  description?: string;
}

interface SelectCardProps {
  options: Option[];
  selectedValue: string;
  onChange: (value: string) => void;
  columns?: number;
}

export const SelectCard: React.FC<SelectCardProps> = ({ options, selectedValue, onChange, columns = 1 }) => {
  return (
    <div className={cn(
      "grid gap-3 sm:gap-4",
      columns === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all text-left group",
            selectedValue === option.value 
              ? "border-primary bg-teal-50 text-primary shadow-sm" 
              : "border-slate-100 hover:border-slate-200 bg-white text-slate-700"
          )}
        >
          <div className="flex-1">
            <span className="block font-bold text-base sm:text-lg">{option.label}</span>
            {option.description && (
              <span className="block text-xs sm:text-sm text-slate-500 mt-0.5">{option.description}</span>
            )}
          </div>
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ml-3",
            selectedValue === option.value ? "bg-primary border-primary text-white" : "border-slate-200 text-transparent"
          )}>
            <Check className="w-4 h-4 stroke-[3px]" />
          </div>
        </button>
      ))}
    </div>
  );
};

interface MultiSelectGroupProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelectGroup: React.FC<MultiSelectGroupProps> = ({ options, selectedValues, onChange }) => {
  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => toggleOption(option.value)}
          className={cn(
            "flex items-center p-4 rounded-xl border-2 transition-all text-left",
            selectedValues.includes(option.value)
              ? "border-primary bg-teal-50 text-primary"
              : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded border-2 mr-4 flex items-center justify-center transition-colors shrink-0",
            selectedValues.includes(option.value) ? "bg-primary border-primary text-white" : "border-slate-300"
          )}>
            {selectedValues.includes(option.value) && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
          </div>
          <span className="font-bold text-sm sm:text-base">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

interface QuestionWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const QuestionWrapper: React.FC<QuestionWrapperProps> = ({ title, description, children }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-secondary mb-2 leading-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
