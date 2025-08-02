'use client';

import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div 
      className="p-6 bg-blue-50 rounded-2xl shadow hover:shadow-lg transition-all duration-500 hover:-translate-y-2 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-semibold mb-2 text-lg">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}