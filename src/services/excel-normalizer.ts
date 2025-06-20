/**
 * Excel Normalizer Service
 * Normalizes Excel data similar to the Python excel_service.py implementation
 */

import * as ExcelJS from 'exceljs';

export interface NormalizedData {
  [key: string]: any;
}

export interface NormalizationResult {
  success: boolean;
  data: NormalizedData[];
  originalRowCount: number;
  normalizedRowCount: number;
  columnMapping: Record<string, string>;
  warnings: string[];
  errors: string[];
}

export interface HierarchicalConfig {
  idColumns?: string[];
  fillEmptyIdColumns?: boolean;
  preserveHierarchy?: boolean;
}

export class ExcelNormalizer {
  private static readonly DEFAULT_ID_KEYWORDS = [
    'id', 'name', 'country', 'region', 'code', 'identifier', 
    'key', 'number', 'no', '番号', '名前', 'コード', '識別子'
  ];

  private static readonly COMMON_STOPWORDS = new Set([
    'undefined', 'null', 'nan', 'n/a', '#n/a', '#value!', '#ref!', 
    '#div/0!', '#num!', '#name?', '#null!', '', ' '
  ]);

  /**
   * Normalize Excel data with hierarchical structure handling
   */
  static normalizeData(
    data: any[][],
    headers: string[],
    config: HierarchicalConfig = {}
  ): NormalizationResult {
    const result: NormalizationResult = {
      success: false,
      data: [],
      originalRowCount: data.length,
      normalizedRowCount: 0,
      columnMapping: {},
      warnings: [],
      errors: []
    };

    try {
      // Clean headers
      const cleanedHeaders = this.cleanColumnNames(headers);
      result.columnMapping = this.createColumnMapping(headers, cleanedHeaders);

      // Identify ID columns
      const idColumns = config.idColumns || this.identifyIdColumns(cleanedHeaders);
      
      if (idColumns.length > 0) {
        result.warnings.push(`Identified ID columns: ${idColumns.join(', ')}`);
      }

      // Normalize hierarchical data
      const normalizedData = this.normalizeHierarchicalData(
        data,
        cleanedHeaders,
        idColumns,
        config
      );

      result.data = normalizedData;
      result.normalizedRowCount = normalizedData.length;
      result.success = true;

      // Add warnings for data quality issues
      this.addDataQualityWarnings(result, normalizedData);

    } catch (error) {
      result.errors.push(`Normalization failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Clean column names (similar to _clean_column_names in Python)
   */
  private static cleanColumnNames(headers: string[]): string[] {
    return headers.map((header, index) => {
      if (!header || typeof header !== 'string') {
        return `Column_${index + 1}`;
      }

      let cleaned = String(header)
        .trim()
        .replace(/[\n\r]/g, ' ')
        .replace(/\s+/g, ' ');

      // Handle common problematic values
      if (this.COMMON_STOPWORDS.has(cleaned.toLowerCase())) {
        cleaned = `Column_${index + 1}`;
      }

      return cleaned || `Column_${index + 1}`;
    });
  }

  /**
   * Create mapping between original and cleaned column names
   */
  private static createColumnMapping(
    original: string[],
    cleaned: string[]
  ): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    for (let i = 0; i < original.length; i++) {
      if (original[i] !== cleaned[i]) {
        mapping[original[i]] = cleaned[i];
      }
    }

    return mapping;
  }

  /**
   * Identify ID columns based on keywords
   */
  private static identifyIdColumns(headers: string[]): string[] {
    return headers.filter(header => {
      const lowerHeader = header.toLowerCase();
      return this.DEFAULT_ID_KEYWORDS.some(keyword => 
        lowerHeader.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * Normalize hierarchical data (similar to _normalize_hierarchical_data in Python)
   */
  private static normalizeHierarchicalData(
    data: any[][],
    headers: string[],
    idColumns: string[],
    config: HierarchicalConfig
  ): NormalizedData[] {
    const normalizedData: NormalizedData[] = [];
    const lastValidValues: Record<string, any> = {};

    for (const row of data) {
      const rowDict: NormalizedData = {};
      let hasValidData = false;

      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        const columnName = headers[colIndex];
        let value = row[colIndex];

        // Handle different value types
        value = this.normalizeValue(value);

        // Handle hierarchical data for ID columns
        if (idColumns.includes(columnName)) {
          if (this.isEmpty(value) && config.fillEmptyIdColumns !== false) {
            // Use last valid value for empty ID columns
            value = lastValidValues[columnName] || '';
          } else if (!this.isEmpty(value)) {
            // Store valid ID values
            lastValidValues[columnName] = value;
          }
        }

        // Only include non-empty values
        if (!this.isEmpty(value)) {
          rowDict[columnName] = value;
          hasValidData = true;
        }
      }

      // Only add rows with valid data
      if (hasValidData) {
        normalizedData.push(rowDict);
      }
    }

    return normalizedData;
  }

  /**
   * Normalize individual cell values
   */
  private static normalizeValue(value: any): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return null;
    }

    // Handle objects (ExcelJS specific)
    if (value && typeof value === 'object') {
      if ('text' in value && value.text) {
        return String(value.text).trim();
      } else if ('result' in value && value.result !== undefined) {
        return value.result;
      } else if ('hyperlink' in value && value.hyperlink) {
        return String(value.hyperlink).trim();
      } else if (value instanceof Date) {
        return value.toISOString();
      } else if (value.toString) {
        return String(value.toString()).trim();
      }
    }

    // Handle strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (this.COMMON_STOPWORDS.has(trimmed.toLowerCase())) {
        return null;
      }
      return trimmed;
    }

    // Handle numbers
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return null;
      }
      return value;
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value;
    }

    // Handle dates
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return null;
      }
      return value.toISOString();
    }

    // Default: convert to string
    const stringValue = String(value).trim();
    return this.COMMON_STOPWORDS.has(stringValue.toLowerCase()) ? null : stringValue;
  }

  /**
   * Check if value is empty
   */
  private static isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return true;
    return false;
  }

  /**
   * Add data quality warnings
   */
  private static addDataQualityWarnings(
    result: NormalizationResult,
    data: NormalizedData[]
  ): void {
    if (data.length === 0) {
      result.warnings.push('No valid data rows found after normalization');
      return;
    }

    // Check for data consistency
    const columnCounts = new Map<string, number>();
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        columnCounts.set(key, (columnCounts.get(key) || 0) + 1);
      });
    });

    // Find sparse columns
    const totalRows = data.length;
    const sparseColumns = Array.from(columnCounts.entries())
      .filter(([, count]) => count < totalRows * 0.5)
      .map(([column]) => column);

    if (sparseColumns.length > 0) {
      result.warnings.push(`Sparse columns detected (less than 50% filled): ${sparseColumns.join(', ')}`);
    }

    // Check for duplicate rows
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    if (uniqueRows.size < data.length) {
      result.warnings.push(`${data.length - uniqueRows.size} duplicate rows detected`);
    }

    // Normalization efficiency
    const efficiency = (result.normalizedRowCount / result.originalRowCount) * 100;
    if (efficiency < 80) {
      result.warnings.push(`Low normalization efficiency: ${efficiency.toFixed(1)}% of original data retained`);
    }
  }

  /**
   * Process entire Excel workbook
   */
  static async normalizeWorkbook(
    workbook: ExcelJS.Workbook,
    config: HierarchicalConfig = {}
  ): Promise<Record<string, NormalizationResult>> {
    const results: Record<string, NormalizationResult> = {};

    for (const worksheet of workbook.worksheets) {
      try {
        // Extract data from worksheet
        const data: any[][] = [];
        const headers: string[] = [];

        // Get headers from first row
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber - 1] = this.normalizeValue(cell.value) || `Column_${colNumber}`;
        });

        // Get data rows (skip header)
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row

          const rowData: any[] = [];
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowData[colNumber - 1] = this.normalizeValue(cell.value);
          });
          
          if (rowData.some(value => !this.isEmpty(value))) {
            data.push(rowData);
          }
        });

        // Normalize the sheet data
        results[worksheet.name] = this.normalizeData(data, headers, config);

      } catch (error) {
        results[worksheet.name] = {
          success: false,
          data: [],
          originalRowCount: 0,
          normalizedRowCount: 0,
          columnMapping: {},
          warnings: [],
          errors: [`Failed to process sheet: ${error instanceof Error ? error.message : String(error)}`]
        };
      }
    }

    return results;
  }

  /**
   * Get normalization statistics
   */
  static getStatistics(results: Record<string, NormalizationResult>): {
    totalSheets: number;
    successfulSheets: number;
    totalOriginalRows: number;
    totalNormalizedRows: number;
    overallEfficiency: number;
    totalWarnings: number;
    totalErrors: number;
  } {
    const stats = {
      totalSheets: Object.keys(results).length,
      successfulSheets: 0,
      totalOriginalRows: 0,
      totalNormalizedRows: 0,
      overallEfficiency: 0,
      totalWarnings: 0,
      totalErrors: 0
    };

    Object.values(results).forEach(result => {
      if (result.success) stats.successfulSheets++;
      stats.totalOriginalRows += result.originalRowCount;
      stats.totalNormalizedRows += result.normalizedRowCount;
      stats.totalWarnings += result.warnings.length;
      stats.totalErrors += result.errors.length;
    });

    stats.overallEfficiency = stats.totalOriginalRows > 0 
      ? (stats.totalNormalizedRows / stats.totalOriginalRows) * 100 
      : 0;

    return stats;
  }
}