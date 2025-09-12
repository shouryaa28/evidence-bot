const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');

class DocumentService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads');
        this.ensureUploadsDir();
    }

    /**
     * Ensure uploads directory exists
     */
    ensureUploadsDir() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }

    /**
     * Parse CSV file
     */
    async parseCSV(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            const headers = [];
            let isFirstRow = true;

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('headers', (headerList) => {
                    headers.push(...headerList);
                })
                .on('data', (data) => {
                    if (isFirstRow) {
                        isFirstRow = false;
                    }
                    results.push(data);
                })
                .on('end', () => {
                    resolve({
                        headers: headers.length > 0 ? headers : Object.keys(results[0] || {}),
                        data: results,
                        rowCount: results.length,
                        type: 'csv'
                    });
                })
                .on('error', (error) => {
                    reject(new Error(`CSV parsing error: ${error.message}`));
                });
        });
    }

    /**
     * Parse Excel file
     */
    async parseExcel(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const data = XLSX.utils.sheet_to_json(worksheet);
            const headers = data.length > 0 ? Object.keys(data[0]) : [];

            return {
                headers: headers,
                data: data,
                rowCount: data.length,
                sheetName: sheetName,
                type: 'excel'
            };
        } catch (error) {
            throw new Error(`Excel parsing error: ${error.message}`);
        }
    }

    /**
     * Analyze document based on file type
     */
    async analyzeDocument(filename) {
        const filePath = path.join(this.uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filename}`);
        }

        const ext = path.extname(filename).toLowerCase();
        let result;

        try {
            switch (ext) {
                case '.csv':
                    result = await this.parseCSV(filePath);
                    break;
                case '.xlsx':
                case '.xls':
                    result = await this.parseExcel(filePath);
                    break;
                default:
                    throw new Error(`Unsupported file type: ${ext}`);
            }

            // Add analysis metadata
            result.filename = filename;
            result.fileSize = fs.statSync(filePath).size;
            result.lastModified = fs.statSync(filePath).mtime;
            result.analysis = this.generateAnalysis(result);

            return result;
        } catch (error) {
            throw new Error(`Document analysis failed: ${error.message}`);
        }
    }

    /**
     * Generate basic analysis of the document
     */
    generateAnalysis(parsedData) {
        const analysis = {
            summary: {},
            insights: [],
            statistics: {}
        };

        if (!parsedData.data || parsedData.data.length === 0) {
            analysis.summary.message = 'No data found in document';
            return analysis;
        }

        // Basic statistics
        analysis.statistics.totalRows = parsedData.rowCount;
        analysis.statistics.totalColumns = parsedData.headers.length;
        analysis.summary.headers = parsedData.headers;

        // Analyze each column
        const columnAnalysis = {};
        parsedData.headers.forEach(header => {
            const values = parsedData.data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');

            columnAnalysis[header] = {
                nonEmptyCount: values.length,
                emptyCount: parsedData.rowCount - values.length,
                dataType: this.detectDataType(values),
                uniqueValues: new Set(values).size
            };

            // Numeric analysis
            if (columnAnalysis[header].dataType === 'number') {
                const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
                if (numbers.length > 0) {
                    columnAnalysis[header].min = Math.min(...numbers);
                    columnAnalysis[header].max = Math.max(...numbers);
                    columnAnalysis[header].average = numbers.reduce((a, b) => a + b, 0) / numbers.length;
                }
            }
        });

        analysis.columnAnalysis = columnAnalysis;

        // Generate insights
        if (parsedData.rowCount > 0) {
            analysis.insights.push(`Document contains ${parsedData.rowCount} rows and ${parsedData.headers.length} columns`);

            // Look for common patterns
            const possibleAssetFields = ['name', 'asset', 'item', 'equipment', 'laptop', 'computer'];
            const foundAssetFields = parsedData.headers.filter(h => 
                possibleAssetFields.some(field => h.toLowerCase().includes(field))
            );

            if (foundAssetFields.length > 0) {
                analysis.insights.push(`Detected asset-related fields: ${foundAssetFields.join(', ')}`);
            }

            const possibleUserFields = ['user', 'name', 'employee', 'person', 'assignee'];
            const foundUserFields = parsedData.headers.filter(h => 
                possibleUserFields.some(field => h.toLowerCase().includes(field))
            );

            if (foundUserFields.length > 0) {
                analysis.insights.push(`Detected user-related fields: ${foundUserFields.join(', ')}`);
            }
        }

        return analysis;
    }

    /**
     * Detect data type of values
     */
    detectDataType(values) {
        if (values.length === 0) return 'unknown';

        const sampleSize = Math.min(values.length, 10);
        const sample = values.slice(0, sampleSize);

        const numbers = sample.filter(v => !isNaN(parseFloat(v)) && isFinite(v));
        const dates = sample.filter(v => !isNaN(Date.parse(v)));

        if (numbers.length === sample.length) return 'number';
        if (dates.length === sample.length) return 'date';
        return 'text';
    }

    /**
     * Export data to CSV
     */
    async exportToCSV(data, filename) {
        try {
            const csvContent = this.convertToCSV(data);
            const exportPath = path.join(this.uploadsDir, `export_${filename}.csv`);

            fs.writeFileSync(exportPath, csvContent);

            return {
                filename: `export_${filename}.csv`,
                path: exportPath,
                size: fs.statSync(exportPath).size
            };
        } catch (error) {
            throw new Error(`CSV export failed: ${error.message}`);
        }
    }

    /**
     * Export data to Excel
     */
    async exportToExcel(data, filename) {
        try {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');

            const exportPath = path.join(this.uploadsDir, `export_${filename}.xlsx`);
            XLSX.writeFile(wb, exportPath);

            return {
                filename: `export_${filename}.xlsx`,
                path: exportPath,
                size: fs.statSync(exportPath).size
            };
        } catch (error) {
            throw new Error(`Excel export failed: ${error.message}`);
        }
    }

    /**
     * Convert array of objects to CSV string
     */
    convertToCSV(data) {
        if (!data || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    /**
     * Get list of available files
     */
    getAvailableFiles() {
        try {
            const files = fs.readdirSync(this.uploadsDir);
            return files
                .filter(file => !file.startsWith('.'))
                .map(file => {
                    const filePath = path.join(this.uploadsDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        size: stats.size,
                        lastModified: stats.mtime,
                        type: path.extname(file).toLowerCase().substring(1)
                    };
                });
        } catch (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    /**
     * Delete file
     */
    deleteFile(filename) {
        const filePath = path.join(this.uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filename}`);
        }

        try {
            fs.unlinkSync(filePath);
            return { success: true, message: `File ${filename} deleted successfully` };
        } catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
}

module.exports = new DocumentService();
