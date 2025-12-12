import React, { useState, useMemo } from 'react';
import { LedgerTransaction, BankStatementItem, TransactionType, ReconciliationResult, Finding } from '../types';
import { detectFraudAnomalies } from '../services/geminiService';

interface Phase2Props {
  ledger: LedgerTransaction[];
  bankData: BankStatementItem[];
  onAddFinding: (finding: Finding) => void;
}

const Phase2_Substantive: React.FC<Phase2Props> = ({ ledger, bankData, onAddFinding }) => {
  const [activeTab, setActiveTab] = useState<'Recon' | 'Opname' | 'Fraud'>('Recon');
  const [reconciledData, setReconciledData] = useState<ReconciliationResult | null>(null);
  
  // Cash Opname State
  const [cashCount, setCashCount] = useState({ 100000: 0, 50000: 0, 20000: 0, 10000: 0 });
  const pettyCashFundLimit = 5000000;
  
  // Fraud State
  const [fraudAnalysis, setFraudAnalysis] = useState<any[]>([]);
  const [loadingFraud, setLoadingFraud] = useState(false);

  // --- Logic: Bank Reconciliation ---
  const runAutoReconciliation = () => {
    const bookTxs = [...ledger];
    const bankTxs = [...bankData];

    const matchedBookIds = new Set<string>();
    const matchedBankIds = new Set<string>();

    // Matching Logic: Amount matches exactly
    // Book Debit (Receipt) <-> Bank Credit (Deposit)
    // Book Credit (Disbursement) <-> Bank Debit (Withdrawal)

    bookTxs.forEach(bt => {
      // Find matching in bank
      const targetType = bt.type === TransactionType.DEBIT ? 'CR' : 'DB';
      const match = bankTxs.find(bk => 
        !matchedBankIds.has(bk.id) && 
        bk.amount === bt.amount && 
        bk.type === targetType
      );

      if (match) {
        matchedBookIds.add(bt.id);
        matchedBankIds.add(match.id);
      }
    });

    const outstandingChecks = bookTxs.filter(t => !matchedBookIds.has(t.id) && t.type === TransactionType.CREDIT);
    const depositsInTransit = bookTxs.filter(t => !matchedBookIds.has(t.id) && t.type === TransactionType.DEBIT);
    const bankCharges = bankTxs.filter(t => !matchedBankIds.has(t.id) && t.type === 'DB'); // Usually charges
    const unknownDiffs = bankTxs.filter(t => !matchedBankIds.has(t.id) && t.type === 'CR'); // Usually interest or unknown deposits

    // Calculate Adjusted Balance
    // Start with Balance per Bank (last balance usually, but let's assume end sum here for simplicity or take last item)
    // For this mock, let's just calculate derived balances
    
    // Balance Per Book
    const initialBook = bookTxs.find(t => t.description.includes('Saldo Awal'))?.amount || 0;
    const bookDebits = bookTxs.filter(t => t.type === TransactionType.DEBIT && t.description !== 'Saldo Awal').reduce((sum, t) => sum + t.amount, 0);
    const bookCredits = bookTxs.filter(t => t.type === TransactionType.CREDIT).reduce((sum, t) => sum + t.amount, 0);
    const endingBook = initialBook + bookDebits - bookCredits;

    // Balance Per Bank (Mock: Ending Balance)
    // In real app, parse header. Here, derive from Ledger + Diff
    // Bank Balance = Book Balance + OutChecks - DepTransit - BankCharges + Interest
    // Let's reverse: Adjusted Balance should match.
    // Adjusted Book = Ending Book - Bank Charges + Interest
    const adjBook = endingBook - bankCharges.reduce((s, t) => s + t.amount, 0) + unknownDiffs.reduce((s, t) => s + t.amount, 0);
    
    // Adjusted Bank = Ending Bank + DepTransit - OutChecks
    // So Ending Bank = Adj Bank - DepTransit + OutChecks
    const endingBank = adjBook - depositsInTransit.reduce((s,t) => s + t.amount, 0) + outstandingChecks.reduce((s,t) => s + t.amount, 0);

    setReconciledData({
      adjustedBookBalance: adjBook,
      adjustedBankBalance: adjBook, // Should be same
      outstandingChecks,
      depositsInTransit,
      bankCharges,
      unknownDiffs
    });

    // Add findings automatically
    if (bankCharges.length > 0) {
      onAddFinding({
        id: 'F-AUTO-01',
        title: 'Biaya Bank Belum Dicatat',
        description: `Terdapat biaya administrasi bank sebesar ${bankCharges.reduce((s,t)=>s+t.amount,0)} yang belum dijurnal.`,
        severity: 'Low',
        amount: bankCharges.reduce((s,t)=>s+t.amount,0),
        recommendation: 'Lakukan jurnal penyesuaian untuk biaya bank.'
      });
    }
  };

  // --- Logic: Fraud Detection ---
  const runFraudCheck = async () => {
    setLoadingFraud(true);
    const jsonStr = await detectFraudAnomalies(ledger);
    const anomalies = JSON.parse(jsonStr);
    setFraudAnalysis(anomalies);
    
    if (anomalies.length > 0) {
       onAddFinding({
        id: 'F-AI-02',
        title: 'Potensi Anomali/Fraud Terdeteksi',
        description: `AI mendeteksi ${anomalies.length} transaksi mencurigakan. Contoh: ${anomalies[0].issue}`,
        severity: 'High',
        amount: 0,
        recommendation: 'Investigasi lebih lanjut bukti pendukung transaksi tersebut.'
      });
    }
    setLoadingFraud(false);
  };

  // --- Logic: Cash Count ---
  const totalPhysical = Object.entries(cashCount).reduce((sum, [denom, count]) => sum + (Number(denom) * (count as number)), 0);
  const variance = pettyCashFundLimit - totalPhysical; // Assuming fund limit is what SHOULD be there if no expenses. 
  // Simplified: Usually petty cash = Cash + Bon. Here assuming full cash audit.

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Tahap II: Pengujian Substantif Otomatis</h2>
           <p className="text-gray-500">Rekonsiliasi Bank, Cash Opname, dan Deteksi Fraud.</p>
        </div>
        <div className="flex space-x-2">
          {['Recon', 'Opname', 'Fraud'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {tab === 'Recon' ? 'Rekonsiliasi Bank' : tab === 'Opname' ? 'Cash Opname' : 'Deteksi Fraud'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: RECONCILIATION */}
      {activeTab === 'Recon' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-md">
            <div>
              <p className="font-semibold text-blue-900">Engine Rekonsiliasi Bank</p>
              <p className="text-sm text-blue-700">Mencocokkan {ledger.length} transaksi buku dengan {bankData.length} transaksi bank.</p>
            </div>
            <button 
              onClick={runAutoReconciliation}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm font-bold"
            >
              Jalankan Auto-Match
            </button>
          </div>

          {reconciledData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Calculation */}
              <div className="border rounded-md p-4 bg-gray-50">
                <h4 className="font-bold text-lg mb-4 text-center border-b pb-2">Rekonsiliasi Bank 4 Kolom (Summary)</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Saldo Buku (Book Balance)</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reconciledData.adjustedBookBalance - reconciledData.unknownDiffs.reduce((s,t)=>s+t.amount,0) + reconciledData.bankCharges.reduce((s,t)=>s+t.amount,0))}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>(+) Jasa Giro/Pendapatan Bunga</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reconciledData.unknownDiffs.reduce((s,t)=>s+t.amount,0))}</span>
                  </div>
                  <div className="flex justify-between text-red-700">
                    <span>(-) Biaya Administrasi Bank</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reconciledData.bankCharges.reduce((s,t)=>s+t.amount,0))}</span>
                  </div>
                  <div className="flex justify-between font-bold text-indigo-900 border-t pt-2 mt-2">
                    <span>Saldo Buku Disesuaikan</span>
                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reconciledData.adjustedBookBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Outstanding Items */}
              <div className="space-y-4">
                 <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h5 className="font-bold text-yellow-800 text-sm">Deposit in Transit (Setoran dlm Perjalanan)</h5>
                    <ul className="text-xs mt-1 text-yellow-900">
                      {reconciledData.depositsInTransit.length === 0 ? <li>- Tidak ada -</li> : 
                        reconciledData.depositsInTransit.map(t => (
                          <li key={t.id} className="flex justify-between">
                            <span>{t.date} - {t.description}</span>
                            <span>{new Intl.NumberFormat('id-ID').format(t.amount)}</span>
                          </li>
                        ))
                      }
                    </ul>
                 </div>
                 <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h5 className="font-bold text-red-800 text-sm">Outstanding Checks (Cek Beredar)</h5>
                    <ul className="text-xs mt-1 text-red-900">
                      {reconciledData.outstandingChecks.length === 0 ? <li>- Tidak ada -</li> : 
                        reconciledData.outstandingChecks.map(t => (
                          <li key={t.id} className="flex justify-between">
                            <span>{t.date} - Ref: {t.refNumber}</span>
                            <span>{new Intl.NumberFormat('id-ID').format(t.amount)}</span>
                          </li>
                        ))
                      }
                    </ul>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CASH OPNAME */}
      {activeTab === 'Opname' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-gray-700 mb-4">Input Fisik Uang Tunai</h4>
            <div className="space-y-3">
              {[100000, 50000, 20000, 10000].map(denom => (
                <div key={denom} className="flex items-center justify-between">
                  <label className="text-sm font-medium w-1/3">Rp {new Intl.NumberFormat('id-ID').format(denom)}</label>
                  <input
                    type="number"
                    min="0"
                    value={cashCount[denom as keyof typeof cashCount]}
                    onChange={(e) => setCashCount({...cashCount, [denom]: parseInt(e.target.value) || 0})}
                    className="w-1/3 border rounded p-1 text-right"
                  />
                  <span className="w-1/3 text-right text-sm text-gray-600">
                    = {new Intl.NumberFormat('id-ID').format(denom * cashCount[denom as keyof typeof cashCount])}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Fisik</span>
                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPhysical)}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded border">
            <h4 className="font-bold text-gray-700 mb-4">Berita Acara (Summary)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Dana Tetap Kas Kecil (Imprest)</span>
                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pettyCashFundLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Fisik Dihitung</span>
                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPhysical)}</span>
              </div>
              <div className="border-t my-2"></div>
              <div className={`flex justify-between font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                <span>{variance > 0 ? 'Kekurangan (Shortage)' : 'Kelebihan (Overage)'}</span>
                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Math.abs(variance))}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">*Note: Kekurangan seharusnya didukung oleh Bon/Voucher Pengeluaran yang belum di-reimburse.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FRAUD */}
      {activeTab === 'Fraud' && (
        <div>
           <div className="mb-4">
             <button 
                onClick={runFraudCheck}
                disabled={loadingFraud}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
             >
               {loadingFraud ? 'AI sedang menganalisis...' : 'Jalankan Deteksi Anomali (AI)'}
             </button>
           </div>
           
           {fraudAnalysis.length > 0 ? (
             <div className="space-y-3">
               {fraudAnalysis.map((item, idx) => (
                 <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                    <div className="flex justify-between">
                       <h5 className="font-bold text-red-900">Transaksi ID: {item.id}</h5>
                    </div>
                    <p className="text-red-800 text-sm mt-1">{item.issue}</p>
                 </div>
               ))}
             </div>
           ) : (
             <p className="text-gray-500 italic text-center py-8">Belum ada analisis atau tidak ditemukan anomali.</p>
           )}
        </div>
      )}

    </div>
  );
};

export default Phase2_Substantive;