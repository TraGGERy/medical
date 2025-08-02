'use client';

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  delay?: number;
}

export default function ProcessStep({ step, title, description, delay = 0 }: ProcessStepProps) {
  return (
    <div 
      className="p-6 bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-500 hover:-translate-y-1 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto">
        {step}
      </div>
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}