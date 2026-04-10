'use client';

interface PricingCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
  onButtonClick: () => void;
}

export default function PricingCard({ 
  title, 
  price, 
  originalPrice, 
  features, 
  isPopular = false, 
  buttonText, 
  onButtonClick 
}: PricingCardProps) {
  return (
    <div className={`relative p-6 sm:p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
      isPopular ? 'bg-teal-50/50 border-2 border-primary' : 'bg-white border border-slate-100'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold uppercase tracking-widest">
            MOST POPULAR
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <div className="flex items-center justify-center">
          {originalPrice && (
            <span className="text-gray-400 line-through text-base sm:text-lg mr-2">{originalPrice}</span>
          )}
          <span className="text-3xl sm:text-5xl font-serif font-bold text-secondary">{price}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-6 sm:mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-primary mr-3 mt-0.5 flex-shrink-0">✓</span>
            <span className="text-slate-600 text-sm sm:text-base">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onButtonClick}
        className={`w-full py-4 px-4 sm:px-6 rounded-xl font-bold transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
          isPopular 
            ? 'bg-primary text-white hover:shadow-lg shadow-teal-500/20' 
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}