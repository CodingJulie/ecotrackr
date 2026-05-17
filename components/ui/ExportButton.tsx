'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Download, File, FileJson, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useWorkers } from '@/components/workers/WorkersManager';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
    entries: any[];
    userProfile: any;
}

export default function ExportButton({ entries, userProfile }: ExportButtonProps) {
    const { t, i18n } = useTranslation('common');
    const workers = useWorkers();
    const [loading, setLoading] = useState(false);

    if (entries.length === 0) return null;

    const handleExport = async (format: 'csv' | 'json' | 'html' | 'pdf') => {
        setLoading(true);
        try {
            if (format === 'pdf') {
                await generatePDF();
                return;
            }

            const result = await workers.exportData(entries, format, userProfile, {
                locale: i18n.language,
                labels: {
                    noData: t('export_no_data'),
                    user: t('user'),
                    date: t('pdf_date_header'),
                    category: t('pdf_category_header'),
                    activity: t('pdf_activity_header'),
                    value: t('value'),
                    co2e: t('pdf_co2_header'),
                    reportTitle: t('pdf_report_title'),
                    totalCo2: t('pdf_total_co2'),
                    avgCo2: t('pdf_avg_co2'),
                    totalEntries: t('pdf_total_entries'),
                    byCategory: t('pdf_by_category'),
                    emissions: t('pdf_emissions_header'),
                    details: t('pdf_details_header'),
                    moreEntries: t('pdf_more_entries'),
                    footer: t('pdf_footer'),
                    unsupportedFormat: t('export_unsupported_format'),
                },
            });
            const blob = new Blob([result.data], {
                type: format === 'csv' ? 'text/csv;charset=utf-8;' :
                    format === 'json' ? 'application/json' : 'text/html'
            });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `ecotrackr-data-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Export error:', error);
            alert(format === 'pdf' ? t('pdf_error') : t('export_error'));
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        const reportContainer = document.createElement('div');
        reportContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:white;padding:40px;font-family:Arial,sans-serif';
        document.body.appendChild(reportContainer);

        const totalCO2 = entries.reduce((sum, e) => sum + (e.co2e || 0), 0);
        const byCategory: Record<string, number> = {};
        for (const entry of entries) {
            byCategory[entry.category] = (byCategory[entry.category] || 0) + (entry.co2e || 0);
        }
        const avgCO2 = totalCO2 / entries.length;

        const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const formattedDate = dateFormatter.format(new Date());
        const fullDate = new Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date());

        const categoryRows = Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, val]) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 16px; color: #374151;">${cat}</td>
                    <td style="padding: 8px 16px; text-align: right; font-weight: 600; color: #059669;">${Math.round(val)}</td>
                </tr>
            `).join('');

        const entryRows = entries.slice(0, 30).map(entry => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 12px; color: #6b7280;">${entry.date}</td>
                <td style="padding: 6px 12px; color: #374151;">${entry.category}</td>
                <td style="padding: 6px 12px; color: #374151;">${entry.activity}</td>
                <td style="padding: 6px 12px; text-align: right; font-weight: 500; color: #059669;">${entry.co2e}</td>
            </tr>
        `).join('');

        const moreEntries = entries.length > 30
            ? `<tr><td colspan="4" style="padding: 8px 12px; text-align: center; color: #6b7280; font-style: italic;">${t('pdf_more_entries', { count: entries.length - 30 })}</td></tr>`
            : '';

        reportContainer.innerHTML = `
            <div style="padding: 20px; max-width: 100%;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 3px solid #10b981; padding-bottom: 20px;">
                    <div style="width: 48px; height: 48px; background: #10b981; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px;">🌿</div>
                    <div>
                        <h1 style="font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 0;">${t('pdf_report_title')}</h1>
                        <p style="color: #6b7280; margin: 0; font-size: 14px;">EcoTrackr · ${formattedDate}</p>
                    </div>
                </div>
                <div style="background: #f3f4f6; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 14px; color: #374151;">
                        <strong>${t('pdf_user_label')}</strong> ${userProfile?.name || '—'} &nbsp;|&nbsp;
                        <strong>${t('pdf_email_label')}</strong> ${userProfile?.email || '—'} &nbsp;|&nbsp;
                        <strong>${t('pdf_records_label')}</strong> ${entries.length}
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #a7f3d0;">
                        <p style="font-size: 28px; font-weight: bold; color: #059669; margin: 0;">${Math.round(totalCO2)}</p>
                        <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0;">${t('pdf_total_co2')}</p>
                    </div>
                    <div style="background: #eff6ff; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #bfdbfe;">
                        <p style="font-size: 28px; font-weight: bold; color: #2563eb; margin: 0;">${Math.round(avgCO2)}</p>
                        <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0;">${t('pdf_avg_co2')}</p>
                    </div>
                    <div style="background: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; border: 1px solid #fcd34d;">
                        <p style="font-size: 28px; font-weight: bold; color: #d97706; margin: 0;">${entries.length}</p>
                        <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0;">${t('pdf_total_entries')}</p>
                    </div>
                </div>
                <h2 style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 24px 0 12px;">${t('pdf_by_category')}</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                    <thead>
                        <tr style="background: #10b981; color: white;">
                            <th style="padding: 10px 16px; text-align: left; border-radius: 8px 0 0 8px;">${t('pdf_category_header')}</th>
                            <th style="padding: 10px 16px; text-align: right; border-radius: 0 8px 8px 0;">${t('pdf_emissions_header')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categoryRows}
                    </tbody>
                </table>
                <h2 style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 24px 0 12px;">${t('pdf_details_header')}</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="background: #374151; color: white;">
                            <th style="padding: 8px 12px; text-align: left; border-radius: 8px 0 0 8px;">${t('pdf_date_header')}</th>
                            <th style="padding: 8px 12px; text-align: left;">${t('pdf_category_header_detail')}</th>
                            <th style="padding: 8px 12px; text-align: left;">${t('pdf_activity_header')}</th>
                            <th style="padding: 8px 12px; text-align: right; border-radius: 0 8px 8px 0;">${t('pdf_co2_header')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entryRows}
                        ${moreEntries}
                    </tbody>
                </table>
                <div style="margin-top: 32px; padding-top: 16px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
                    ${t('pdf_footer', { date: fullDate })}
                </div>
            </div>
        `;

        try {
            const canvas = await html2canvas(reportContainer, {
                scale: 2,
                logging: false,
                backgroundColor: '#ffffff',
                width: 800,
                height: reportContainer.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height],
                compress: true
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`ecotrackr-report-${new Date().toISOString().split('T')[0]}.pdf`);
        } finally {
            document.body.removeChild(reportContainer);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    aria-label={t('export_aria_label')}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {t('export_button_label')}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <File className="h-4 w-4 text-red-500" /> {t('export_pdf')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="h-4 w-4 text-green-500" /> {t('export_csv')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                    <FileJson className="h-4 w-4 text-blue-500" /> {t('export_json')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                    <FileText className="h-4 w-4 text-purple-500" /> {t('export_html')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
