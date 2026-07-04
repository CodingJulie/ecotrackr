// public/workers/export-worker.js
self.onmessage = function (e) {
    const {entries, format, userProfile} = e.data;

    if (!entries || entries.length === 0) {
        self.postMessage({error: 'Нет данных для экспорта'});
        return;
    }

    const totalCO2 = entries.reduce((sum, e) => sum + (e.co2e || 0), 0);
    const byCategory = {};
    for (const entry of entries) {
        byCategory[entry.category] = (byCategory[entry.category] || 0) + (entry.co2e || 0);
    }

    // Форматирование даты
    const formatDateForExcel = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch {
            return dateStr;
        }
    };

    // Форматирование чисел (запятая как десятичный разделитель)
    const formatNumberForExcel = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '';
        return Number(num).toFixed(2).replace('.', ',');
    };

    if (format === 'csv') {
        // Заголовки
        const headers = ['Дата', 'Категория', 'Активность', 'Значение', 'CO₂e (кг)'];

        // Строки данных
        const rows = entries.map(entry => [
            formatDateForExcel(entry.date),
            entry.category || '',
            entry.activity || '',
            formatNumberForExcel(entry.value),
            formatNumberForExcel(entry.co2e)
        ]);

        // Используем разделитель ; (точка с запятой)
        const delimiter = ';';
        let csvContent = headers.join(delimiter) + '\n';

        for (const row of rows) {
            const escapedRow = row.map(cell => {
                if (typeof cell === 'string') {
                    // Экранируем только если есть разделитель или кавычки
                    if (cell.includes(delimiter) || cell.includes('"') || cell.includes('\n')) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }
                return cell;
            });
            csvContent += escapedRow.join(delimiter) + '\n';
        }

        // Добавляем BOM для правильного отображения кириллицы
        self.postMessage({data: '\uFEFF' + csvContent, format: 'csv'});

    } else if (format === 'json') {
        const exportData = {
            exportedAt: new Date().toISOString(),
            user: userProfile,
            summary: {
                totalCO2: Math.round(totalCO2),
                entriesCount: entries.length,
                categories: Object.keys(byCategory),
                averageCO2: Math.round(totalCO2 / entries.length),
            },
            entries: entries.map(entry => ({
                ...entry,
                date: formatDateForExcel(entry.date),
                value: Number(entry.value ?? 0),
                co2e: Number(entry.co2e ?? 0)
            }))
        };
        self.postMessage({data: JSON.stringify(exportData, null, 2), format: 'json'});

    } else if (format === 'html') {
        // HTML отчёт (без изменений)
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Экологический отчёт</title>
                <style>
                    * { box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 1000px; margin: 0 auto; background: #f9fafb; }
                    .container { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    h1 { color: #10b981; font-size: 28px; margin-top: 0; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
                    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
                    .stat-card { background: #f3f4f6; border-radius: 12px; padding: 16px; text-align: center; }
                    .stat-card .value { font-size: 28px; font-weight: bold; color: #059669; }
                    .stat-card .label { font-size: 13px; color: #6b7280; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
                    th { background: #10b981; color: white; padding: 10px 16px; text-align: left; }
                    td { padding: 8px 16px; border-bottom: 1px solid #e5e7eb; }
                    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div>
                            <h1>🌿 Экологический отчёт</h1>
                            <p style="color: #6b7280; margin: 0;">EcoTrackr · ${new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-weight: 500;">${userProfile?.name || 'Пользователь'}</p>
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">${userProfile?.email || ''}</p>
                        </div>
                    </div>

                    <div class="stats">
                        <div class="stat-card">
                            <div class="value">${Math.round(totalCO2)}</div>
                            <div class="label">кг CO₂e (всего)</div>
                        </div>
                        <div class="stat-card">
                            <div class="value">${Math.round(totalCO2 / entries.length)}</div>
                            <div class="label">кг CO₂e (среднее)</div>
                        </div>
                        <div class="stat-card">
                            <div class="value">${entries.length}</div>
                            <div class="label">всего записей</div>
                        </div>
                    </div>

                    <h2>📊 По категориям</h2>
                    <table>
                        <thead><tr><th>Категория</th><th style="text-align: right;">Выбросы (кг CO₂e)</th></tr></thead>
                        <tbody>
                            ${Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, val]) => `
                                    <tr>
                                        <td>${cat}</td>
                                        <td style="text-align: right; font-weight: 600; color: #059669;">${Math.round(val)}</td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>

                    <h2>📋 Детали записей</h2>
                    <table>
                        <thead><tr><th>Дата</th><th>Категория</th><th>Активность</th><th style="text-align: right;">CO₂e (кг)</th></tr></thead>
                        <tbody>
                            ${entries.slice(0, 30).map(entry => `
                                <tr>
                                    <td>${formatDateForExcel(entry.date)}</td>
                                    <td>${entry.category}</td>
                                    <td>${entry.activity}</td>
                                    <td style="text-align: right; font-weight: 500;">${Number(entry.co2e ?? 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            ${entries.length > 30 ? `
                                <tr><td colspan="4" style="text-align: center; color: #6b7280; font-style: italic;">... и ещё ${entries.length - 30} записей</td></tr>
                            ` : ''}
                        </tbody>
                    </table>

                    <div class="footer">
                        Отчёт создан с помощью EcoTrackr · ${new Date().toLocaleString('ru-RU')}
                    </div>
                </div>
            </body>
            </html>
        `;
        self.postMessage({data: html, format: 'html'});
    }
};