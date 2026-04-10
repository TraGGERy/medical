'use client';

import Header from '@/components/Header';
import PricingCard from '@/components/PricingCard';

export default function PricingPage() {
  const plans = [
    {
      title: "Semaglutide Plan",
      price: "$179",
      originalPrice: "$299",
      features: [
        "Doctor consultation included",
        "Prescription (if eligible)",
        "Monthly medication delivery",
        "Discreet, cold shipping",
        "Unlimited provider messaging",
        "No hidden fees"
      ]
    },
    {
      title: "Tirzepatide Plan",
      price: "$279",
      originalPrice: "$399",
      features: [
        "Priority doctor review",
        "Advanced Tirzepatide medication",
        "All supplies included",
        "Monthly delivery",
        "24/7 dedicated support",
        "Metabolic health tracking"
      ],
      isPopular: true
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-secondary mb-6">Simple, Transparent <span className="text-primary italic">Pricing</span></h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">No insurance needed. One monthly price includes your consultation, medication, and shipping.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <PricingCard 
              key={i}
              {...plan}
              buttonText="Select This Plan"
              onButtonClick={() => window.location.href = '/health-check'}
            />
          ))}
        </div>

        <div className="mt-20 bg-white p-12 rounded-3xl border border-slate-200 text-center">
           <h3 className="text-2xl font-serif font-bold text-secondary mb-4">The MediScope AI Advantage</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                 <div className="font-bold text-primary mb-1 text-lg">Includes Labs?</div>
                 <p className="text-sm text-slate-500">Most members do not need live labs. If required, we help you coordinate.</p>
              </div>
              <div>
                 <div className="font-bold text-primary mb-1 text-lg">Shipping Costs?</div>
                 <p className="text-sm text-slate-500">Free everywhere in the continental U.S. Cold-shipped to your door.</p>
              </div>
              <div>
                 <div className="font-bold text-primary mb-1 text-lg">Hidden Costs?</div>
                 <p className="text-sm text-slate-500">Zero. One monthly fee covers the doctor, the meds, and the support.</p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
