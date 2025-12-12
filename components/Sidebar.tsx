import React from 'react';

interface SidebarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

const steps = [
  { id: 1, title: 'I. Penilaian Risiko', desc: 'Data, Materialitas, ICQ' },
  { id: 2, title: 'II. Pengujian Substantif', desc: 'Rekonsiliasi, Opname, Fraud' },
  { id: 3, title: 'III. Pelaporan', desc: 'Temuan & Opini Audit' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentStep, onStepChange }) => {
  return (
    <div className="w-64 bg-slate-900 min-h-screen text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight text-blue-400">AuditKas <span className="text-white">Pro</span></h1>
        <p className="text-xs text-slate-400 mt-1">Manufaktur Edition</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepChange(step.id)}
            className={`w-full flex flex-col items-start p-3 rounded-md transition-colors ${
              currentStep === step.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="font-semibold text-sm">Tahap {step.id}</span>
            <span className="text-xs opacity-90">{step.title}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
            AU
          </div>
          <div>
            <p className="text-sm font-medium">Auditor Senior</p>
            <p className="text-xs text-slate-400">KAP Independen</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
