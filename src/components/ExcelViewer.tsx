import React, { useState, useEffect, useMemo } from 'react';
import * as ExcelJS from 'exceljs';
import TinySegmenter from 'tiny-segmenter';
import { Upload, Download, FileSpreadsheet, X, ChevronDown, ChevronRight, Tags, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ExcelNormalizer, type NormalizationResult } from '@/services/excel-normalizer';

interface ExcelData {
  [key: string]: any;
}

interface ProcessedFile {
  id: string;
  name: string;
  sheets: {
    [sheetName: string]: ExcelData[];
  };
  normalizationResults?: {
    [sheetName: string]: NormalizationResult;
  };
}

const ExcelViewer: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [primaryKeyColumn, setPrimaryKeyColumn] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [normalizationEnabled, setNormalizationEnabled] = useState<boolean>(true);
  const [showNormalizationDetails, setShowNormalizationDetails] = useState<boolean>(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    try {
      const savedFiles = localStorage.getItem('excel2json-files');
      if (savedFiles) {
        const parsedFiles = JSON.parse(savedFiles);
        console.log('Loaded files from localStorage:', parsedFiles);
        setFiles(parsedFiles);
        
        // 最初のファイルを自動選択
        if (parsedFiles.length > 0 && !selectedFile) {
          const firstFile = parsedFiles[0];
          setSelectedFile(firstFile.id);
          const firstSheet = Object.keys(firstFile.sheets)[0];
          if (firstSheet) {
            setSelectedSheet(firstSheet);
          }
        }
      }
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
      // 破損したデータをクリア
      localStorage.removeItem('excel2json-files');
    }
  }, []); // Remove selectedFile from dependency array to prevent infinite loop

  // Save files to localStorage whenever they change
  useEffect(() => {
    try {
      if (files.length > 0) {
        console.log('Saving files to localStorage:', files);
        localStorage.setItem('excel2json-files', JSON.stringify(files));
      } else {
        // ファイルがない場合はlocalStorageをクリア
        localStorage.removeItem('excel2json-files');
      }
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
      // ストレージ容量が不足している可能性
      alert('データ保存に失敗しました。ファイルサイズが大きすぎる可能性があります。');
    }
  }, [files]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const sheets: { [key: string]: ExcelData[] } = {};
      let normalizationResults: { [key: string]: NormalizationResult } = {};

      // Normalize entire workbook if enabled
      if (normalizationEnabled) {
        try {
          normalizationResults = await ExcelNormalizer.normalizeWorkbook(workbook, {
            fillEmptyIdColumns: true,
            preserveHierarchy: true
          });
          console.log('Normalization results:', normalizationResults);
        } catch (error) {
          console.error('Normalization failed:', error);
          // Continue with standard processing
        }
      }
      
      workbook.worksheets.forEach((worksheet) => {
        const sheetName = worksheet.name;
        
        // Use normalized data if available and successful
        if (normalizationResults[sheetName]?.success) {
          sheets[sheetName] = normalizationResults[sheetName].data;
        } else {
          // Fallback to original processing method
          const jsonData: any[] = [];
          
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row for now
            const rowData: any[] = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              let cellValue = cell.value;
              
              // Handle different cell value types
              if (cellValue && typeof cellValue === 'object') {
                if ('text' in cellValue && cellValue.text) {
                  // Rich text object
                  cellValue = cellValue.text;
                } else if ('result' in cellValue && cellValue.result !== undefined) {
                  // Formula result
                  cellValue = cellValue.result;
                } else if ('hyperlink' in cellValue && cellValue.hyperlink) {
                  // Hyperlink object
                  cellValue = cellValue.hyperlink;
                } else if (cellValue instanceof Date) {
                  // Date object
                  cellValue = cellValue.toISOString();
                } else if (cellValue.toString) {
                  // Other objects with toString method
                  cellValue = cellValue.toString();
                } else {
                  // Fallback: stringify the object
                  cellValue = JSON.stringify(cellValue);
                }
              }
              
              rowData[colNumber - 1] = cellValue;
            });
            jsonData.push(rowData);
          });

          // Get headers from first row
          const headers: string[] = [];
          const headerRow = worksheet.getRow(1);
          headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            let headerValue = cell.value;
            
            // Handle different header value types
            if (headerValue && typeof headerValue === 'object') {
              if ('text' in headerValue && headerValue.text) {
                headerValue = headerValue.text;
              } else if ('result' in headerValue && headerValue.result !== undefined) {
                headerValue = headerValue.result;
              } else if ('hyperlink' in headerValue && headerValue.hyperlink) {
                headerValue = headerValue.hyperlink;
              } else if (headerValue instanceof Date) {
                headerValue = headerValue.toISOString();
              } else if (headerValue.toString) {
                headerValue = headerValue.toString();
              } else {
                headerValue = JSON.stringify(headerValue);
              }
            }
            
            headers[colNumber - 1] = headerValue?.toString() || `Column ${colNumber}`;
          });

          if (headers.length > 0 && jsonData.length > 0) {
            const rows = jsonData.map((row: any[]) => {
              const obj: ExcelData = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] || '';
              });
              return obj;
            });
            sheets[sheetName] = rows;
          }
        }
      });

      const newFile: ProcessedFile = {
        id: Date.now().toString(),
        name: file.name,
        sheets,
        normalizationResults
      };

      console.log('Processing new file:', {
        name: newFile.name,
        id: newFile.id,
        sheetsCount: Object.keys(newFile.sheets).length,
        totalRows: Object.values(newFile.sheets).reduce((sum, sheet) => sum + sheet.length, 0)
      });

      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      
      if (!selectedFile) {
        setSelectedFile(newFile.id);
        setSelectedSheet(Object.keys(sheets)[0]);
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert('Error reading Excel file. Please make sure it is a valid Excel file.');
    }
  };

  const getCurrentData = useMemo(() => {
    const file = files.find(f => f.id === selectedFile);
    if (!file || !selectedSheet) return [];
    return file.sheets[selectedSheet] || [];
  }, [files, selectedFile, selectedSheet]);

  const getCurrentNormalizationResult = useMemo(() => {
    const file = files.find(f => f.id === selectedFile);
    if (!file || !selectedSheet || !file.normalizationResults) return null;
    return file.normalizationResults[selectedSheet] || null;
  }, [files, selectedFile, selectedSheet]);

  const extractTags = (text: string): string[] => {
    if (!text || typeof text !== 'string') return [];
    
    const segmenter = new TinySegmenter();
    const tags: string[] = [];
    
    // 日本語文字の判定
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    
    if (hasJapanese) {
      // TinySegmenterで分かち書き
      const segments = segmenter.segment(text);
      
      // 除外する語（助詞、接続詞、感動詞など）
      const stopWords = new Set([
        // 助詞
        'は', 'が', 'を', 'に', 'で', 'と', 'の', 'へ', 'から', 'まで', 'より', 'や', 'か', 'も', 'こそ', 'さえ', 'しか', 'だけ', 'ばかり', 'など', 'なり', 'やら', 'きり', 'っきり',
        // 接続詞
        'そして', 'それで', 'しかし', 'でも', 'だが', 'ところが', 'けれど', 'けれども', 'なのに', 'だから', 'そこで', 'すると', 'それなら', 'また', 'さらに', 'つまり', 'すなわち', 'たとえば', 'ただし', 'もし', 'もしも',
        // 副詞
        'とても', 'すごく', 'かなり', 'ちょっと', '少し', 'もう', 'まだ', 'すでに', 'いつも', 'たまに', 'よく', 'あまり', 'ぜんぜん', 'きっと', 'たぶん', 'もしかして',
        // 動詞活用
        'です', 'である', 'ます', 'した', 'して', 'される', 'られる', 'せる', 'させる', 'れる', 'られ', 'ない', 'なく', 'ぬ', 'ん',
        // 形容詞活用
        'ない', 'なく', 'なし', 'い', 'く', 'かっ', 'け', 'さ',
        // 指示詞・代名詞
        'これ', 'それ', 'あれ', 'どれ', 'この', 'その', 'あの', 'どの', 'ここ', 'そこ', 'あそこ', 'どこ', 'こちら', 'そちら', 'あちら', 'どちら',
        // 接頭辞・接尾辞
        'お', 'ご', 'み', 'さん', 'ちゃん', 'くん', '様', 'さま', 'たち', 'ども',
        // 感動詞
        'あ', 'い', 'う', 'え', 'お', 'はい', 'いいえ', 'うん', 'ううん', 'ええ', 'へえ', 'ほお', 'まあ', 'おお', 'わあ',
        // 疑問詞
        '何', 'なに', 'なん', 'いつ', 'どう', 'なぜ', 'どうして', 'いくら', 'いくつ', 'どんな',
        // 記号・数詞
        '、', '。', '！', '？', '…', '・', '※', '＊', '×', '○', '△', '□', '◇', '☆', '★',
        // 時間・数量表現
        '時', '分', '秒', '年', '月', '日', '週', '回', '個', '本', '枚', '台', '人', '名', '件', '点'
      ]);
      
      segments.forEach(segment => {
        const cleanSegment = segment.trim();
        
        if (
          cleanSegment.length >= 2 && // 2文字以上
          !stopWords.has(cleanSegment) && // ストップワードでない
          !/^\d+$/.test(cleanSegment) && // 数字のみでない
          !/^[!-/:-@\[-`{-~]+$/.test(cleanSegment) && // 記号のみでない
          !/^[ぁぃぅぇぉゃゅょっ]+$/.test(cleanSegment) // 小文字ひらがなのみでない
        ) {
          tags.push(cleanSegment);
        }
      });
      
      // 英数字部分も追加で抽出
      const alphanumericParts = text.match(/[a-zA-Z0-9][a-zA-Z0-9\-_]*[a-zA-Z0-9]|[a-zA-Z]{2,}/g) || [];
      alphanumericParts.forEach(part => {
        if (part.length >= 2 && !/^\d+$/.test(part)) {
          tags.push(part.toLowerCase());
        }
      });
      
    } else {
      // 英語テキストの処理
      const words = text.split(/[\s,;。、！？\-_\(\)\[\]{}]+/);
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length >= 3 && !/^\d+$/.test(cleanWord)) {
          tags.push(cleanWord.toLowerCase());
        }
      });
    }
    
    // 重複を除去し、フィルタリング
    return [...new Set(tags)].filter(tag => 
      tag.trim().length > 0 && 
      !/^\d+$/.test(tag) &&
      !/^[!@#$%^&*(),.?":{}|<>]+$/.test(tag)
    );
  };

  const renderNormalizationStatus = () => {
    const normResult = getCurrentNormalizationResult;
    if (!normResult) return null;

    const { success, originalRowCount, normalizedRowCount, warnings, errors } = normResult;
    const efficiency = originalRowCount > 0 ? (normalizedRowCount / originalRowCount) * 100 : 0;

    return (
      <div className="mb-4 cyber-terminal p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 cyber-glow" />
          <span className="text-sm cyber-text font-mono font-bold">
            DATA NORMALIZATION STATUS
          </span>
          <button
            onClick={() => setShowNormalizationDetails(!showNormalizationDetails)}
            className="ml-auto text-xs cyber-text hover:text-cyber-glow"
          >
            {showNormalizationDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="cyber-border p-2 rounded">
            <div className="text-cyber-glow font-bold">STATUS</div>
            <div className={success ? "text-green-400" : "text-red-400"}>
              {success ? (
                <><CheckCircle className="w-3 h-3 inline mr-1" />SUCCESS</>
              ) : (
                <><AlertTriangle className="w-3 h-3 inline mr-1" />FAILED</>
              )}
            </div>
          </div>

          <div className="cyber-border p-2 rounded">
            <div className="text-cyber-glow font-bold">EFFICIENCY</div>
            <div className={efficiency >= 80 ? "text-green-400" : efficiency >= 50 ? "text-yellow-400" : "text-red-400"}>
              {efficiency.toFixed(1)}%
            </div>
          </div>

          <div className="cyber-border p-2 rounded">
            <div className="text-cyber-glow font-bold">ROWS</div>
            <div className="text-foreground">
              {normalizedRowCount}/{originalRowCount}
            </div>
          </div>

          <div className="cyber-border p-2 rounded">
            <div className="text-cyber-glow font-bold">ISSUES</div>
            <div className="text-foreground">
              {warnings.length + errors.length}
            </div>
          </div>
        </div>

        {showNormalizationDetails && (warnings.length > 0 || errors.length > 0) && (
          <div className="mt-4 space-y-2">
            {warnings.length > 0 && (
              <div className="cyber-border p-3 rounded">
                <div className="text-yellow-400 font-bold text-xs mb-2">WARNINGS:</div>
                {warnings.map((warning, index) => (
                  <div key={index} className="text-xs text-yellow-300 font-mono">
                    • {warning}
                  </div>
                ))}
              </div>
            )}
            
            {errors.length > 0 && (
              <div className="cyber-border p-3 rounded">
                <div className="text-red-400 font-bold text-xs mb-2">ERRORS:</div>
                {errors.map((error, index) => (
                  <div key={index} className="text-xs text-red-300 font-mono">
                    • {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const allTags = useMemo(() => {
    const tagFrequency = new Map<string, number>();
    
    getCurrentData.forEach(row => {
      Object.values(row).forEach(value => {
        if (value) {
          const extractedTags = extractTags(String(value));
          extractedTags.forEach(tag => {
            tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
          });
        }
      });
    });
    
    // 頻度の高い順にソートし、上位50個を返す
    return Array.from(tagFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([tag]) => tag);
  }, [getCurrentData]);

  const filteredData = useMemo(() => {
    let data = getCurrentData;

    if (searchTerm) {
      data = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedTags.size > 0) {
      data = data.filter(row =>
        Array.from(selectedTags).every(tag =>
          Object.values(row).some(value =>
            String(value).toLowerCase().includes(tag)
          )
        )
      );
    }

    return data;
  }, [getCurrentData, searchTerm, selectedTags]);

  const groupedData = useMemo(() => {
    if (!primaryKeyColumn || !filteredData.length) return null;

    const groups: { [key: string]: ExcelData[] } = {};
    filteredData.forEach(row => {
      const key = String(row[primaryKeyColumn] || 'Ungrouped');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return groups;
  }, [filteredData, primaryKeyColumn]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const highlightText = (text: any) => {
    // Handle object values that might still appear
    let textStr: string;
    if (text && typeof text === 'object') {
      if ('text' in text && text.text) {
        textStr = String(text.text);
      } else if ('result' in text && text.result !== undefined) {
        textStr = String(text.result);
      } else if ('hyperlink' in text && text.hyperlink) {
        textStr = String(text.hyperlink);
      } else if (text instanceof Date) {
        textStr = text.toISOString();
      } else {
        textStr = JSON.stringify(text);
      }
    } else {
      textStr = String(text || '');
    }
    
    let result: React.ReactNode[] = [textStr];

    // Search term highlighting
    if (searchTerm) {
      const searchRegex = new RegExp(`(${searchTerm})`, 'gi');
      result = textStr.split(searchRegex).map((part, index) =>
        searchRegex.test(part) ? (
          <span key={`search-${index}`} className="highlight highlight-scanner">
            {part}
          </span>
        ) : (
          part
        )
      );
    }

    // Tag highlighting
    if (selectedTags.size > 0) {
      const tagArray = Array.from(selectedTags);
      const tagRegex = new RegExp(`(${tagArray.join('|')})`, 'gi');
      
      if (tagRegex.test(textStr)) {
        result = result.flatMap((element, elementIndex) => {
          if (typeof element === 'string') {
            return element.split(tagRegex).map((part, partIndex) =>
              tagRegex.test(part) ? (
                <span key={`tag-${elementIndex}-${partIndex}`} className="tag-highlight">
                  {part}
                </span>
              ) : (
                part
              )
            );
          }
          return element;
        });
      }
    }

    return result;
  };


  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(selectedSheet || 'Sheet1');

      if (filteredData.length > 0) {
        // Add headers
        const headers = Object.keys(filteredData[0]);
        worksheet.addRow(headers);

        // Add data rows
        filteredData.forEach(row => {
          const values = headers.map(header => row[header]);
          worksheet.addRow(values);
        });

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF00FFFF' } // Cyan color
        };
      }

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exported_${selectedFile}_${Date.now()}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel file.');
    }
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `exported_${selectedFile}_${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      const remaining = files.filter(f => f.id !== fileId);
      if (remaining.length > 0) {
        setSelectedFile(remaining[0].id);
        setSelectedSheet(Object.keys(remaining[0].sheets)[0]);
      } else {
        setSelectedFile('');
        setSelectedSheet('');
      }
    }
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const renderDataRow = (row: ExcelData, index: number) => {
    const hasSearchMatch = searchTerm && Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const hasTagMatch = selectedTags.size > 0 && Array.from(selectedTags).some(tag =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(tag)
      )
    );

    let additionalClasses = "";
    if (hasSearchMatch && hasTagMatch) {
      additionalClasses = "data-row-with-highlight data-row-with-tag-highlight";
    } else if (hasSearchMatch) {
      additionalClasses = "data-row-with-highlight";
    } else if (hasTagMatch) {
      additionalClasses = "data-row-with-tag-highlight";
    }

    return (
      <div 
        key={index} 
        className={cn(
          "mb-4 p-6 rounded-lg transition-all duration-300 relative",
          "cyber-card data-row",
          additionalClasses
        )}
      >
        <div className="data-row-number">
          #{index + 1}
        </div>
        {Object.entries(row).map(([key, value]) => (
          <div key={key} className="data-field">
            <span className="data-field-label">
              {key}:
            </span>
            <span className="data-field-value">
              {highlightText(String(value))}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // デバッグ情報をコンソールに出力
  useEffect(() => {
    console.log('Component state:', {
      filesCount: files.length,
      selectedFile,
      selectedSheet,
      currentDataRows: getCurrentData.length,
      allTagsCount: allTags.length,
      availableSheets: selectedFile ? Object.keys(files.find(f => f.id === selectedFile)?.sheets || {}) : []
    });
  }, [files, selectedFile, selectedSheet, getCurrentData, allTags]);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 cyber-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 cyber-text text-xl">
              <FileSpreadsheet className="w-6 h-6 cyber-glow" />
              Excel2JSON
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">
                  Upload Excel File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cyber-button flex items-center gap-2 px-4 py-2 rounded cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </label>
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">
                  Data Processing
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={normalizationEnabled}
                      onChange={(e) => setNormalizationEnabled(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={cn(
                      "w-4 h-4 border-2 rounded transition-all duration-200",
                      normalizationEnabled 
                        ? "bg-cyber-glow border-cyber-glow" 
                        : "border-cyber-glow/40"
                    )}>
                      {normalizationEnabled && (
                        <CheckCircle className="w-full h-full text-black" />
                      )}
                    </div>
                    <span className="text-sm cyber-text font-mono">
                      Auto-Normalize Data
                    </span>
                  </label>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  Cleans headers, fills hierarchical gaps, removes duplicates
                </div>
              </div>

              {files.length > 0 && (
                <>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-2">
                      Select File
                    </label>
                    <select
                      value={selectedFile}
                      onChange={(e) => {
                        console.log('File selection changed:', e.target.value);
                        setSelectedFile(e.target.value);
                        const file = files.find(f => f.id === e.target.value);
                        if (file) {
                          const sheets = Object.keys(file.sheets);
                          console.log('Available sheets:', sheets);
                          if (sheets.length > 0) {
                            setSelectedSheet(sheets[0]);
                            console.log('Auto-selected sheet:', sheets[0]);
                          }
                        }
                      }}
                      className="cyber-input w-full px-3 py-2 rounded bg-cyber-terminal"
                    >
                      {files.map(file => (
                        <option key={file.id} value={file.id}>
                          {file.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFile && (
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium mb-2">
                        Select Sheet
                      </label>
                      <select
                        value={selectedSheet}
                        onChange={(e) => {
                          console.log('Sheet selection changed:', e.target.value);
                          setSelectedSheet(e.target.value);
                        }}
                        className="cyber-input w-full px-3 py-2 rounded bg-cyber-terminal"
                      >
                        {Object.keys(files.find(f => f.id === selectedFile)?.sheets || {}).map(sheet => (
                          <option key={sheet} value={sheet}>
                            {sheet}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {files.map(file => (
                  <div
                    key={file.id}
                    className="cyber-border flex items-center gap-2 px-3 py-1 rounded"
                  >
                    <span className="text-sm text-foreground">{file.name}</span>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-destructive hover:text-destructive/80 cyber-glow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setFiles([]);
                    setSelectedFile('');
                    setSelectedSheet('');
                    localStorage.removeItem('excel2json-files');
                    console.log('All files cleared from memory and localStorage');
                  }}
                  className="cyber-clear-button px-3 py-1 rounded text-xs font-mono"
                >
                  Clear All
                </button>
              </div>
            )}

            {selectedFile && selectedSheet && getCurrentData.length > 0 && (
              <>
                {renderNormalizationStatus()}
                <div className="mb-6 cyber-terminal p-6 rounded-lg">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="terminal-prompt cyber-text text-lg font-mono">
                        user@excel2json:~$
                      </div>
                      <span className="text-sm cyber-text">search command</span>
                    </div>
                    {searchTerm && (
                      <div className="text-sm cyber-text font-medium bg-cyber-glow/10 px-3 py-1 rounded">
                        {filteredData.length} matches
                      </div>
                    )}
                  </div>
                  <div className="terminal-input-wrapper">
                    <span className="terminal-cursor">$</span>
                    <Input
                      type="text"
                      placeholder="grep -i 'search_term' data.xlsx"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full cyber-terminal-input text-2xl py-6 px-12 h-16 font-mono font-bold"
                    />
                  </div>
                  {searchTerm && filteredData.length === 0 && (
                    <div className="mt-3 text-sm text-destructive cyber-glow font-mono">
                      grep: no matches found for pattern "{searchTerm}"
                    </div>
                  )}
                  {searchTerm && filteredData.length > 0 && (
                    <div className="mt-3 text-sm cyber-text font-mono">
                      grep: found {filteredData.length} line(s) matching pattern "{searchTerm}"
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Group by Column
                  </label>
                  <select
                    value={primaryKeyColumn}
                    onChange={(e) => setPrimaryKeyColumn(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">No Grouping</option>
                    {Object.keys(getCurrentData[0] || {}).map(key => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>

                {allTags.length > 0 && (
                  <div className="mb-6 cyber-terminal p-6 rounded-lg">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="terminal-prompt cyber-text text-sm font-mono">
                          user@excel2json:~$
                        </div>
                        <span className="text-sm cyber-text">tag filter</span>
                        <Tags className="w-5 h-5 cyber-glow" />
                      </div>
                      {(selectedTags.size > 0 || searchTerm) && (
                        <button
                          onClick={() => {
                            setSelectedTags(new Set());
                            setSearchTerm('');
                          }}
                          className="cyber-clear-button px-4 py-2 rounded text-xs font-mono font-bold transition-all duration-300"
                        >
                          clear --all
                        </button>
                      )}
                    </div>
                    <div className="text-xs cyber-text font-mono mb-3 opacity-80">
                      # Select tags to filter data (click to toggle)
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            "cyber-tag px-4 py-2 rounded text-sm font-mono font-medium transition-all duration-300 relative overflow-hidden",
                            selectedTags.has(tag) ? "active" : ""
                          )}
                        >
                          <span className="relative z-10">{tag}</span>
                        </button>
                      ))}
                    </div>
                    {selectedTags.size > 0 && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs cyber-text font-mono">
                          # Active filters: {Array.from(selectedTags).join(', ')}
                        </div>
                        <button
                          onClick={() => setSelectedTags(new Set())}
                          className="cyber-clear-tags-button px-3 py-1 rounded text-xs font-mono transition-all duration-300"
                        >
                          clear tags
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <Button onClick={exportToExcel} variant="outline" className="cyber-button">
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                  <Button onClick={exportToJson} variant="outline" className="cyber-button">
                    <Download className="w-4 h-4 mr-2" />
                    Export to JSON
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {groupedData ? (
          <div>
            {Object.entries(groupedData).map(([groupKey, groupData]) => (
              <Card key={groupKey} className="mb-4 cyber-card">
                <CardHeader
                  className="cursor-pointer hover:cyber-glow"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <CardTitle className="flex items-center gap-2 cyber-text">
                    {expandedGroups.has(groupKey) ? (
                      <ChevronDown className="w-4 h-4 cyber-glow" />
                    ) : (
                      <ChevronRight className="w-4 h-4 cyber-glow" />
                    )}
                    {groupKey} ({groupData.length} items)
                  </CardTitle>
                </CardHeader>
                {expandedGroups.has(groupKey) && (
                  <CardContent>
                    {groupData.map((row, index) => renderDataRow(row, index))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div>
            {paginatedData.map((row, index) => renderDataRow(row, index))}
            
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="cyber-button"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 cyber-text">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="cyber-button"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelViewer;