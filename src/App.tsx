import React from 'react';
import { StudentProvider, useStudents } from './context/StudentContext';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { StudentListView } from './components/Students/StudentListView';
import { ReportsView } from './components/Reports/ReportsView';
import { LoginPage } from './components/Auth/LoginPage';
import { RefreshCw, AlertCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, loading, error, currentUser, rawStudents } = useStudents();

  // Database loading spinner on initial startup if no cache exists yet
  if (loading && rawStudents.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
            <img src="/emblem.svg" alt="Emblem" className="w-full h-full object-contain" />
          </div>
          <RefreshCw className="w-6 h-6 text-blue-700 animate-spin mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Connecting to Google Sheet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Loading student master database (9,747 records) for Dantewada District...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, display the Government Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  if (error && rawStudents.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 rounded-xl p-6 max-w-md w-full text-center shadow-lg">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">Database Connection Error</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-blue-800 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Official Government Header */}
      <Header />

      {/* 3 Main Nav Tabs */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'students' && <StudentListView />}
        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-slate-700">
            Dantewada APAAR Pending Survey Portal &bull; जिला दंतेवाड़ा, छत्तीसगढ़
          </p>
          <p className="text-slate-500 text-[11px]">
            स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन (School Education Department, Govt. of Chhattisgarh) &bull; NIC / District Administration Dantewada
          </p>
          <p className="text-[10px] text-slate-400">
            {currentUser.role === 'ADMIN'
              ? 'District Administrator View (Full District Access &bull; 4 Blocks: Dantewada, Geedam, Kuakonda, Katekalyan)'
              : `School Portal View &bull; UDISE: ${currentUser.udiseCode || ''} &bull; ${currentUser.schoolName || ''}`}
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StudentProvider>
      <MainLayout />
    </StudentProvider>
  );
};

export default App;
