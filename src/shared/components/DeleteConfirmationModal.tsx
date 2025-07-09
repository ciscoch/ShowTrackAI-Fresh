import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

interface DeleteConfirmationModalProps {
  visible: boolean;
  title: string;
  itemName: string;
  itemType: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructiveAction?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  title,
  itemName,
  itemType,
  description,
  onConfirm,
  onCancel,
  destructiveAction = 'DELETE',
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setConfirmationText('');
      setIsDeleting(false);
    }
  }, [visible]);

  const isConfirmationValid = confirmationText.trim().toUpperCase() === destructiveAction.toUpperCase();

  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      Alert.alert('Invalid Confirmation', `Please type "${destructiveAction}" to confirm.`);
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      // Reset state after successful deletion
      setConfirmationText('');
      setIsDeleting(false);
    } catch (error) {
      setIsDeleting(false);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    setIsDeleting(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.itemName}>"{itemName}"</Text>
            
            <Text style={styles.warningText}>
              This action cannot be undone. This will permanently delete the {itemType} and all associated data.
            </Text>

            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>

          {/* Confirmation Section - Separated for better keyboard handling */}
          <View style={styles.confirmationContainer}>
            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>
                To confirm, type "<Text style={styles.confirmationKeyword}>{destructiveAction}</Text>" below:
              </Text>
              
              <TextInput
                style={[
                  styles.confirmationInput,
                  isConfirmationValid && styles.confirmationInputValid,
                  !isConfirmationValid && confirmationText.length > 0 && styles.confirmationInputInvalid
                ]}
                value={confirmationText}
                onChangeText={(text) => {
                  console.log('Text input changed:', text);
                  setConfirmationText(text);
                }}
                placeholder={`Type ${destructiveAction} here`}
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                editable={!isDeleting}
                selectTextOnFocus={true}
              />

              {confirmationText.length > 0 && !isConfirmationValid && (
                <Text style={styles.validationError}>
                  Please type "{destructiveAction}" exactly as shown.
                </Text>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isDeleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                (!isConfirmationValid || isDeleting) && styles.deleteButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!isConfirmationValid || isDeleting}
            >
              <Text style={[
                styles.deleteButtonText,
                (!isConfirmationValid || isDeleting) && styles.deleteButtonTextDisabled
              ]}>
                {isDeleting ? 'Deleting...' : `Delete ${itemType}`}
              </Text>
            </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  confirmationContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FAFAFA',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  confirmationSection: {
    paddingTop: 16,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  confirmationKeyword: {
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'monospace',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
  },
  confirmationInputValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  confirmationInputInvalid: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  validationError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#DC2626',
  },
  deleteButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButtonTextDisabled: {
    color: '#9CA3AF',
  },
});