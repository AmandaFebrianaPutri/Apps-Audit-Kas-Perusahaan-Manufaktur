import { GoogleGenAI, Type } from "@google/genai";
import { LedgerTransaction, ICQQuestion } from "../types";

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeInternalControls = async (icqData: ICQQuestion[]): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
        Sebagai Auditor Senior, analisis jawaban Kuesioner Pengendalian Internal (ICQ) berikut untuk siklus Kas.
        
        Data ICQ:
        ${JSON.stringify(icqData, null, 2)}

        Berikan penilaian singkat (maksimal 1 paragraf) mengenai "Control Risk" (Risiko Pengendalian).
        Apakah High, Medium, atau Low? Jelaskan alasannya berdasarkan jawaban "No" yang berisiko tinggi.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Gagal menganalisis risiko.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error connecting to AI service.";
    }
};

export const detectFraudAnomalies = async (transactions: LedgerTransaction[]): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
        Analisis daftar transaksi buku besar kas berikut untuk mendeteksi potensi anomali atau fraud (kecurangan).
        Fokus pada:
        1. Nilai yang tidak biasa (round numbers berulang atau angka unik seperti 9999).
        2. Transaksi di hari libur atau akhir tahun yang mencurigakan (Window Dressing).
        3. Deskripsi yang tidak jelas.

        Data Transaksi:
        ${JSON.stringify(transactions.filter(t => !t.description.includes('Saldo Awal')), null, 2)}

        Outputkan dalam format JSON list temuan:
        [{ "id": "ID_Transaksi", "issue": "Penjelasan singkat kecurigaan" }]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            issue: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return response.text || "[]";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "[]";
    }
};

export const generateAuditOpinion = async (findings: any[]): Promise<string> => {
    try {
        const ai = getAiClient();
        const prompt = `
        Berdasarkan temuan audit berikut pada akun Kas & Setara Kas:
        ${JSON.stringify(findings, null, 2)}

        Buatlah draft paragraf kesimpulan audit untuk Kertas Kerja Audit. 
        Nyatakan apakah saldo kas disajikan secara wajar dalam semua hal yang material.
        Gunakan bahasa Indonesia formal standar audit.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Gagal membuat opini.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Gagal membuat opini karena error koneksi.";
    }
};
