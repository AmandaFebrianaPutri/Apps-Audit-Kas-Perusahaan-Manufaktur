import React, { useState } from 'react';
import { INITIAL_ICQ, MOCK_LEDGER, MOCK_BANK_STATEMENT, COMPANY_NAME } from '../constants';
import { ICQQuestion, MaterialityConfig, LedgerTransaction, BankStatementItem } from '../types';
import { analyzeInternalControls } from '../services/geminiService';

interface Phase1Props {
  onDataLoaded: (ledger: any[], bank: any[]) => void;
  onRiskAssessed: (riskLevel: string) => void;
  currentCompanyName: string;
  onCompanyNameChange: (name: string) => void;
}

const Phase1_RiskAssessment: React.FC<Phase1Props> = ({ onDataLoaded, onRiskAssessed, currentCompanyName, onCompanyNameChange }) => {
  const [icq, setIcq] = useState<ICQQuestion[]>(INITIAL_ICQ);
  const [financials, setFinancials] = useState({ assets: 0, revenue: 0, netIncome: 0 });
  const [materiality, setMateriality] = useState<MaterialityConfig | null>(null);
  const [isDataImported, setIsDataImported] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [importMode, setImportMode] = useState<'demo' | 'custom'>('demo');

  // Custom Upload State
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [bankFile, setBankFile] = useState<File | null>(null);

  const handleDemoImport = () => {
    // Simulate file reading delay
    setTimeout(() => {
      onCompanyNameChange(COMPANY_NAME);
      onDataLoaded(MOCK_LEDGER, MOCK_BANK_STATEMENT);
      setIsDataImported(true);
      // Pre-fill financials for demo
      setFinancials({ assets: 50000000000, revenue: 120000000000, netIncome: 8500000000 });
    }, 800);
  };

  const handleFileRead = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                resolve(json);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
  };

  const handleCustomUpload = async () => {
      if (!ledgerFile || !bankFile || !currentCompanyName) {
          alert("Mohon lengkapi Nama Perusahaan dan kedua file JSON.");
          return;
      }

      try {
          const ledgerJSON = await handleFileRead(ledgerFile);
          const bankJSON = await handleFileRead(bankFile);
          
          // Simple validation check
          if (!Array.isArray(ledgerJSON) || !Array.isArray(bankJSON)) {
              alert("Format JSON tidak valid. Harus berupa Array.");
              return;
          }

          onDataLoaded(ledgerJSON, bankJSON);
          setIsDataImported(true);
          // Reset financials for manual input
          setFinancials({ assets: 0, revenue: 0, netIncome: 0 });
      } catch (error) {
          console.error(error);
          alert("Gagal membaca file. Pastikan format JSON valid.");
      }
  };

  const calculateMateriality = () => {
    if (financials.revenue === 0 && financials.netIncome === 0) {
        alert("Mohon isi data keuangan terlebih dahulu.");
        return;
    }
    // Simple Rule of Thumb: 0.5% - 1% of Revenue or 5-10% of Net Income
    const om = financials.revenue * 0.005; // 0.5% of Revenue
    const pm = om * 0.75; // 75% of OM
    setMateriality({
      totalAssets: financials.assets,
      totalRevenue: financials.revenue,
      netIncome: financials.netIncome,
      overallMateriality: om,
      performanceMateriality: pm
    });
  };

  const handleICQChange = (id: string, val: 'Yes' | 'No' | 'N/A') => {
    setIcq(prev => prev.map(q => q.id === id ? { ...q, answer: val } : q));
  };

  const runRiskAnalysis = async () => {
    if (icq.some(q => q.answer === null)) {
      alert("Harap jawab semua pertanyaan kuesioner.");
      return;
    }
    setLoadingAi(true);
    const result = await analyzeInternalControls(icq);
    setAiAnalysis(result);
    onRiskAssessed(result);
    setLoadingAi(false);
  };

  const downloadTemplate = () => {
      const templateLedger = JSON.stringify(MOCK_LEDGER.slice(0, 2), null, 2);
      const templateBank = JSON.stringify(MOCK_BANK_STATEMENT.slice(0, 2), null, 2);
      
      const blob = new Blob([`CONTOH FORMAT GL:\n${templateLedger}\n\nCONTOH FORMAT BANK:\n${templateBank}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_data_audit.txt';
      a.click();
  };

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tahap I: Penilaian Risiko (Risk Assessment)</h2>
        <p className="text-gray-500">Import data, hitung materialitas, dan evaluasi pengendalian internal.</p>
      </div>

      {/* Module 1: Data Import */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-blue-700">1. Setup Klien & Import Data</h3>
            <button onClick={downloadTemplate} className="text-xs text-blue-600 underline hover:text-blue-800">Download Template JSON</button>
        </div>

        <div className="flex gap-4 mb-4">
            <button 
                onClick={() => setImportMode('demo')} 
                className={`px-4 py-2 text-sm font-medium rounded-full ${importMode === 'demo' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                Demo Mode
            </button>
            <button 
                onClick={() => setImportMode('custom')} 
                className={`px-4 py-2 text-sm font-medium rounded-full ${importMode === 'custom' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                Upload Data Klien
            </button>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
          {importMode === 'demo' ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">PT Manufaktur Maju Tbk (Mock Data)</p>
                  <p className="text-sm text-gray-500">Gunakan data simulasi untuk demonstrasi fitur.</p>
                </div>
                <button
                    onClick={handleDemoImport}
                    disabled={isDataImported}
                    className={`px-4 py-2 rounded-md font-medium text-white transition ${isDataImported ? 'bg-green-600 cursor-default' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isDataImported ? 'Data Terload' : 'Load Demo Data'}
                </button>
              </div>
          ) : (
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan Klien</label>
                      <input 
                        type="text" 
                        value={currentCompanyName} 
                        onChange={(e) => onCompanyNameChange(e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Contoh: PT Sejahtera Abadi Tbk"
                      />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Buku Besar (JSON)</label>
                          <input 
                            type="file" 
                            accept=".json"
                            onChange={(e) => setLedgerFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Rekening Koran (JSON)</label>
                          <input 
                            type="file" 
                            accept=".json"
                            onChange={(e) => setBankFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                      </div>
                  </div>
                  <div className="text-right">
                    <button
                        onClick={handleCustomUpload}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 shadow-sm"
                    >
                        Proses Upload Data
                    </button>
                  </div>
              </div>
          )}
        </div>
      </section>

      {/* Module 2: Materiality */}
      {isDataImported && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-700">2. Perhitungan Materialitas</h3>
          <p className="text-xs text-gray-500 -mt-2">Silakan isi/sesuaikan data keuangan per 31 Desember (Unaudited).</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Aset</label>
              <input
                type="number"
                value={financials.assets}
                onChange={(e) => setFinancials({...financials, assets: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Penjualan (Revenue)</label>
              <input
                type="number"
                value={financials.revenue}
                onChange={(e) => setFinancials({...financials, revenue: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Laba Bersih</label>
              <input
                type="number"
                value={financials.netIncome}
                onChange={(e) => setFinancials({...financials, netIncome: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={calculateMateriality}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Hitung Materialitas
          </button>

          {materiality && (
            <div className="mt-4 bg-indigo-50 p-4 rounded-md border border-indigo-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Overall Materiality (OM)</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(materiality.overallMateriality)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Performance Materiality (PM - 75%)</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(materiality.performanceMateriality)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Module 3: ICQ */}
      {isDataImported && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-blue-700">3. Evaluasi Pengendalian Internal (ICQ)</h3>
            <button
              onClick={runRiskAnalysis}
              disabled={loadingAi}
              className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loadingAi ? 'Menganalisis...' : 'AI Risk Analysis'}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pertanyaan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bobot Risiko</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jawaban</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {icq.map((q) => (
                  <tr key={q.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{q.question}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        q.riskWeight === 'High' ? 'bg-red-100 text-red-800' : 
                        q.riskWeight === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {q.riskWeight}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {(['Yes', 'No', 'N/A'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleICQChange(q.id, opt)}
                          className={`px-3 py-1 rounded border ${q.answer === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {aiAnalysis && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
              <h4 className="text-sm font-bold text-purple-900 mb-2">🤖 Gemini Analysis:</h4>
              <p className="text-sm text-purple-800 whitespace-pre-wrap">{aiAnalysis}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Phase1_RiskAssessment;