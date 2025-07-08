/**
 * Profile Screen with Test Button
 * Adds a button to access user management testing
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { ProfileChooserScreen } from './ProfileChooserScreen';
import { UserManagementTestScreen } from './UserManagementTestScreen';
import { useSupabaseBackend } from '../../../core/hooks/useSupabaseBackend';

interface ProfileWithTestButtonProps {
  onProfileSelected: (profile: any) => void;
  onShowSettings?: () => void;
}

export const ProfileWithTestButton: React.FC<ProfileWithTestButtonProps> = ({
  onProfileSelected,
  onShowSettings,
}) => {
  const [showTestScreen, setShowTestScreen] = useState(false);
  const { isEnabled: useBackend } = useSupabaseBackend();

  const handleShowTest = () => {
    setShowTestScreen(true);
  };

  return (
    <View style={styles.container}>
      {/* Add test button at the top */}
      <View style={styles.testButtonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={handleShowTest}>
          <Text style={styles.testButtonText}>
            🧪 Test User Management {useBackend ? '(Backend On)' : '(Backend Off)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Original Profile Chooser */}
      <ProfileChooserScreen
        onProfileSelected={onProfileSelected}
        onShowSettings={onShowSettings}
      />

      {/* Test Screen Modal */}
      <Modal
        visible={showTestScreen}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTestScreen(false)}
            >
              <Text style={styles.closeButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>User Management Test</Text>
          </View>
          
          <UserManagementTestScreen />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  testButtonContainer: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 50, // Account for status bar
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
});