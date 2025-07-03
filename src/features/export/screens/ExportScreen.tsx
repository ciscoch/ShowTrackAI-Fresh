import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { exportService, ExportOptions, ExportResult, ExportFormat } from '../../../core/services/ExportService';
import { DatePicker } from '../../../shared/components/DatePicker';
import { FormPicker } from '../../../shared/components/FormPicker';

interface ExportScreenProps {
  onExportComplete: (result: ExportResult) => void;
  onClose: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({
  onExportComplete,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['animals']);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [includePhotos, setIncludePhotos] = useState(false);
  const [includeAnalytics, setIncludeAnalytics] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportResult[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const formats: Array<{ label: string; value: ExportFormat }> = [
    { label: 'CSV (Spreadsheet)', value: 'csv' },
    { label: 'JSON (Data)', value: 'json' },
    { label: 'PDF (Report)', value: 'pdf' },
    { label: 'Excel (XLSX)', value: 'xlsx' },
    { label: 'IRS Schedule F', value: 'schedulef' },
    { label: 'AET Report', value: 'aet_report' },
  ];

  const dataTypes = [
    { label: 'Animals', value: 'animals' },
    { label: 'Expenses', value: 'expenses' },
    { label: 'Income', value: 'income' },
    { label: 'Journal Entries', value: 'journal' },
    { label: 'Weight Records', value: 'weights' },
    { label: 'FFA Profile', value: 'ffa_profile' },
    { label: 'Analytics', value: 'analytics' },
  ];

  const templates = [
    { label: 'Basic', value: 'basic' },
    { label: 'Detailed', value: 'detailed' },
    { label: 'Financial', value: 'financial' },
    { label: 'Educational', value: 'educational' },
  ];

  useEffect(() => {
    loadExportHistory();
  }, []);

  useEffect(() => {
    if (selectedDataTypes.length > 0) {
      loadPreviewData();
    }
  }, [selectedDataTypes, dateRange]);

  const loadExportHistory = async () => {
    try {
      const history = await exportService.getExportHistory();
      setExportHistory(history);
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const loadPreviewData = async () => {
    if (selectedDataTypes.length === 0) return;

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        dataTypes: selectedDataTypes,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end,
        } : undefined,
        includePhotos,
        includeAnalytics,
        template: selectedTemplate as any,
      };

      const preview = await exportService.previewExport(options);
      setPreviewData(preview);
    } catch (error) {
      console.error('Failed to load preview:', error);
    }
  };

  const handleDataTypeToggle = (dataType: string) => {
    if (selectedDataTypes.includes(dataType)) {
      setSelectedDataTypes(prev => prev.filter(type => type !== dataType));
    } else {
      setSelectedDataTypes(prev => [...prev, dataType]);
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    const templates = exportService.getExportTemplates();
    const template = templates[templateKey];
    
    if (template) {
      setSelectedFormat(template.format);
      setSelectedDataTypes(template.dataTypes);
      setSelectedTemplate(template.template || '');
      setIncludePhotos(template.includePhotos || false);
      setIncludeAnalytics(template.includeAnalytics || false);
    }
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      Alert.alert('No Data Selected', 'Please select at least one data type to export.');
      return;
    }

    Alert.alert(
      'Confirm Export',
      `Export ${selectedDataTypes.length} data type(s) in ${selectedFormat.toUpperCase()} format?${previewData ? `\n\nEstimated file size: ${(previewData.estimatedFileSize / 1024).toFixed(1)} KB` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setLoading(true);
            try {
              const options: ExportOptions = {
                format: selectedFormat,
                dataTypes: selectedDataTypes,
                dateRange: dateRange.start && dateRange.end ? {
                  start: dateRange.start,
                  end: dateRange.end,
                } : undefined,
                includePhotos,
                includeAnalytics,
                template: selectedTemplate as any,
              };

              const result = await exportService.exportData(options);
              
              if (result.success) {
                Alert.alert(
                  'Export Successful!',
                  `File: ${result.fileName}\nRecords: ${result.recordCount}\nSize: ${(result.fileSize / 1024).toFixed(1)} KB`,
                  [{ text: 'OK', onPress: () => onExportComplete(result) }]
                );
                loadExportHistory(); // Refresh history
              } else {
                Alert.alert('Export Failed', result.error || 'Unknown error occurred');
              }
            } catch (error) {
              Alert.alert('Export Failed', 'An error occurred during export');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderQuickTemplates = () => {
    const templates = exportService.getExportTemplates();
    
    return (
      <View style={styles.templatesSection}>
        <Text style={styles.sectionTitle}>🚀 Quick Templates</Text>
        <View style={styles.templateButtons}>
          {Object.entries(templates).map(([key, template]) => (
            <TouchableOpacity
              key={key}
              style={styles.templateButton}
              onPress={() => handleTemplateSelect(key)}
            >
              <Text style={styles.templateButtonTitle}>
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.templateButtonSubtitle}>
                {template.format.toUpperCase()} • {template.dataTypes.length} types
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFormatSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📄 Export Format</Text>
      <FormPicker
        label=""
        value={selectedFormat}
        onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
        options={formats}
        placeholder="Select export format"
      />
      
      {selectedFormat === 'schedulef' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📋 IRS Schedule F format includes only expenses and income data for tax filing purposes.
          </Text>
        </View>
      )}
      
      {selectedFormat === 'aet_report' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🎓 AET Report format creates an educational portfolio showing skill development and career readiness.
          </Text>
        </View>
      )}
    </View>
  );

  const renderDataTypeSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Data to Export</Text>
      <View style={styles.dataTypeGrid}>
        {dataTypes.map((dataType) => (
          <TouchableOpacity
            key={dataType.value}
            style={[
              styles.dataTypeButton,
              selectedDataTypes.includes(dataType.value) && styles.dataTypeButtonSelected,
            ]}
            onPress={() => handleDataTypeToggle(dataType.value)}
          >
            <Text
              style={[
                styles.dataTypeButtonText,
                selectedDataTypes.includes(dataType.value) && styles.dataTypeButtonTextSelected,
              ]}
            >
              {dataType.label}
            </Text>
            {selectedDataTypes.includes(dataType.value) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDateRange = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Date Range (Optional)</Text>
      <View style={styles.dateRangeContainer}>
        <View style={styles.datePickerContainer}>
          <DatePicker
            label="From"
            value={dateRange.start}
            onDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
            placeholder="Start date"
          />
        </View>
        <View style={styles.datePickerContainer}>
          <DatePicker
            label="To"
            value={dateRange.end}
            onDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
            placeholder="End date"
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.clearDateButton}
        onPress={() => setDateRange({ start: null, end: null })}
      >
        <Text style={styles.clearDateButtonText}>Clear Date Range</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOptions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Export Options</Text>
      
      <View style={styles.optionItem}>
        <Text style={styles.optionLabel}>Include Photos</Text>
        <Switch
          value={includePhotos}
          onValueChange={setIncludePhotos}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={includePhotos ? '#007AFF' : '#f4f3f4'}
        />
      </View>
      
      <View style={styles.optionItem}>
        <Text style={styles.optionLabel}>Include Analytics</Text>
        <Switch
          value={includeAnalytics}
          onValueChange={setIncludeAnalytics}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={includeAnalytics ? '#007AFF' : '#f4f3f4'}
        />
      </View>

      <FormPicker
        label="Template"
        value={selectedTemplate}
        onValueChange={setSelectedTemplate}
        options={templates}
        placeholder="Select template (optional)"
      />
    </View>
  );

  const renderPreview = () => {
    if (!previewData) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👀 Export Preview</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewStats}>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatValue}>
                {Object.values(previewData.recordCounts).reduce((sum: number, count: number) => sum + count, 0)}
              </Text>
              <Text style={styles.previewStatLabel}>Total Records</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatValue}>
                {(previewData.estimatedFileSize / 1024).toFixed(1)} KB
              </Text>
              <Text style={styles.previewStatLabel}>Est. File Size</Text>
            </View>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatValue}>
                {Object.keys(previewData.recordCounts).length}
              </Text>
              <Text style={styles.previewStatLabel}>Data Types</Text>
            </View>
          </View>
          
          <View style={styles.previewBreakdown}>
            {Object.entries(previewData.recordCounts).map(([dataType, count]) => (
              <Text key={dataType} style={styles.previewBreakdownItem}>
                {dataType}: {count} records
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderExportHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📁 Recent Exports</Text>
      {exportHistory.length > 0 ? (
        <View style={styles.historyList}>
          {exportHistory.slice(0, 3).map((item) => (
            <View key={item.exportId} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyFileName}>{item.fileName}</Text>
                <Text style={styles.historyDetails}>
                  {item.recordCount} records • {(item.fileSize / 1024).toFixed(1)} KB
                </Text>
                <Text style={styles.historyDate}>
                  {item.createdAt.toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Text style={styles.downloadButtonText}>📥</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noHistoryText}>No recent exports</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📤 Export Data</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuickTemplates()}
        {renderFormatSelection()}
        {renderDataTypeSelection()}
        {renderDateRange()}
        {renderOptions()}
        {renderPreview()}
        {renderExportHistory()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.exportButton, loading && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={loading || selectedDataTypes.length === 0}
        >
          <Text style={styles.exportButtonText}>
            {loading ? 'Exporting...' : '📤 Export Data'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 16,
  },
  templatesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  templateButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  templateButtonSubtitle: {
    fontSize: 11,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
  },
  dataTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dataTypeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataTypeButtonSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  dataTypeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dataTypeButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerContainer: {
    flex: 1,
  },
  clearDateButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  clearDateButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  previewStatLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  previewBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
  },
  previewBreakdownItem: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyFileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  historyDetails: {
    fontSize: 11,
    color: '#666',
    marginBottom: 1,
  },
  historyDate: {
    fontSize: 10,
    color: '#999',
  },
  downloadButton: {
    padding: 8,
  },
  downloadButtonText: {
    fontSize: 16,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  exportButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});