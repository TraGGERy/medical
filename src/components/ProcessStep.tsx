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
      <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-lg mb-4 mx-auto shadow-md">
        {step}
      </div>
      <h3 className="font-serif font-bold text-xl text-secondary mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  );
}