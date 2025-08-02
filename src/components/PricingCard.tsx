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
      isPopular ? 'bg-gradient-to-b from-blue-50 to-white border-2 border-blue-500' : 'bg-white'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-4 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
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
          <span className="text-3xl sm:text-4xl font-bold text-blue-600">{price}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-6 sm:mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-500 mr-3 mt-0.5 flex-shrink-0">✓</span>
            <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onButtonClick}
        className={`w-full py-3 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-105 text-sm sm:text-base ${
          isPopular 
            ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:shadow-lg' 
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}