import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4">
        <Link to="/login" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <h2 className="text-2xl font-bold text-slate-800">Reset Password</h2>
        <p className="text-xs text-slate-500">Enter your registered email address to receive password reset instructions.</p>

        {submitted ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs space-y-1">
            <p className="font-bold">Reset Instructions Sent!</p>
            <p>If an account exists for {email}, reset instructions have been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-3">
              Send Reset Instructions
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
