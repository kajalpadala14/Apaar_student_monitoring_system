import React, { useState, useEffect } from 'react';
import { Student, SurveyStatus, SURVEY_REASONS } from '../../types/student';
import { useStudents } from '../../context/StudentContext';
import { X, Save, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, ArrowRight, ShieldCheck, Check, Ban } from 'lucide-react';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}) => {
  const { updateStudentSurvey, currentUser } = useStudents();

  // 3 Primary Survey Fields Requested:
  // 1. Is AADHAAR Provided
  // 2. Is AADHAAR Verified
  // 3. Reason For Not Generated Apaar Id
  const [isAadhaarProvided, setIsAadhaarProvided] = useState<string>('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>('SURVEY COMPLETED');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync state whenever student prop changes
  useEffect(() => {
    setIsAadhaarProvided(student.is_aadhaar_provided || '');
    setIsAadhaarVerified(student.is_aadhaar_verified || '');
    setReason(student.apaar_pending_reason || '');
    setOtherReason(student.other_reason || '');
    setRemarks(student.remarks || '');
    setSurveyStatus(
      student.survey_status === 'PENDING' ? 'SURVEY COMPLETED' : student.survey_status
    );
    setSuccessNotice(null);
  }, [student.id]);

  const getPayload = (): Partial<Student> => ({
    is_aadhaar_provided: isAadhaarProvided,
    is_aadhaar_verified: isAadhaarVerified,
    apaar_pending_reason: reason,
    other_reason: reason === 'Other' || reason === 'अन्य (Other)' ? otherReason : '',
    remarks,
    survey_status: reason || isAadhaarProvided ? 'SURVEY COMPLETED' : surveyStatus,
    surveyor_name: currentUser?.name || 'Surveyor',
    survey_date: new Date().toISOString(),
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async (autoAdvance: boolean = false) => {
    setIsSaving(true);
    const payload = getPayload();
    const success = await updateStudentSurvey(student.id, payload);
    setIsSaving(false);

    if (success) {
      setSuccessNotice('सर्वेक्षण सफलतापूर्वक सहेजा गया! (Survey Saved)');
      setTimeout(() => {
        setSuccessNotice(null);
        if (autoAdvance) {
          if (onNext) {
            onNext();
          } else {
            onClose(); // Automatically close if no next student
          }
        } else {
          onClose(); // Automatically close modal after saving
        }
      }, 450);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-800 flex items-center justify-center text-blue-200">
              <ClipboardCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">APAAR Pending Survey</h3>
              <p className="text-xs text-blue-200 font-mono">
                PEN: {student.student_pen_number || 'N/A'} &bull; {student.student_name_marksheet}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs flex-1">
          
          {/* Save Success Alert Banner */}
          {successNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-lg flex items-center space-x-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successNotice}</span>
            </div>
          )}

          {/* SECTION 1: STUDENT SUMMARY CARD */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Student Information (विद्यार्थी विवरण)</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Block: <strong className="text-slate-800">{student.block_name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <span className="text-[10px] text-slate-400 block">विद्यार्थी का नाम:</span>
                <span className="font-bold text-slate-900 text-xs block truncate" title={student.student_name_marksheet}>
                  {student.student_name_marksheet}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">पिता का नाम:</span>
                <span className="font-medium text-slate-800 block truncate" title={student.father_name || '-'}>
                  {student.father_name || 'N/A in Excel'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">स्कूल का नाम:</span>
                <span className="font-medium text-slate-800 block truncate" title={student.school_name}>
                  {student.school_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">UDISE Code:</span>
                <span className="font-mono font-medium text-slate-800 block">
                  {student.udise_code}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">कक्षा व वर्ग:</span>
                <span className="font-medium text-slate-800 block">
                  Class {student.class_name} ({student.section || 'A'})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">पेन नंबर (PEN):</span>
                <span className="font-mono font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-block">
                  {student.student_pen_number}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">CLUSTER:</span>
                <span className="font-medium text-slate-800 block truncate" title={student.sankul_name}>
                  {student.sankul_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">श्रेणी:</span>
                <span className="font-medium text-slate-800 block">
                  {student.category || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: 3-QUESTION SURVEY FORM */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4 space-y-4 shadow-xs">
            <div className="border-b border-blue-100 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                <span>APAAR Student Survey (3 मुख्य प्रश्न)</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Dantewada District Portal
              </span>
            </div>

            {/* FIELD 1: Is AADHAAR Provided */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>Is AADHAAR Provided ?</span>
                  <span className="text-slate-500 font-normal">(क्या आधार उपलब्ध कराया गया है?)</span>
                </label>
                {isAadhaarProvided && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isAadhaarProvided === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {isAadhaarProvided}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAadhaarProvided('YES')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isAadhaarProvided === 'YES'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>YES (हाँ - आधार दिया गया है)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAadhaarProvided('NO')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isAadhaarProvided === 'NO'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>NO (नहीं - आधार उपलब्ध नहीं है)</span>
                </button>
              </div>
            </div>

            {/* FIELD 2: Is AADHAAR Verified */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>Is AADHAAR Verified ?</span>
                  <span className="text-slate-500 font-normal">(क्या आधार सत्यापित / वेरिफाइड है?)</span>
                </label>
                {isAadhaarVerified && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isAadhaarVerified === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isAadhaarVerified}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAadhaarVerified('YES')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isAadhaarVerified === 'YES'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>YES (हाँ - सत्यापित है)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAadhaarVerified('NO')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    isAadhaarVerified === 'NO'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-300'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>NO (नहीं - सत्यापित नहीं है)</span>
                </button>
              </div>
            </div>

            {/* FIELD 3: Reason For Not Generated Apaar Id */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                <span>Reason For Not Generated Apaar Id</span>
                <span className="text-slate-500 font-normal">(अपार आईडी नहीं बनने का कारण)</span>
                <span className="text-rose-600 font-bold">*</span>
              </label>

              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                <option value="">-- कारण चुनें (Select Reason) --</option>
                {SURVEY_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {(reason === 'Other' || reason === 'अन्य (Other)') && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    अन्य कारण लिखें (Specify Other Reason):
                  </label>
                  <input
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="विस्तार से कारण लिखें..."
                    className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Optional Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                रिमार्क्स / टिप्पणी (Optional Remarks):
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="फील्ड सत्यापन संबंधी कोई अन्य टिप्पणी..."
                className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900"
              />
            </div>

            {/* Surveyor details */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>सर्वेयर: <strong className="text-slate-700">{currentUser?.name || 'Surveyor'}</strong></span>
              <span>दिनांक: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          
          {/* Prev / Next Student in Modal */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-md flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला (Prev)</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-md flex items-center space-x-1 cursor-pointer"
            >
              <span>अगला (Next)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save / Close buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3.5 py-2 border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              Close (बंद करें)
            </button>
            
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सहेजा जा रहा है...' : 'Save (सहेजें)'}</span>
            </button>

            {hasNext && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Save & Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
