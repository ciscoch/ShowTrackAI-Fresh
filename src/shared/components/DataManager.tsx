import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { storageService, STORAGE_KEYS } from '../../core/services/StorageService';

interface DataManagerProps {
  visible: boolean;
  onClose: () => void;
}

interface StorageStats {
  totalKeys: number;
  totalSize: number;
  keyStats: Array<{ key: string; size: number; lastModified?: Date }>;
}

export const DataManager: React.FC<DataManagerProps> = ({ visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [lastBackup, setLastBackup] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'backup' | 'advanced'>('overview');

  useEffect(() => {
    if (visible) {
      loadStorageStats();
      loadLastBackupInfo();
    }
  }, [visible]);

  const loadStorageStats = async () => {
    try {
      const storageStats = await storageService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const loadLastBackupInfo = async () => {
    try {
      const backupInfo = await storageService.loadData(STORAGE_KEYS.LAST_BACKUP);
      setLastBackup(backupInfo);
    } catch (error) {
      console.error('Failed to load backup info:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const result = await storageService.createBackup();
      if (result.success) {
        Alert.alert(
          'Backup Created',
          `Backup file "${result.filename}" has been created successfully.`,
          [{ text: 'OK' }]
        );
        await loadLastBackupInfo();
      } else {
        Alert.alert('Backup Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Backup Failed', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBackup = async () => {
    setIsLoading(true);
    try {
      const success = await storageService.shareBackup();
      if (!success) {
        Alert.alert('Share Failed', 'Could not create or share backup file');
      }
    } catch (error) {
      Alert.alert('Share Failed', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert(
          'Restore Backup',
          'This will replace all your current data. Are you sure you want to continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                setIsLoading(true);
                try {
                  const restoreResult = await storageService.restoreFromBackup(result.assets[0].uri);
                  if (restoreResult.success) {
                    Alert.alert(
                      'Restore Successful',
                      `Successfully imported ${restoreResult.imported} data categories.`,
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            loadStorageStats();
                            onClose();
                          }
                        }
                      ]
                    );
                  } else {
                    Alert.alert(
                      'Restore Failed',
                      restoreResult.error || 'Failed to restore backup'
                    );
                  }
                } catch (error) {
                  Alert.alert('Restore Failed', String(error));
                } finally {
                  setIsLoading(false);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('File Selection Failed', String(error));
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsLoading(true);
    try {
      const result = await storageService.verifyDataIntegrity();
      if (result.valid) {
        Alert.alert('Data Integrity Check', 'All data is valid and consistent.');
      } else {
        Alert.alert(
          'Data Integrity Issues',
          `Found ${result.issues.length} issues:\n\n${result.issues.join('\n')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Integrity Check Failed', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const success = await storageService.clearAllData();
              if (success) {
                Alert.alert(
                  'Data Cleared',
                  'All data has been cleared successfully.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        loadStorageStats();
                        onClose();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Clear Failed', 'Failed to clear all data');
              }
            } catch (error) {
              Alert.alert('Clear Failed', String(error));
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    storageService.clearCache();
    Alert.alert('Cache Cleared', 'Memory cache has been cleared.');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageKeyDisplayName = (key: string): string => {
    const keyMap: Record<string, string> = {
      '@ShowTrackAI:animals': 'Animals',
      '@ShowTrackAI:expenses': 'Expenses',
      '@ShowTrackAI:income': 'Income',
      '@ShowTrackAI:journal': 'Journal Entries',
      '@ShowTrackAI:weights': 'Weight Records',
      '@ShowTrackAI:subscription': 'Subscription',
      '@ShowTrackAI:rewards': 'Reward Points',
      '@ShowTrackAI:ffaProfiles': 'FFA Profiles',
      '@ShowTrackAI:preferences': 'User Preferences',
      '@ShowTrackAI:healthRecords': 'Health Records',
      '@ShowTrackAI:healthAlerts': 'Health Alerts',
      '@ShowTrackAI:financialEntries': 'Financial Entries',
      '@ShowTrackAI:timeTracking': 'Time Tracking',
      '@ShowTrackAI:followUpTasks': 'Follow-up Tasks',
      '@ShowTrackAI:followUpUpdates': 'Follow-up Updates',
      '@ShowTrackAI:educatorMonitoring': 'Educator Monitoring',
    };
    return keyMap[key] || key.replace('@ShowTrackAI:', '');
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {[
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'backup', name: 'Backup & Restore', icon: '💾' },
        { id: 'advanced', name: 'Advanced', icon: '⚙️' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.activeTab]}
          onPress={() => setActiveTab(tab.id as any)}
        >
          <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTabIcon]}>
            {tab.icon}
          </Text>
          <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Storage Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Storage Summary</Text>
        {stats ? (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Data Size:</Text>
              <Text style={styles.statValue}>{formatBytes(stats.totalSize)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Data Categories:</Text>
              <Text style={styles.statValue}>{stats.totalKeys}</Text>
            </View>
          </>
        ) : (
          <ActivityIndicator size="small" color="#007AFF" />
        )}
      </View>

      {/* Last Backup Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💾 Last Backup</Text>
        {lastBackup ? (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Date:</Text>
              <Text style={styles.statValue}>
                {new Date(lastBackup.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Size:</Text>
              <Text style={styles.statValue}>{formatBytes(lastBackup.size)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Version:</Text>
              <Text style={styles.statValue}>{lastBackup.version}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No backup found</Text>
        )}
      </View>

      {/* Data Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Data Breakdown</Text>
        {stats && stats.keyStats.length > 0 ? (
          stats.keyStats.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <View style={styles.dataItemInfo}>
                <Text style={styles.dataItemName}>
                  {getStorageKeyDisplayName(item.key)}
                </Text>
                {item.lastModified && (
                  <Text style={styles.dataItemDate}>
                    {item.lastModified.toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Text style={styles.dataItemSize}>{formatBytes(item.size)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No data found</Text>
        )}
      </View>
    </ScrollView>
  );

  const renderBackupTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Backup Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💾 Create Backup</Text>
        <Text style={styles.cardDescription}>
          Create a backup file containing all your ShowTrackAI data. This file can be shared or stored for safekeeping.
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCreateBackup}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>📦 Create Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleShareBackup}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>📤 Create & Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Restore Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📥 Restore from Backup</Text>
        <Text style={styles.cardDescription}>
          Restore your data from a previously created backup file. This will replace all current data.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.warningButton]}
          onPress={handleRestoreBackup}
          disabled={isLoading}
        >
          <Text style={styles.warningButtonText}>📁 Select Backup File</Text>
        </TouchableOpacity>
      </View>

      {/* Backup Best Practices */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Backup Best Practices</Text>
        <Text style={styles.infoText}>
          • Create regular backups, especially before major updates
          {'\n'}• Store backup files in multiple locations (cloud storage, email, etc.)
          {'\n'}• Test restore process periodically to ensure backups work
          {'\n'}• Keep backup files secure as they contain your personal data
        </Text>
      </View>
    </ScrollView>
  );

  const renderAdvancedTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Data Integrity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔍 Data Integrity</Text>
        <Text style={styles.cardDescription}>
          Check if your stored data is valid and consistent.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleVerifyIntegrity}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>🔍 Verify Data Integrity</Text>
        </TouchableOpacity>
      </View>

      {/* Cache Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧹 Cache Management</Text>
        <Text style={styles.cardDescription}>
          Clear the memory cache to free up RAM and ensure fresh data loading.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleClearCache}
        >
          <Text style={styles.secondaryButtonText}>🗑️ Clear Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={[styles.cardTitle, styles.dangerTitle]}>⚠️ Danger Zone</Text>
        <Text style={styles.cardDescription}>
          These actions are permanent and cannot be undone. Use with extreme caution.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleClearAllData}
          disabled={isLoading}
        >
          <Text style={styles.dangerButtonText}>🗑️ Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🐛 Debug Information</Text>
        <Text style={styles.infoText}>
          Data Version: 1.0.0
          {'\n'}Storage Keys: {Object.keys(STORAGE_KEYS).length}
          {'\n'}Cache TTL: 5 minutes
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🗄️ Data Manager</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {renderTabBar()}
          
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'backup' && renderBackupTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    backgroundColor: '#fff',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerCard: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dangerTitle: {
    color: '#dc3545',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataItemInfo: {
    flex: 1,
  },
  dataItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dataItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dataItemSize: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  warningButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});