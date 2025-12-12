export enum TransactionType {
  DEBIT = 'Debit', // Masuk (Buku), Keluar (Bank - perspektif bank)
  CREDIT = 'Credit' // Keluar (Buku), Masuk (Bank - perspektif bank)
}

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType; // Perspektif Perusahaan: Debit = Masuk, Credit = Keluar
  refNumber: string; // No Cek / Voucher
  isReconciled: boolean;
}

export interface BankStatementItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CR' | 'DB'; // Perspektif Bank: CR = Masuk (Deposit), DB = Keluar (Withdrawal)
  refNumber: string;
  isReconciled: boolean;
}

export interface ICQQuestion {
  id: string;
  question: string;
  answer: 'Yes' | 'No' | 'N/A' | null;
  riskWeight: 'High' | 'Medium' | 'Low';
}

export interface MaterialityConfig {
  totalAssets: number;
  totalRevenue: number;
  netIncome: number;
  overallMateriality: number;
  performanceMateriality: number;
}

export interface ReconciliationResult {
  adjustedBankBalance: number;
  adjustedBookBalance: number;
  outstandingChecks: LedgerTransaction[];
  depositsInTransit: LedgerTransaction[];
  bankCharges: BankStatementItem[];
  unknownDiffs: BankStatementItem[];
}

export interface CashCountItem {
  denomination: number;
  count: number;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  amount: number;
  recommendation: string;
}
