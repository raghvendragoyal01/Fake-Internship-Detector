'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Loader2, Send, Upload } from 'lucide-react';

export default function ReportScamPage() {
  const [formData, setFormData] = useState({
    company_name: '',
    job_url: '',
    recruiter_email: '',
    scam_type: '',
    description: '',
    proof_file: '',
    user_email: 'testuser@gmail.com'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const scamTypes = [
    "Advance Fee Fraud (Asking for money)",
    "Identity Theft (Collecting personal info)",
    "Fake Cheque/Overpayment",
    "Phishing/Malware Link",
    "Pyramid/MLM Scheme disguise",
    "Other"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, proof_file: file.name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch('http://localhost:10000/api/v1/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage("Thank you. Your report has been submitted successfully to our security team.");
        setFormData({
          company_name: '',
          job_url: '',
          recruiter_email: '',
          scam_type: '',
          description: '',
          proof_file: '',
          user_email: 'testuser@gmail.com'
        });
      } else {
        setError(data.detail || data.message || "Failed to submit report.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as any, bounce: 0.4 } } };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="p-10 max-w-[800px] mx-auto w-full mt-10">
      <motion.div variants={itemVariants} className="mb-10 text-center">
        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center text-[#FF2D2D]/80 mx-auto mb-6">
          <Flag size={32} />
        </div>
        <h1 className="text-4xl text-black tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>Report a Scam</h1>
        <p className="text-black/50">Help protect the community by reporting fraudulent job listings and recruiters.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
        {message ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-[#166534]/10 text-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-medium text-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>Report Submitted</h3>
            <p className="text-black/60 mb-6">{message}</p>
            <button 
              onClick={() => setMessage("")}
              className="bg-black text-white px-6 py-2.5 rounded-full font-medium hover:bg-black/80 transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black/70 mb-2">Company Name *</label>
                <input 
                  required
                  type="text" 
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black/70 mb-2">Job URL *</label>
                <input 
                  required
                  type="url" 
                  name="job_url"
                  value={formData.job_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black/70 mb-2">Recruiter Email (Optional)</label>
                <input 
                  type="email" 
                  name="recruiter_email"
                  value={formData.recruiter_email}
                  onChange={handleInputChange}
                  placeholder="hr@scamcompany.com"
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black/70 mb-2">Scam Type *</label>
                <select 
                  required
                  name="scam_type"
                  value={formData.scam_type}
                  onChange={handleInputChange}
                  className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black outline-none focus:border-black/20 transition-colors appearance-none"
                >
                  <option value="" disabled>Select the type of scam</option>
                  {scamTypes.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black/70 mb-2">Description & Details *</label>
              <textarea 
                required
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please provide details about why this job is a scam. Did they ask for money? Was the interview process suspicious?"
                className="w-full h-32 bg-black/[0.02] border border-black/5 rounded-xl p-4 text-black outline-none focus:border-black/20 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black/70 mb-2">Proof of Scam (Offer Letter, PDF, Screenshot) *</label>
              <div className="relative w-full bg-black/[0.02] border border-black/5 rounded-xl px-4 py-3 text-black transition-colors overflow-hidden">
                <input 
                  required
                  type="file" 
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center gap-2 text-black/60 font-medium">
                  <Upload size={18} />
                  <span className="truncate">{formData.proof_file ? formData.proof_file : "Click to upload file or drag & drop"}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-[#FF2D2D]/10 text-[#FF2D2D] text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="flex justify-end mt-2">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF2D2D] text-white px-8 py-3 rounded-full font-medium flex justify-center items-center gap-2 hover:bg-[#E02424] transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Send size={18} /> Submit Report</>}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// Needed for the success message icon
import { ShieldCheck } from 'lucide-react';
