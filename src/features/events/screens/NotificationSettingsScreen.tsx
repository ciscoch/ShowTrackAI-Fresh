/**
 * NotificationSettingsScreen - Event Notification Settings
 * 
 * Allows users to configure their event check-out reminder preferences,
 * notification timing, and motivational message settings.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAnalytics } from '../../../core/hooks/useAnalytics';

interface NotificationSettings {
  enabled: boolean;
  reminderIntervals: number[];
  motivationalMessages: boolean;
  pointsDeadlineAlert: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationSettingsScreenProps {
  onNavigateBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onNavigateBack,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    reminderIntervals: [30, 15, 5],
    motivationalMessages: true,
    pointsDeadlineAlert: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { trackFeatureUsage } = useAnalytics({
    screenName: 'NotificationSettingsScreen',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem('checkout_reminder_config');
      if (stored) {
        const config = JSON.parse(stored);
        setSettings({
          enabled: config.enabled ?? true,
          reminderIntervals: config.reminderIntervals ?? [30, 15, 5],
          motivationalMessages: config.motivationalMessages ?? true,
          pointsDeadlineAlert: config.pointsDeadlineAlert ?? true,
          soundEnabled: config.soundEnabled ?? true,
          vibrationEnabled: config.vibrationEnabled ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      setIsSaving(true);
      await AsyncStorage.setItem('checkout_reminder_config', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      trackFeatureUsage('notification_settings', {
        action: 'settings_updated',
        enabled: newSettings.enabled,
        reminder_count: newSettings.reminderIntervals.length,
        motivational_enabled: newSettings.motivationalMessages,
      });

      Alert.alert(
        '✅ Settings Saved',
        'Your notification preferences have been updated.'
      );
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert(
        'Error',
        'Failed to save your notification settings. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const toggleReminderInterval = (interval: number) => {
    const currentIntervals = [...settings.reminderIntervals];
    const index = currentIntervals.indexOf(interval);
    
    if (index >= 0) {
      currentIntervals.splice(index, 1);
    } else {
      currentIntervals.push(interval);
      currentIntervals.sort((a, b) => b - a); // Sort descending
    }
    
    updateSetting('reminderIntervals', currentIntervals);
  };

  const sendTestNotification = async () => {
    try {
      // Check notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to test notifications.'
          );
          return;
        }
      }

      // Trigger vibration if enabled
      if (settings.vibrationEnabled) {
        Vibration.vibrate(400); // Vibrate for 400ms
      }

      // Send actual notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification',
          body: 'This is what your check-out reminders will look like!',
          sound: settings.soundEnabled,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
          data: {
            type: 'test_notification',
          },
        },
        trigger: null, // Send immediately
      });

      trackFeatureUsage('notification_settings', { 
        action: 'test_notification_sent',
        sound_enabled: settings.soundEnabled,
        vibration_enabled: settings.vibrationEnabled,
      });

      // Show confirmation after a brief delay
      setTimeout(() => {
        Alert.alert(
          '📱 Test Sent!',
          `Notification sent with ${settings.soundEnabled ? 'sound' : 'no sound'} and ${settings.vibrationEnabled ? 'vibration' : 'no vibration'}.`
        );
      }, 500);

    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert(
        'Test Failed',
        'Unable to send test notification. Please check your notification permissions.'
      );
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Notification Settings</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderMainSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔔 Event Check-out Reminders</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Enable Reminders</Text>
          <Text style={styles.settingDescription}>
            Get notified to check out of events and earn your points
          </Text>
        </View>
        <Switch
          value={settings.enabled}
          onValueChange={(value) => updateSetting('enabled', value)}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={settings.enabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Points Deadline Alert</Text>
          <Text style={styles.settingDescription}>
            Alert if you haven't checked out after event ends
          </Text>
        </View>
        <Switch
          value={settings.pointsDeadlineAlert}
          onValueChange={(value) => updateSetting('pointsDeadlineAlert', value)}
          disabled={!settings.enabled}
          trackColor={{ false: '#767577', true: '#FF9800' }}
          thumbColor={settings.pointsDeadlineAlert ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Motivational Messages</Text>
          <Text style={styles.settingDescription}>
            Encouraging messages during events to maximize learning
          </Text>
        </View>
        <Switch
          value={settings.motivationalMessages}
          onValueChange={(value) => updateSetting('motivationalMessages', value)}
          disabled={!settings.enabled}
          trackColor={{ false: '#767577', true: '#2196F3' }}
          thumbColor={settings.motivationalMessages ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  const renderReminderTiming = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⏰ Reminder Timing</Text>
      <Text style={styles.sectionDescription}>
        Choose when to receive check-out reminders before events end
      </Text>
      
      {[60, 30, 15, 5].map((minutes) => (
        <TouchableOpacity
          key={minutes}
          style={[
            styles.intervalOption,
            settings.reminderIntervals.includes(minutes) && styles.intervalOptionSelected,
            !settings.enabled && styles.intervalOptionDisabled,
          ]}
          onPress={() => toggleReminderInterval(minutes)}
          disabled={!settings.enabled}
        >
          <Text style={[
            styles.intervalText,
            settings.reminderIntervals.includes(minutes) && styles.intervalTextSelected,
            !settings.enabled && styles.intervalTextDisabled,
          ]}>
            {minutes} minutes before event ends
          </Text>
          {settings.reminderIntervals.includes(minutes) && (
            <Text style={styles.intervalCheck}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSoundSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔊 Sound & Vibration</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Sound</Text>
          <Text style={styles.settingDescription}>Play sound with notifications</Text>
        </View>
        <Switch
          value={settings.soundEnabled}
          onValueChange={(value) => updateSetting('soundEnabled', value)}
          disabled={!settings.enabled}
          trackColor={{ false: '#767577', true: '#9C27B0' }}
          thumbColor={settings.soundEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Vibration</Text>
          <Text style={styles.settingDescription}>Vibrate device with notifications</Text>
        </View>
        <Switch
          value={settings.vibrationEnabled}
          onValueChange={(value) => updateSetting('vibrationEnabled', value)}
          disabled={!settings.enabled}
          trackColor={{ false: '#767577', true: '#9C27B0' }}
          thumbColor={settings.vibrationEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  const renderTestNotification = () => (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.testButton, !settings.enabled && styles.testButtonDisabled]}
        onPress={() => {
          if (settings.enabled) {
            sendTestNotification();
          }
        }}
        disabled={!settings.enabled}
      >
        <Text style={[styles.testButtonText, !settings.enabled && styles.testButtonTextDisabled]}>
          📱 Test Notification
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.testDescription}>
        Send a real notification to test your sound and vibration settings
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderMainSettings()}
        {renderReminderTiming()}
        {renderSoundSettings()}
        {renderTestNotification()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tip: Enable reminders to maximize your FFA SAE/AET point earning potential!
          </Text>
        </View>
      </ScrollView>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  intervalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
  },
  intervalOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  intervalOptionDisabled: {
    opacity: 0.5,
  },
  intervalText: {
    fontSize: 16,
    color: '#333',
  },
  intervalTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  intervalTextDisabled: {
    color: '#999',
  },
  intervalCheck: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  testButtonDisabled: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonTextDisabled: {
    color: '#999',
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#1565C0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  savingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default NotificationSettingsScreen;