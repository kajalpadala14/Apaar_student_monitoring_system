import React, { useState } from 'react';
import { useStudents } from '../../context/StudentContext';
import { School, ShieldCheck, Lock, User, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAsSchool, loginAsAdmin, rawStudents, loading } = useStudents();

  const [activeTab, setActiveTab] = useState<'school' | 'admin'>('school');

  // School Login States
  const [udiseCode, setUdiseCode] = useState('');
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);

  // Admin Login States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  const handleSchoolLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolError(null);

    const cleanUdise = udiseCode.trim();
    if (!cleanUdise) {
      setSchoolError('कृपया स्कूल का UDISE कोड दर्ज करें। (Please enter UDISE Code)');
      return;
    }

    setSchoolLoading(true);
    try {
      const res = await loginAsSchool(cleanUdise);
      if (!res.success) {
        setSchoolError(res.error || 'Invalid UDISE Code');
      }
    } catch (err: any) {
      setSchoolError(err.message || 'लॉगिन में त्रुटि हुई');
    } finally {
      setSchoolLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setAdminError('कृपया एडमिन यूजरनेम और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    setAdminLoading(true);
    try {
      const res = await loginAsAdmin(adminUsername.trim(), adminPassword);
      if (!res.success) {
        setAdminError(res.error || 'Invalid Admin credentials');
      }
    } catch (err: any) {
      setAdminError(err.message || 'लॉगिन में त्रुटि हुई');
    } finally {
      setAdminLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-linear-to-b from-slate-100 to-slate-200 flex flex-col justify-between text-slate-800">
      
      {/* Top National/State Bar */}
      <div className="bg-blue-900 text-slate-100 text-[10px] sm:text-xs py-1.5 px-2.5 sm:px-4 flex justify-between items-center border-b border-blue-950">
        <div className="flex items-center space-x-1.5 sm:space-x-2 truncate mr-2">
          <span className="font-semibold tracking-wide truncate">स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन</span>
          <span className="text-blue-300 hidden sm:inline">|</span>
          <span className="text-blue-200 hidden md:inline truncate">School Education Department, Govt. of Chhattisgarh</span>
        </div>
        <div className="text-slate-300 text-[10px] sm:text-xs shrink-0">
          <span>District Dantewada</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-2.5 sm:p-6 my-2 sm:my-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 sm:p-6 text-center relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/95 rounded-xl p-2 mx-auto mb-2.5 sm:mb-3 shadow-md flex items-center justify-center">
              <img src="/emblem.svg" alt="National Emblem" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">APAAR Student Survey Portal</h1>
            <p className="text-blue-200 text-xs mt-1 font-medium">
              जिला दंतेवाड़ा &bull; छात्र अपार आईडी सत्यापन एवं सर्वेक्षण पोर्टल
            </p>
            <div className="mt-2.5 inline-flex items-center space-x-1.5 bg-blue-700/60 border border-blue-500/40 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] text-blue-100">
              {loading && rawStudents.length === 0 ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span>Google Sheet से डेटा कनेक्ट हो रहा है...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Master Database: {rawStudents.length.toLocaleString('en-IN')} Records</span>
                </>
              )}
            </div>
          </div>

          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setActiveTab('school');
                setSchoolError(null);
                setAdminError(null);
              }}
              className={`py-3.5 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer border-b-2 ${
                activeTab === 'school'
                  ? 'border-blue-700 text-blue-800 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <School className={`w-4 h-4 ${activeTab === 'school' ? 'text-blue-700' : 'text-slate-400'}`} />
              <span>School Login (स्कूल)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setSchoolError(null);
                setAdminError(null);
              }}
              className={`py-3.5 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer border-b-2 ${
                activeTab === 'admin'
                  ? 'border-blue-700 text-blue-800 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-blue-700' : 'text-slate-400'}`} />
              <span>Admin Login (जिला एडमिन)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            
            {/* SCHOOL LOGIN FORM */}
            {activeTab === 'school' && (
              <form onSubmit={handleSchoolLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="udiseInput" className="text-xs font-bold text-slate-700">
                      UDISE Code (स्कूल का 11-अंकीय कोड) <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="udiseInput"
                      type="text"
                      maxLength={11}
                      value={udiseCode}
                      onChange={(e) => setUdiseCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="उदा. 22162244501"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition-all"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    पासवर्ड की आवश्यकता नहीं है। सिर्फ अपने स्कूल का 11-अंकों का UDISE कोड दर्ज करें।
                  </p>
                </div>

                {schoolError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-bold">{schoolError}</p>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        कृपया जांचें कि कोड सही है और दंतेवाड़ा जिले के मास्टर डेटाबेस में पंजीकृत है।
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={schoolLoading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {schoolLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>सत्यापित हो रहा है...</span>
                    </>
                  ) : loading && rawStudents.length === 0 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>डेटाबेस लोड हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <span>स्कूल डैशबोर्ड खोलें (Login)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            )}

            {/* ADMIN LOGIN FORM */}
            {activeTab === 'admin' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label htmlFor="adminUserInput" className="text-xs font-bold text-slate-700 mb-1 block">
                    Admin Username (उपयोगकर्ता नाम) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="adminUserInput"
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="उदा. admin"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="adminPassInput" className="text-xs font-bold text-slate-700 mb-1 block">
                    Password (पासवर्ड) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="adminPassInput"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    जिला स्तर के संपूर्ण 9,747 छात्रों के डेटा प्रबंधन हेतु।
                  </p>
                </div>

                {adminError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-bold">{adminError}</p>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        कृपया एडमिन यूजरनेम व पासवर्ड की पुनः जांच करें।
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {adminLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>लॉगिन हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <span>जिला एडमिन लॉगिन (Admin Login)</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

          {/* Security Footer Notice */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">डेटा सुरक्षा नियम:</span> स्कूल उपयोगकर्ता केवल अपने स्कूल के UDISE कोड से संबंधित डेटा ही देख और संशोधित कर सकेंगे।
            </p>
          </div>

        </div>
      </div>

      {/* Official Government Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-300 bg-white/70 backdrop-blur-xs">
        <p className="font-semibold text-slate-700">
          स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन &bull; जिला प्रशासन दंतेवाड़ा
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          National Informatics Centre (NIC) &bull; APAAR Student Survey Portal
        </p>
      </footer>

    </div>
  );
};
