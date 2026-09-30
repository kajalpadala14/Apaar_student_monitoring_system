import React, { useState, useEffect } from 'react';
import { Student, SurveyStatus, SURVEY_REASONS } from '../../types/student';
import { useStudents } from '../../context/StudentContext';
import {
  X,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Check,
  Ban,
  User,
  Calendar,
  MapPin,
  Files,
  AlertCircle
} from 'lucide-react';

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

  // 1. Name Section
  const [studentNameMarksheet, setStudentNameMarksheet] = useState<string>('');
  const [studentNameAadhaar, setStudentNameAadhaar] = useState<string>('');
  const [nameMatchStatus, setNameMatchStatus] = useState<string>('');

  // 2. Date of Birth Section
  const [dobMarksheet, setDobMarksheet] = useState<string>('');
  const [dobAadhaar, setDobAadhaar] = useState<string>('');
  const [dobMatchStatus, setDobMatchStatus] = useState<string>('');

  // 3. Father's Name & District
  const [fatherName, setFatherName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');

  // 4. Documents Availability
  const [documentsAvailable, setDocumentsAvailable] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');

  // 5. Aadhaar & APAAR Reason
  const [isAadhaarProvided, setIsAadhaarProvided] = useState<string>('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>('SURVEY COMPLETED');
  
  const [isSaving, setIsSaving] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sync state whenever student prop changes
  useEffect(() => {
    // Name
    const initialMarksheetName = student.student_name_marksheet || '';
    const initialAadhaarName = student.student_name_aadhaar || '';
    setStudentNameMarksheet(initialMarksheetName);
    setStudentNameAadhaar(initialAadhaarName);
    if (student.name_match_status) {
      setNameMatchStatus(student.name_match_status);
    } else if (initialMarksheetName && initialAadhaarName) {
      setNameMatchStatus(
        initialMarksheetName.trim().toLowerCase() === initialAadhaarName.trim().toLowerCase() ? 'Match' : 'Mismatch'
      );
    } else {
      setNameMatchStatus('');
    }

    // DOB
    const initialDobMarksheet = student.dob_marksheet || '';
    const initialDobAadhaar = student.dob_aadhaar || '';
    setDobMarksheet(initialDobMarksheet);
    setDobAadhaar(initialDobAadhaar);
    if (student.dob_match_status) {
      setDobMatchStatus(student.dob_match_status);
    } else if (initialDobMarksheet && initialDobAadhaar) {
      setDobMatchStatus(initialDobMarksheet.trim() === initialDobAadhaar.trim() ? 'Match' : 'Mismatch');
    } else {
      setDobMatchStatus('');
    }

    // Father & District
    setFatherName(student.father_name || '');
    setDistrictName(student.district_name || student.student_district || 'Dantewada');

    // Documents Availability & Type
    const initialDocAvail = student.documents_available || '';
    if (initialDocAvail.startsWith('YES')) {
      setDocumentsAvailable('YES');
      if (initialDocAvail.includes('मार्कशीट') && initialDocAvail.includes('जन्म प्रमाण पत्र')) {
        setDocumentType('दोनों उपलब्ध हैं (Both - Marksheet & Birth Certificate)');
      } else if (initialDocAvail.includes('मार्कशीट') || initialDocAvail.toLowerCase().includes('marksheet')) {
        setDocumentType('मार्कशीट (Marksheet)');
      } else if (initialDocAvail.includes('जन्म प्रमाण पत्र') || initialDocAvail.toLowerCase().includes('birth')) {
        setDocumentType('जन्म प्रमाण पत्र (Birth Certificate)');
      } else {
        setDocumentType('');
      }
    } else if (initialDocAvail === 'NO') {
      setDocumentsAvailable('NO');
      setDocumentType('');
    } else if (initialDocAvail.includes('मार्कशीट') || initialDocAvail.includes('जन्म प्रमाण पत्र')) {
      setDocumentsAvailable('YES');
      if (initialDocAvail.includes('मार्कशीट') && initialDocAvail.includes('जन्म प्रमाण पत्र')) {
        setDocumentType('दोनों उपलब्ध हैं (Both - Marksheet & Birth Certificate)');
      } else if (initialDocAvail.includes('मार्कशीट')) {
        setDocumentType('मार्कशीट (Marksheet)');
      } else {
        setDocumentType('जन्म प्रमाण पत्र (Birth Certificate)');
      }
    } else {
      setDocumentsAvailable(initialDocAvail);
      setDocumentType('');
    }

    // Aadhaar & Reason
    setIsAadhaarProvided(student.is_aadhaar_provided || '');
    setIsAadhaarVerified(student.is_aadhaar_verified || '');
    setReason(student.apaar_pending_reason || '');
    setOtherReason(student.other_reason || '');
    setRemarks(student.remarks || '');
    setSurveyStatus(
      student.survey_status === 'PENDING' ? 'SURVEY COMPLETED' : student.survey_status
    );
    setSuccessNotice(null);
    setValidationErrors([]);
  }, [student.id]);

  // Auto update Name match status when typing if both are present
  const handleAadhaarNameChange = (val: string) => {
    setStudentNameAadhaar(val);
    if (studentNameMarksheet.trim() && val.trim()) {
      setNameMatchStatus(
        studentNameMarksheet.trim().toLowerCase() === val.trim().toLowerCase() ? 'Match' : 'Mismatch'
      );
    }
  };

  const handleMarksheetNameChange = (val: string) => {
    setStudentNameMarksheet(val);
    if (val.trim() && studentNameAadhaar.trim()) {
      setNameMatchStatus(
        val.trim().toLowerCase() === studentNameAadhaar.trim().toLowerCase() ? 'Match' : 'Mismatch'
      );
    }
  };

  // Auto update DOB match status when typing if both are present
  const handleAadhaarDobChange = (val: string) => {
    setDobAadhaar(val);
    if (dobMarksheet.trim() && val.trim()) {
      setDobMatchStatus(dobMarksheet.trim() === val.trim() ? 'Match' : 'Mismatch');
    }
  };

  const handleMarksheetDobChange = (val: string) => {
    setDobMarksheet(val);
    if (val.trim() && dobAadhaar.trim()) {
      setDobMatchStatus(val.trim() === dobAadhaar.trim() ? 'Match' : 'Mismatch');
    }
  };

  // Check if all verification checks are matched and YES
  const isNameMatched = nameMatchStatus?.trim().toLowerCase() === 'match';
  const isDobMatched = dobMatchStatus?.trim().toLowerCase() === 'match';
  const isAadhaarYes = isAadhaarProvided?.trim().toUpperCase() === 'YES';
  const isVerifiedYes = isAadhaarVerified?.trim().toUpperCase() === 'YES';
  const isDocsNotNo = !documentsAvailable || documentsAvailable?.trim().toUpperCase() !== 'NO';

  // When both Name & DOB match, and Aadhaar provided/verified are YES (and documents not NO), no pending reason is needed
  const isAllMatchedAndYes = isNameMatched && isDobMatched && isAadhaarYes && isVerifiedYes && isDocsNotNo;

  // Remarks are only shown and saved when one of the two UDISE portal entry reasons is selected
  const shouldShowRemarks =
    !isAllMatchedAndYes &&
    (reason === 'आधार कार्ड उपलब्ध हैं एवं UDISE पोर्टल में एंट्री पूर्ण कर लिया गया हैं ।।' ||
     reason === 'आधार कार्ड उपलब्ध हैं परन्तु UDISE पोर्टल में एंट्री नहीं हुआ हैं' ||
     (reason.includes('आधार कार्ड उपलब्ध हैं') && reason.includes('UDISE पोर्टल')));

  const getPayload = (): Partial<Student> => ({
    student_name_marksheet: studentNameMarksheet,
    student_name_aadhaar: isAadhaarProvided === 'NO' ? '' : studentNameAadhaar,
    name_match_status: nameMatchStatus,
    dob_marksheet: dobMarksheet,
    dob_aadhaar: isAadhaarProvided === 'NO' ? '' : dobAadhaar,
    dob_match_status: dobMatchStatus,
    father_name: fatherName,
    district_name: districtName,
    student_district: districtName,
    documents_available: documentsAvailable === 'YES'
      ? (documentType ? `YES - ${documentType}` : 'YES')
      : (documentsAvailable || ''),
    is_aadhaar_provided: isAadhaarProvided,
    is_aadhaar_verified: isAadhaarVerified,
    apaar_pending_reason: isAllMatchedAndYes ? '' : reason,
    other_reason: isAllMatchedAndYes ? '' : (reason === 'Other' || reason === 'अन्य (Other)' ? otherReason : ''),
    remarks: shouldShowRemarks ? remarks : '',
    survey_status: (isAllMatchedAndYes || reason || isAadhaarProvided || documentsAvailable || nameMatchStatus || dobMatchStatus) ? 'SURVEY COMPLETED' : surveyStatus,
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
    const errors: string[] = [];

    // 1. Aadhaar Provided & Verified (सबसे पहले)
    if (!isAadhaarProvided) {
      errors.push('1. Is AADHAAR Provided ? (आधार उपलब्ध कराया गया है? - YES या NO चुनें)');
    }
    if (!isAadhaarVerified) {
      errors.push('2. Is AADHAAR Verified ? (आधार सत्यापित है? - YES या NO चुनें)');
    }

    // 2. Name Section
    if (!studentNameMarksheet.trim()) {
      errors.push('विद्यार्थी का नाम (मार्कशीट अनुसार)');
    }
    if (isAadhaarProvided !== 'NO' && !studentNameAadhaar.trim()) {
      errors.push('विद्यार्थी का नाम (आधार अनुसार)');
    }
    if (!nameMatchStatus) {
      errors.push('Name Match Status (Match या Mismatch चुनें)');
    }

    // 3. DOB Section
    if (!dobMarksheet.trim()) {
      errors.push('जन्मतिथि (मार्कशीट अनुसार)');
    }
    if (isAadhaarProvided !== 'NO' && !dobAadhaar.trim()) {
      errors.push('जन्मतिथि (आधार अनुसार)');
    }
    if (!dobMatchStatus) {
      errors.push('DOB Match Status (Match या Mismatch चुनें)');
    }

    // 4. Father & District
    if (!fatherName.trim()) {
      errors.push('पिता का नाम (Father\'s Name)');
    }
    if (!districtName.trim()) {
      errors.push('जिला (District Name)');
    }

    // 5. Documents Availability
    if (!documentsAvailable) {
      errors.push('दस्तावेज़ उपलब्धता (YES या NO चुनें)');
    } else if (documentsAvailable === 'YES' && !documentType) {
      errors.push('उपलब्ध दस्तावेज़ का प्रकार (मार्कशीट / जन्म प्रमाण पत्र चुनें)');
    }

    // 6. Reason if not fully matched & verified
    if (!isAllMatchedAndYes) {
      if (!reason) {
        errors.push('अपार आईडी नहीं बनने का कारण (Select Reason)');
      } else if ((reason === 'Other' || reason === 'अन्य (Other)') && !otherReason.trim()) {
        errors.push('अन्य कारण का विवरण लिखें (Specify Other Reason)');
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      const scrollContainer = document.getElementById('survey-modal-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setValidationErrors([]);
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col h-full sm:h-auto sm:max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-800 flex items-center justify-center text-blue-200">
              <ClipboardCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">APAAR Pending Survey Form</h3>
              <p className="text-xs text-blue-200 font-mono">
                PEN: {student.student_pen_number || 'N/A'} &bull; {student.student_name_marksheet}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            title="बंद करें (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div id="survey-modal-scroll" className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs flex-1">
          
          {/* Validation Error Alert Banner */}
          {validationErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-lg flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block mb-1">कृपया निम्नलिखित अनिवार्य फ़ील्ड भरें (All Fields Are Mandatory):</span>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

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
                <span>Student Summary (विद्यार्थी विवरण)</span>
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

          {/* SECTION 2: SURVEY FORM */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-4 space-y-4 shadow-xs">
            <div className="border-b border-blue-100 pb-2 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                <span>APAAR Verification & Survey Details</span>
              </span>
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                * सभी फ़ील्ड भरना अनिवार्य है (All Fields Mandatory)
              </span>
            </div>

            {/* 1. AADHAAR AVAILABILITY & VERIFICATION (आधार उपलब्धता व सत्यापन) - SABSE PAHLE */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-3">
              {/* FIELD 1: Is AADHAAR Provided */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                    <span>Is AADHAAR Provided ? <span className="text-rose-500 font-bold">*</span></span>
                    <span className="text-slate-500 font-normal text-[11px]">(आधार उपलब्ध कराया गया है?)</span>
                  </label>
                  {isAadhaarProvided && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isAadhaarProvided === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isAadhaarProvided}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAadhaarProvided('YES')}
                    className={`py-2 sm:py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      isAadhaarProvided === 'YES'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs ring-2 ring-emerald-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>YES (हाँ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAadhaarProvided('NO');
                      if (!nameMatchStatus) setNameMatchStatus('Mismatch');
                      if (!dobMatchStatus) setDobMatchStatus('Mismatch');
                    }}
                    className={`py-2 sm:py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      isAadhaarProvided === 'NO'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs ring-2 ring-rose-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>NO (नहीं)</span>
                  </button>
                </div>
              </div>

              {/* FIELD 2: Is AADHAAR Verified */}
              <div className="space-y-1.5 pt-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                    <span>Is AADHAAR Verified ? <span className="text-rose-500 font-bold">*</span></span>
                    <span className="text-slate-500 font-normal text-[11px]">(आधार सत्यापित है?)</span>
                  </label>
                  {isAadhaarVerified && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isAadhaarVerified === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isAadhaarVerified}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAadhaarVerified('YES')}
                    className={`py-2 sm:py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      isAadhaarVerified === 'YES'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs ring-2 ring-blue-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>YES (सत्यापित है)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAadhaarVerified('NO')}
                    className={`py-2 sm:py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      isAadhaarVerified === 'NO'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs ring-2 ring-amber-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>NO (सत्यापित नहीं है)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. NAME VERIFICATION SECTION */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-blue-700" />
                  <span>Name (विद्यार्थी का नाम) <span className="text-rose-500 font-bold">*</span></span>
                </label>
                {nameMatchStatus && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                    nameMatchStatus === 'Match' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {nameMatchStatus === 'Match' ? <Check className="w-3 h-3 inline mr-0.5" /> : <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                    <span>{nameMatchStatus === 'Match' ? 'Name Matched' : 'Name Mismatch'}</span>
                  </span>
                )}
              </div>

              <div className={`grid grid-cols-1 ${isAadhaarProvided === 'NO' ? '' : 'sm:grid-cols-2'} gap-3`}>
                {/* Marksheet-wise Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Marksheet-wise Name <span className="text-rose-500 font-bold">*</span> <span className="text-slate-400 font-normal">(मार्कशीट अनुसार)</span>:
                  </label>
                  <input
                    type="text"
                    value={studentNameMarksheet}
                    onChange={(e) => handleMarksheetNameChange(e.target.value)}
                    placeholder="मार्कशीट के अनुसार नाम..."
                    className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aadhaar-wise Name (Hidden if Aadhaar not provided) */}
                {isAadhaarProvided !== 'NO' && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Aadhaar-wise Name <span className="text-rose-500 font-bold">*</span> <span className="text-slate-400 font-normal">(आधार अनुसार)</span>:
                    </label>
                    <input
                      type="text"
                      value={studentNameAadhaar}
                      onChange={(e) => handleAadhaarNameChange(e.target.value)}
                      placeholder="आधार कार्ड के अनुसार नाम..."
                      className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Name Match Status Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Name Match Status: <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNameMatchStatus('Match')}
                    className={`py-2 sm:py-1.5 px-3 rounded-md border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      nameMatchStatus === 'Match'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Match (नाम समान है)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNameMatchStatus('Mismatch')}
                    className={`py-2 sm:py-1.5 px-3 rounded-md border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      nameMatchStatus === 'Mismatch'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Mismatch (नाम भिन्न है)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. DATE OF BIRTH (D.O.B.) SECTION */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <span>Date of Birth (D.O.B. / जन्मतिथि) <span className="text-rose-500 font-bold">*</span></span>
                </label>
                {dobMatchStatus && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                    dobMatchStatus === 'Match' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {dobMatchStatus === 'Match' ? <Check className="w-3 h-3 inline mr-0.5" /> : <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                    <span>{dobMatchStatus === 'Match' ? 'DOB Matched' : 'DOB Mismatch'}</span>
                  </span>
                )}
              </div>

              <div className={`grid grid-cols-1 ${isAadhaarProvided === 'NO' ? '' : 'sm:grid-cols-2'} gap-3`}>
                {/* Marksheet-wise DOB */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Marksheet-wise DOB <span className="text-rose-500 font-bold">*</span> <span className="text-slate-400 font-normal">(मार्कशीट अनुसार)</span>:
                  </label>
                  <input
                    type="text"
                    value={dobMarksheet}
                    onChange={(e) => handleMarksheetDobChange(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aadhaar-wise DOB (Hidden if Aadhaar not provided) */}
                {isAadhaarProvided !== 'NO' && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Aadhaar-wise DOB <span className="text-rose-500 font-bold">*</span> <span className="text-slate-400 font-normal">(आधार अनुसार)</span>:
                    </label>
                    <input
                      type="text"
                      value={dobAadhaar}
                      onChange={(e) => handleAadhaarDobChange(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* DOB Match Status Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  DOB Match Status: <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDobMatchStatus('Match')}
                    className={`py-2 sm:py-1.5 px-3 rounded-md border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      dobMatchStatus === 'Match'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Match (DOB समान है)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDobMatchStatus('Mismatch')}
                    className={`py-2 sm:py-1.5 px-3 rounded-md border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      dobMatchStatus === 'Mismatch'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Mismatch (DOB भिन्न है)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. FATHER'S NAME & DISTRICT NAME */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Father's Name */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  <span>Father's Name (पिता का नाम) <span className="text-rose-500 font-bold">*</span></span>
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="पिता का नाम दर्ज करें..."
                  className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* District Name */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-700" />
                  <span>District Name (जिला) <span className="text-rose-500 font-bold">*</span></span>
                </label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="जिले का नाम (जैसे Dantewada)..."
                  className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 5. DOCUMENTS AVAILABILITY */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Files className="w-4 h-4 text-blue-700" />
                  <span>Documents Availability (दस्तावेज़ उपलब्धता) <span className="text-rose-500 font-bold">*</span></span>
                </label>
                {documentsAvailable && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    documentsAvailable === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {documentsAvailable === 'YES'
                      ? (documentType ? `उपलब्ध: ${documentType.split('(')[0].trim()}` : 'Available (उपलब्ध)')
                      : 'Not Available (अनुपलब्ध)'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setDocumentsAvailable('YES')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    documentsAvailable === 'YES'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>YES (हाँ - दस्तावेज़ उपलब्ध हैं)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocumentsAvailable('NO');
                    setDocumentType('');
                  }}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    documentsAvailable === 'NO'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  <span>NO (नहीं - दस्तावेज़ उपलब्ध नहीं हैं)</span>
                </button>
              </div>

              {/* Dropdown when YES is selected */}
              {documentsAvailable === 'YES' && (
                <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-150 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-800 flex items-center justify-between">
                    <span>उपलब्ध दस्तावेज़ का प्रकार (Select Document Type): <span className="text-rose-500 font-bold">*</span></span>
                    {documentType && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        चयनित: {documentType.split('(')[0].trim()}
                      </span>
                    )}
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    <option value="">-- उपलब्ध दस्तावेज़ चुनें (Select Document) --</option>
                    <option value="मार्कशीट (Marksheet)">मार्कशीट (Marksheet)</option>
                    <option value="जन्म प्रमाण पत्र (Birth Certificate)">जन्म प्रमाण पत्र (Birth Certificate)</option>
                    <option value="दोनों उपलब्ध हैं (Both - Marksheet & Birth Certificate)">दोनों उपलब्ध हैं (Both - Marksheet & Birth Certificate)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 6. REASON FOR NOT GENERATED APAAR ID (अपार आईडी नहीं बनने का कारण) */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200">
              {isAllMatchedAndYes ? (
                <div className="animate-in fade-in duration-150">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">सभी विवरण सत्यापित एवं मिलान पूर्ण (All Details Matched & Verified)</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        नाम, जन्मतिथि, आधार एवं दस्तावेज़ सत्यापित हैं। अपार आईडी लंबित रहने का कोई कारण नहीं है।
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Reason For Not Generated Apaar Id <span className="text-rose-500 font-bold">*</span></span>
                    <span className="text-slate-500 font-normal text-[11px]">(अपार आईडी नहीं बनने का कारण)</span>
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
                        अन्य कारण लिखें (Specify Other Reason): <span className="text-rose-500 font-bold">*</span>
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
              )}
            </div>

            {/* Remarks (Shown only when UDISE portal entry reasons are selected) */}
            {shouldShowRemarks && (
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200 animate-in fade-in duration-150 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  रिमार्क्स / टिप्पणी (Remarks):
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="यू-डाइस (UDISE) या फील्ड सत्यापन संबंधी टिप्पणी लिखें..."
                  className="w-full bg-white border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            )}

            {/* Surveyor details */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>सर्वेयर: <strong className="text-slate-700">{currentUser?.name || 'Surveyor'}</strong></span>
              <span>दिनांक: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-3.5 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.04)]">
          
          {/* Prev / Next Student in Modal */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasPrev}
              className="flex-1 sm:flex-none text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>पिछला (Prev)</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              className="flex-1 sm:flex-none text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 sm:py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>अगला (Next)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save / Close buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-1.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 sm:px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer text-center"
            >
              Close (बंद करें)
            </button>
            
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white text-xs font-bold px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-lg shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सहेजा जा रहा है...' : 'Save (सहेजें)'}</span>
            </button>

            {hasNext && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-xs font-bold px-4 py-2.5 sm:py-2 rounded-lg shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
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
