'use client';

import Header from '@/components/Header';
import Button from '@/components/Button';
import { motion } from 'framer-motion';

export default function TreatmentPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-secondary mb-6">Our Treatments</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Clinically proven, doctor-prescribed medications for sustainable weight loss.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-slate-50 border border-slate-100"
          >
            <div className="text-4xl mb-6">💉</div>
            <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Semaglutide</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Semaglutide is a GLP-1 receptor agonist that works by mimicking the hormone glucagon-like peptide-1, which targets areas of the brain that regulate appetite and food intake.
            </p>
            <ul className="space-y-3 mb-8 text-sm font-bold text-slate-700">
              <li>✅ Average 15% body weight loss</li>
              <li>✅ Injection or Oral options</li>
              <li>✅ Improves metabolic health</li>
            </ul>
            <Button className="w-full" onClick={() => window.location.href = '/health-check'}>Start Evaluation</Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-teal-50 border border-teal-100"
          >
            <div className="text-4xl mb-6">⚡</div>
            <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Tirzepatide</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Tirzepatide is a dual-action GIP and GLP-1 receptor agonist. It provides enhanced appetite suppression and better weight loss outcomes for many patients compared to single-action medications.
            </p>
            <ul className="space-y-3 mb-8 text-sm font-bold text-slate-700">
              <li>✅ Average 20%+ body weight loss</li>
              <li>✅ Advanced dual-hormone mimicry</li>
              <li>✅ Once-weekly injection</li>
            </ul>
            <Button className="w-full" onClick={() => window.location.href = '/health-check'}>Check Eligibility</Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
