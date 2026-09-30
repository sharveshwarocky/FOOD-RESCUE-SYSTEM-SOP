import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { RefreshCw } from 'lucide-react';

const Captcha = ({ onVerify }) => {
  const [captchaId, setCaptchaId] = useState('');
  const [code, setCode] = useState('');
  const [userCode, setUserCode] = useState('');

  const loadCaptcha = async () => {
    try {
      const res = await authService.getCaptcha();
      if (res.success) {
        setCaptchaId(res.captcha_id);
        setCode(res.code);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleInput = (val) => {
    setUserCode(val);
    if (val.length === 5) {
      onVerify(captchaId, val);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
      <span className="px-3 py-1.5 bg-slate-800 text-emerald-400 font-mono font-bold text-base tracking-widest rounded-lg select-none">
        {code || '.....'}
      </span>
      <input
        type="text"
        value={userCode}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="CAPTCHA"
        className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
      />
      <button
        type="button"
        onClick={loadCaptcha}
        className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-200"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Captcha;
