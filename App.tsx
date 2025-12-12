import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Phase1_RiskAssessment from './components/Phase1_RiskAssessment';
import Phase2_Substantive from './components/Phase2_Substantive';
import Phase3_Reporting from './components/Phase3_Reporting';
import { LedgerTransaction, BankStatementItem, Finding } from './types';
import { APP_NAME, COMPANY_NAME } from './constants';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyName, setCompanyName] = useState<string>(COMPANY_NAME);
  const [ledgerData, setLedgerData] = useState<LedgerTransaction[]>([]);
  const [bankData, setBankData] = useState<BankStatementItem[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<string>('');

  const handleDataLoaded = (ledger: LedgerTransaction[], bank: BankStatementItem[]) => {
    setLedgerData(ledger);
    setBankData(bank);
    alert("Data berhasil diimpor ke sistem.");
  };

  const handleAddFinding = (finding: Finding) => {
    // Avoid duplicates based on ID
    setFindings(prev => {
        if(prev.find(f => f.id === finding.id)) return prev;
        return [...prev, finding];
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* Sidebar */}
      <Sidebar currentStep={currentStep} onStepChange={setCurrentStep} />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-3xl font-bold text-gray-900">{APP_NAME}</h1>
             <p className="text-sm text-gray-500 mt-1">Klien: <span className="font-semibold text-blue-700">{companyName}</span> | Periode: 31 Des 2023</p>
          </div>
          <div className="text-right">
             <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold tracking-wide uppercase">
               Work In Progress
             </span>
          </div>
        </header>

        <main>
          {currentStep === 1 && (
            <Phase1_RiskAssessment 
              onDataLoaded={handleDataLoaded}
              onRiskAssessed={(analysis) => setRiskAssessment(analysis)}
              currentCompanyName={companyName}
              onCompanyNameChange={setCompanyName}
            />
          )}

          {currentStep === 2 && (
            ledgerData.length > 0 ? (
              <Phase2_Substantive 
                ledger={ledgerData}
                bankData={bankData}
                onAddFinding={handleAddFinding}
              />
            ) : (
              <div className="text-center py-20 bg-white rounded-lg shadow border border-dashed border-gray-300">
                 <p className="text-gray-500 mb-4">Data Akuntansi belum tersedia.</p>
                 <button 
                   onClick={() => setCurrentStep(1)}
                   className="text-blue-600 hover:underline font-medium"
                 >
                   Kembali ke Tahap 1 untuk Import Data
                 </button>
              </div>
            )
          )}

          {currentStep === 3 && (
            <Phase3_Reporting 
              findings={findings}
              ledgerData={ledgerData}
              companyName={companyName}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;