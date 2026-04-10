'use client';

import Header from '@/components/Header';
import { motion } from 'framer-motion';

export default function FAQPage() {
  const faqs = [
    {
      q: "What is GLP-1 medication?",
      a: "GLP-1s are a class of medications that mimic a natural hormone in your body. They help regulate appetite, slow digestion, and improve how your body handles sugar, leading to significant and sustainable weight loss."
    },
    {
      q: "Is MediScope AI a pharmacy?",
      a: "No, MediScope AI is a healthcare platform. We connect you with licensed medical providers who can prescribe medication and partner with reputable pharmacies that ship the medication to your door."
    },
    {
      q: "Do I need insurance?",
      a: "No insurance is required. Our monthly pricing is cash-pay and includes the cost of your doctor consultation, medication, and shipping."
    },
    {
      q: "How fast will I see results?",
      a: "Many patients begin seeing weight loss within the first month. Clinical studies of Semaglutide and Tirzepatide show significant weight loss over a 12-month period when combined with lifestyle changes."
    },
    {
      q: "Are there side effects?",
      a: "Common side effects include nausea, diarrhea, or constipation, especially when starting. Your provider will work with you to manage any symptoms and adjust your dosage if needed."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-secondary mb-6">Frequently Asked <span className="text-primary italic">Questions</span></h1>
          <p className="text-xl text-slate-600">Everything you need to know about our weight loss program.</p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <h3 className="text-xl font-bold text-secondary mb-3">{faq.q}</h3>
              <p className="text-slate-600 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
           <p className="text-slate-500 mb-6">Still have questions?</p>
           <button className="text-primary font-bold hover:underline">Contact our support team</button>
        </div>
      </main>
    </div>
  );
}
