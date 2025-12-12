import { LedgerTransaction, BankStatementItem, TransactionType, ICQQuestion } from './types';

export const APP_NAME = "AuditKas Pro";
export const COMPANY_NAME = "PT Manufaktur Maju Tbk";

// Mock Data: Buku Besar (General Ledger) - Perspektif Perusahaan
// Debit = Penerimaan, Credit = Pengeluaran
export const MOCK_LEDGER: LedgerTransaction[] = [
  { id: 'L-001', date: '2023-12-01', description: 'Saldo Awal', amount: 500000000, type: TransactionType.DEBIT, refNumber: 'SA', isReconciled: false },
  { id: 'L-002', date: '2023-12-05', description: 'Penerimaan Piutang Customer A', amount: 125000000, type: TransactionType.DEBIT, refNumber: 'CR-001', isReconciled: false },
  { id: 'L-003', date: '2023-12-10', description: 'Pembayaran Vendor Bahan Baku', amount: 75000000, type: TransactionType.CREDIT, refNumber: 'CK-101', isReconciled: false },
  { id: 'L-004', date: '2023-12-15', description: 'Pembayaran Gaji Operasional', amount: 45000000, type: TransactionType.CREDIT, refNumber: 'CK-102', isReconciled: false },
  { id: 'L-005', date: '2023-12-20', description: 'Penerimaan Penjualan Tunai', amount: 30000000, type: TransactionType.DEBIT, refNumber: 'CR-002', isReconciled: false },
  { id: 'L-006', date: '2023-12-28', description: 'Pembayaran Listrik & Air', amount: 15000000, type: TransactionType.CREDIT, refNumber: 'CK-103', isReconciled: false },
  { id: 'L-007', date: '2023-12-30', description: 'Penerimaan Pelunasan Piutang B', amount: 55000000, type: TransactionType.DEBIT, refNumber: 'CR-003', isReconciled: false }, // Deposit in Transit
  { id: 'L-008', date: '2023-12-31', description: 'Pembayaran Bonus Tahunan', amount: 25000000, type: TransactionType.CREDIT, refNumber: 'CK-104', isReconciled: false }, // Outstanding Check
  { id: 'L-009', date: '2023-12-25', description: 'Koreksi Pencatatan (Suspicious)', amount: 999999, type: TransactionType.CREDIT, refNumber: 'JV-99', isReconciled: false }, // Fraud flag
];

// Mock Data: Rekening Koran (Bank Statement) - Perspektif Bank
// CR = Kredit (Uang Masuk ke nasabah), DB = Debit (Uang Keluar dari nasabah)
export const MOCK_BANK_STATEMENT: BankStatementItem[] = [
  { id: 'B-001', date: '2023-12-01', description: 'SALDO AWAL', amount: 500000000, type: 'CR', refNumber: '', isReconciled: false },
  { id: 'B-002', date: '2023-12-06', description: 'TRF DARI CUSTOMER A', amount: 125000000, type: 'CR', refNumber: 'REF-123', isReconciled: false },
  { id: 'B-003', date: '2023-12-12', description: 'CLRG CHQ CK-101', amount: 75000000, type: 'DB', refNumber: 'CK-101', isReconciled: false },
  { id: 'B-004', date: '2023-12-16', description: 'CLRG CHQ CK-102', amount: 45000000, type: 'DB', refNumber: 'CK-102', isReconciled: false },
  { id: 'B-005', date: '2023-12-21', description: 'SETORAN TUNAI', amount: 30000000, type: 'CR', refNumber: 'REF-456', isReconciled: false },
  { id: 'B-006', date: '2023-12-29', description: 'CLRG CHQ CK-103', amount: 15000000, type: 'DB', refNumber: 'CK-103', isReconciled: false },
  { id: 'B-007', date: '2023-12-31', description: 'BIAYA ADM BANK', amount: 250000, type: 'DB', refNumber: 'ADM', isReconciled: false }, // Unrecorded in book
  { id: 'B-008', date: '2023-12-31', description: 'JASA GIRO', amount: 1250000, type: 'CR', refNumber: 'INT', isReconciled: false }, // Unrecorded in book
];

export const INITIAL_ICQ: ICQQuestion[] = [
    { id: 'Q1', question: 'Apakah fungsi penerimaan kas dipisahkan dari fungsi pencatatan akuntansi?', answer: null, riskWeight: 'High' },
    { id: 'Q2', question: 'Apakah semua penerimaan kas disetorkan ke bank secara harian (intact)?', answer: null, riskWeight: 'High' },
    { id: 'Q3', question: 'Apakah rekonsiliasi bank dibuat setiap bulan oleh pegawai yang independen?', answer: null, riskWeight: 'Medium' },
    { id: 'Q4', question: 'Apakah pengeluaran cek di atas nominal tertentu memerlukan dua tanda tangan?', answer: null, riskWeight: 'Medium' },
    { id: 'Q5', question: 'Apakah kas kecil (petty cash) menggunakan sistem imprest fund?', answer: null, riskWeight: 'Low' },
];