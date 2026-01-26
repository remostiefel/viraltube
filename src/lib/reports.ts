export interface SavedReport {
    id: string;
    type: "CHANNEL_AUDIT" | "VIDEO_DEEP_DIVE" | "RETENTION_SURGEON";
    title: string;
    createdAt: string; // ISO String
    summary: string;
    data: any; // The full JSON result (AuditResult, AnalysisResult, etc.)
    sentiment: "positive" | "negative" | "neutral";
    sourceId?: string; // Video ID or Channel ID
}

const STORAGE_KEY = "nc_reports_v1";

export function saveReport(report: Omit<SavedReport, "id" | "createdAt">): SavedReport {
    if (typeof window === 'undefined') return {} as SavedReport;

    const newReport: SavedReport = {
        ...report,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
    };

    const existing = getReports();
    const updated = [newReport, ...existing];

    // Cap at 50 reports to save space
    if (updated.length > 50) updated.pop();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newReport;
}

export function getReports(): SavedReport[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load reports", e);
        return [];
    }
}

export function deleteReport(id: string): void {
    if (typeof window === 'undefined') return;
    const existing = getReports();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

import { jsPDF } from "jspdf";

export function exportReport(report: SavedReport): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let y = 20;

    // --- HEADER ---
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("NEURO-CODE OPTIMIZER // CORTEX REPORT", margin, y);
    doc.text(new Date().toLocaleDateString(), pageWidth - margin, y, { align: "right" });
    y += 15;

    // --- TITLE & SENTIMENT ---
    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");

    // Wrap title if too long
    const titleLines = doc.splitTextToSize(report.title, contentWidth);
    doc.text(titleLines, margin, y);
    y += (titleLines.length * 10) + 5;

    // Sentiment Badge style text
    doc.setFontSize(12);
    const sentText = `SENTIMENT: ${report.sentiment.toUpperCase()}`;
    if (report.sentiment === "positive") doc.setTextColor(0, 150, 0); // Green
    else if (report.sentiment === "negative") doc.setTextColor(200, 50, 50); // Red
    else doc.setTextColor(200, 150, 0); // Orange/Yellow

    doc.text(sentText, margin, y);
    y += 15;

    // --- EXECUTIVE SUMMARY ---
    doc.setTextColor(0); // Reset to black
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(report.summary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += (summaryLines.length * 7) + 15;

    // --- REPORT SPECIFIC DATA ---

    if (report.type === "RETENTION_SURGEON") {
        const data = report.data; // RetentionAnalysis

        // Draw Box for Metrics
        doc.setDrawColor(200);
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentWidth, 40, "F");

        let metricY = y + 15;

        // Hook Score
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("HOOK SCORE", margin + 10, metricY);
        doc.setFontSize(24);
        doc.setTextColor(0);
        doc.text(`${data.hookScore}/100`, margin + 10, metricY + 12);

        // Risk
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("DROP-OFF RISK", margin + 80, metricY);
        doc.setFontSize(16);
        if (data.dropOffRisk === "High") doc.setTextColor(200, 0, 0);
        else if (data.dropOffRisk === "Low") doc.setTextColor(0, 150, 0);
        else doc.setTextColor(200, 150, 0);
        doc.text(data.dropOffRisk.toUpperCase(), margin + 80, metricY + 10);

        y += 50;

        // Prescription
        doc.setTextColor(0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Prescription (Improvement):", margin, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        const imprLines = doc.splitTextToSize(data.improvement, contentWidth);
        doc.text(imprLines, margin, y);
        y += (imprLines.length * 7) + 10;
    }
    else if (report.type === "CHANNEL_AUDIT") {
        const data = report.data; // ChannelAuditResult hiding in 'any'

        // Helper to print list
        const printList = (title: string, items: any[], color: [number, number, number]) => {
            if (!items || items.length === 0) return;

            // Check page break
            if (y > 250) {
                doc.addPage();
                y = 20;
            }

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...color);
            doc.text(title, margin, y);
            y += 8;

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);

            items.forEach((item) => {
                const itemTitle = `• ${item.title}`;
                const titleSplit = doc.splitTextToSize(itemTitle, contentWidth);
                doc.text(titleSplit, margin, y);
                y += (titleSplit.length * 6);

                const itemDesc = item.description;
                const descSplit = doc.splitTextToSize(itemDesc, contentWidth - 5);
                doc.setTextColor(100);
                doc.text(descSplit, margin + 5, y);
                doc.setTextColor(0);
                y += (descSplit.length * 6) + 4;

                // Check page break loop
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
            y += 10;
        };

        if (data.wins) printList("WINS (Keep Doing)", data.wins, [0, 150, 0]);
        if (data.opportunities) printList("OPPORTUNITIES (Growth Potential)", data.opportunities, [0, 100, 200]);
        if (data.losses) printList("LOSSES (Fix Immediately)", data.losses, [200, 50, 50]);
    }

    // --- FOOTER ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated by Neuro-Code Optimizer | Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: "center" });
    }

    // Save
    doc.save(`CORTEX_REPORT_${report.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.pdf`);
}
