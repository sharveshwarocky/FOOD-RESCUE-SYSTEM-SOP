import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { User, Lock, Mail, Phone, MapPin, Building2, Truck, RefreshCw, ShieldCheck } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('DONOR');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Role specific fields
  const [orgName, setOrgName] = useState('');
  const [ngoName, setNgoName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [fullName, setFullName] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');

  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCaptcha = async () => {
    try {
      const res = await authService.getCaptcha();
      if (res.success) {
        setCaptchaId(res.captcha_id);
        setCaptchaChallenge(res.code);
      }
    } catch (e) {
      setError('Could not load CAPTCHA challenge');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const payload = {
      username,
      email,
      password,
      role,
      phone,
      address,
      captcha_id: captchaId,
      captcha_code: captchaCode,
      organization_name: orgName,
      ngo_name: ngoName,
      registration_number: regNum,
      full_name: fullName,
      vehicle_type: vehicleType
    };

    try {
      const res = await authService.register(payload);
      if (res.success) {
        setSuccessMsg('Registration submitted! Your account is PENDING admin approval.');
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      setError(err.message);
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8">
        <div className="p-6 bg-emerald-600 text-white text-center">
          <h2 className="text-2xl font-bold">Register Account</h2>
          <p className="text-emerald-100 text-xs mt-1">Join the Food Rescue & Redistribution Network</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <ErrorMessage message={error} />}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold text-center">
              {successMsg}
            </div>
          )}

          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Select Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('DONOR')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  role === 'DONOR'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🥗 Donor
              </button>
              <button
                type="button"
                onClick={() => setRole('NGO')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  role === 'NGO'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏢 NGO
              </button>
              <button
                type="button"
                onClick={() => setRole('VOLUNTEER')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  role === 'VOLUNTEER'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚚 Volunteer
              </button>
            </div>
          </div>

          {/* Role specific inputs */}
          {role === 'DONOR' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Organization / Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Grand Palace Catering"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>
          )}

          {role === 'NGO' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">NGO Name</label>
                <input
                  type="text"
                  value={ngoName}
                  onChange={(e) => setNgoName(e.target.value)}
                  placeholder="Hope Foundation"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reg. Number</label>
                <input
                  type="text"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  placeholder="NGO-REG-1234"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
            </div>
          )}

          {role === 'VOLUNTEER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Bike">Bike / Scooter</option>
                  <option value="Delivery Van">Delivery Van</option>
                  <option value="Car">Car</option>
                  <option value="On Foot">On Foot</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure password"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="City address & pincode"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium"
              required
            />
          </div>

          {/* CAPTCHA Module */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Security CAPTCHA
              </span>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-800 text-emerald-400 font-mono font-bold tracking-widest rounded-lg text-sm select-none">
                  {captchaChallenge || '...'}
                </span>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="p-1 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-200"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={captchaCode}
              onChange={(e) => setCaptchaCode(e.target.value)}
              placeholder="Type CAPTCHA code"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono tracking-wider"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3 text-base">
            {loading ? 'Submitting Registration...' : 'Submit Registration'}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
