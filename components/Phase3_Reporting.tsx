import React, { useState, useMemo } from 'react';
import { Finding, LedgerTransaction, TransactionType } from '../types';
import { generateAuditOpinion } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Phase3Props {
  findings: Finding[];
  ledgerData: LedgerTransaction[];
  companyName: string;
}

const Phase3_Reporting: React.FC<Phase3Props> = ({ findings, ledgerData, companyName }) => {
  const [opinion, setOpinion] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // --- Logic: Calculate Lead Schedule Numbers ---
  const leadSchedule = useMemo(() => {
    // 1. Calculate Unaudited Book Balance (Saldo Per Klien)
    const initialBalance = ledgerData.find(t => t.description.includes('Saldo Awal'))?.amount || 0;
    const totalDebits = ledgerData.filter(t => t.type === TransactionType.DEBIT && !t.description.includes('Saldo Awal')).reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = ledgerData.filter(t => t.type === TransactionType.CREDIT).reduce((sum, t) => sum + t.amount, 0);
    const endingBookBalance = initialBalance + totalDebits - totalCredits;

    // 2. Calculate Audit Adjustments based on Findings
    // Assumption: Findings with "Biaya" are credits to cash, "Jasa/Pendapatan" are debits to cash.
    // General findings are usually reducing cash (Credits) for conservatism in this mock.
    let adjDebit = 0;
    let adjCredit = 0;

    findings.forEach(f => {
        if (f.title.toLowerCase().includes('jasa') || f.title.toLowerCase().includes('pendapatan')) {
            adjDebit += f.amount;
        } else {
            // Default to Credit (Expense, Shortage, Fraud correction)
            adjCredit += f.amount;
        }
    });

    const auditedBalance = endingBookBalance + adjDebit - adjCredit;
    const priorYearBalance = 480000000; // Mock PY Balance for comparison

    return {
        book: endingBookBalance,
        adjDebit,
        adjCredit,
        audited: auditedBalance,
        priorYear: priorYearBalance
    };
  }, [ledgerData, findings]);


  const generateReport = async () => {
    setLoading(true);
    // Include the calculated numbers in the prompt for better AI context
    const contextFindings = [
        ...findings, 
        { 
            id: 'SUMMARY', 
            title: 'Ringkasan Angka Audit', 
            description: `Saldo Buku: ${leadSchedule.book}, Penyesuaian: -${leadSchedule.adjCredit} +${leadSchedule.adjDebit}, Saldo Audit: ${leadSchedule.audited}`, 
            severity: 'High', 
            amount: 0, 
            recommendation: '' 
        }
    ];
    
    const result = await generateAuditOpinion(contextFindings);
    setOpinion(result);
    setLoading(false);
  };

  const downloadPDF = () => {
    alert("Simulasi: File 'Laporan_Audit_Kas_Final.pdf' sedang diunduh...");
  };

  // Prepare Chart Data
  const chartData = [
    { name: 'High Risk', count: findings.filter(f => f.severity === 'High').length },
    { name: 'Medium Risk', count: findings.filter(f => f.severity === 'Medium').length },
    { name: 'Low Risk', count: findings.filter(f => f.severity === 'Low').length },
  ];

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tahap III: Pelaporan & Dokumentasi (SA 230)</h2>
        <p className="text-gray-500">Lead Schedule, Jurnal Penyesuaian, dan Opini Audit.</p>
      </div>

      {/* SECTION 1: LEAD SCHEDULE (TABEL PELAPORAN UTAMA) */}
      <section className="bg-white border border-gray-300 shadow-sm rounded-md overflow-hidden">
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-900 uppercase">A. Lead Schedule: Kas & Setara Kas</h3>
                <p className="text-xs text-gray-500">Kertas Kerja: C | Mata Uang: IDR | Entitas: <span className="font-bold">{companyName}</span></p>
            </div>
            <div className="text-right">
                <p className="text-xs font-mono text-gray-600">WP Ref: C.100</p>
                <p className="text-xs font-mono text-gray-600">Date: 31/12/2023</p>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm font-mono">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                    <tr>
                        <th className="px-4 py-3 text-left w-1/4">Keterangan Akun</th>
                        <th className="px-4 py-3 text-center">Ref</th>
                        <th className="px-4 py-3 text-right bg-blue-50">Per Klien<br/><span className="text-xs font-normal">31 Des 2023</span></th>
                        <th className="px-4 py-3 text-right">Penyesuaian<br/><span className="text-xs font-normal">Debit</span></th>
                        <th className="px-4 py-3 text-right">Penyesuaian<br/><span className="text-xs font-normal">Kredit</span></th>
                        <th className="px-4 py-3 text-right bg-green-50">Per Audit<br/><span className="text-xs font-normal">31 Des 2023</span></th>
                        <th className="px-4 py-3 text-right text-gray-500">Per Audit<br/><span className="text-xs font-normal">31 Des 2022</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {/* Mock Breakdown Rows to make it look realistic for a Public Company */}
                    <tr>
                        <td className="px-4 py-2">Kas Besar (Cash on Hand)</td>
                        <td className="px-4 py-2 text-center text-blue-600 cursor-pointer hover:underline">C.101</td>
                        <td className="px-4 py-2 text-right bg-blue-50/30">{formatIDR(5000000)}</td>
                        <td className="px-4 py-2 text-right text-gray-300">-</td>
                        <td className="px-4 py-2 text-right text-gray-300">-</td>
                        <td className="px-4 py-2 text-right bg-green-50/30">{formatIDR(5000000)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{formatIDR(5000000)}</td>
                    </tr>
                    <tr>
                        <td className="px-4 py-2">Bank Utama (Main Account)</td>
                        <td className="px-4 py-2 text-center text-blue-600 cursor-pointer hover:underline">C.102</td>
                        <td className="px-4 py-2 text-right bg-blue-50/30">{formatIDR(leadSchedule.book - 5000000)}</td>
                        <td className="px-4 py-2 text-right">{leadSchedule.adjDebit > 0 ? formatIDR(leadSchedule.adjDebit) : '-'}</td>
                        <td className="px-4 py-2 text-right">{leadSchedule.adjCredit > 0 ? `(${formatIDR(leadSchedule.adjCredit)})` : '-'}</td>
                        <td className="px-4 py-2 text-right bg-green-50/30">{formatIDR(leadSchedule.audited - 5000000)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{formatIDR(leadSchedule.priorYear - 5000000)}</td>
                    </tr>
                    
                    {/* Total Row */}
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <td className="px-4 py-3">Total Kas & Setara Kas</td>
                        <td className="px-4 py-3 text-center">TB</td>
                        <td className="px-4 py-3 text-right text-blue-900">{formatIDR(leadSchedule.book)}</td>
                        <td className="px-4 py-3 text-right">{leadSchedule.adjDebit > 0 ? formatIDR(leadSchedule.adjDebit) : '-'}</td>
                        <td className="px-4 py-3 text-right text-red-700">{leadSchedule.adjCredit > 0 ? `(${formatIDR(leadSchedule.adjCredit)})` : '-'}</td>
                        <td className="px-4 py-3 text-right text-green-900 border-b-4 border-double border-green-800">{formatIDR(leadSchedule.audited)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatIDR(leadSchedule.priorYear)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div className="p-4 bg-gray-50 text-xs text-gray-500 italic border-t">
            * <span className="font-bold">TB</span> = Trial Balance Trace. Angka Per Audit 2023 akan dicatat ke Laporan Posisi Keuangan.
        </div>
      </section>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Findings List */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-blue-800 mb-3">B. Rincian Temuan & Usulan Jurnal (AJE)</h3>
            {findings.length === 0 ? (
              <div className="p-4 bg-gray-50 text-gray-500 rounded border border-dashed">Tidak ada temuan signifikan.</div>
            ) : (
                <div className="bg-white border rounded shadow-sm">
                    {/* Findings Table Format for AJE */}
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="p-3 text-left">No</th>
                                <th className="p-3 text-left">Uraian Temuan / Jurnal Koreksi</th>
                                <th className="p-3 text-right">Debit</th>
                                <th className="p-3 text-right">Kredit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {findings.filter(f => f.amount > 0).map((f, i) => (
                                <React.Fragment key={f.id}>
                                    {/* Description Row */}
                                    <tr className="bg-gray-50">
                                        <td className="p-3 font-bold text-gray-600 align-top" rowSpan={2}>{i + 1}</td>
                                        <td className="p-3 font-semibold text-gray-800">{f.title}</td>
                                        <td className="p-3 text-right font-mono"></td>
                                        <td className="p-3 text-right font-mono"></td>
                                    </tr>
                                    {/* Journal Row */}
                                    <tr>
                                        <td className="px-3 pb-3 pt-0">
                                            <div className="pl-4 py-1">Beban/Pendapatan Lain-lain</div>
                                            <div className="pl-8 py-1">Kas & Bank</div>
                                            <div className="text-xs text-gray-500 mt-1 italic">Ref: {f.description}</div>
                                        </td>
                                        <td className="px-3 pb-3 pt-0 text-right font-mono align-top">
                                            {/* Logic simplified: usually expense is Debit, Cash is Credit for shortage/expense */}
                                            {formatIDR(f.amount)}
                                        </td>
                                        <td className="px-3 pb-3 pt-0 text-right font-mono align-top">
                                            {formatIDR(f.amount)}
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {findings.filter(f => f.amount > 0).length === 0 && (
                                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Tidak ada jurnal penyesuaian yang diperlukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
          </section>
        </div>

        {/* Right Col: Analytics & Final */}
        <div className="space-y-6">
           <div className="bg-white p-4 rounded shadow border h-64">
              <h4 className="text-sm font-bold text-gray-500 mb-2 text-center">Visualisasi Risiko Audit</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" barSize={30} />
                </BarChart>
              </ResponsiveContainer>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
             <h3 className="font-bold text-lg mb-2">Opini Auditor Independen</h3>
             {!opinion ? (
               <button 
                 onClick={generateReport}
                 disabled={loading}
                 className="w-full py-3 bg-white text-indigo-700 font-bold rounded shadow hover:bg-gray-100 disabled:opacity-75 transition"
               >
                 {loading ? 'Sedang Menyusun Opini...' : 'Generate Draft Opini (AI)'}
               </button>
             ) : (
               <div className="space-y-4 animate-fade-in">
                 <div className="bg-white/10 p-3 rounded border border-white/20 text-sm leading-relaxed italic">
                    {opinion}
                 </div>
                 <div className="flex gap-2">
                    <button 
                    onClick={downloadPDF}
                    className="flex-1 py-2 bg-green-500 text-white font-bold rounded shadow hover:bg-green-600 text-sm"
                    >
                    Download Kertas Kerja
                    </button>
                    <button 
                    onClick={() => setOpinion('')}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-sm"
                    >
                    Reset
                    </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Phase3_Reporting;