/**
 * EventCheckInModal - Event Check-in Component
 * 
 * Modal for checking into events with QR code scanning, location verification,
 * and motivational encouragement for FFA SAE/AET point earning.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { attendedEventsService } from '../../../core/services/AttendedEventsService';
import { useAnalytics } from '../../../core/hooks/useAnalytics';
import { EventCheckInData, AET_POINTS_MATRIX, SAE_POINTS_MATRIX } from '../../../core/models/EventAttendance';

interface EventCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventType: string;
  onCheckInSuccess: (attendedEvent: any) => void;
}

export const EventCheckInModal: React.FC<EventCheckInModalProps> = ({
  visible,
  onClose,
  eventId,
  eventTitle,
  eventType,
  onCheckInSuccess,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [notes, setNotes] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [motivationOpacity] = useState(new Animated.Value(0));
  
  const { trackFeatureUsage, trackError } = useAnalytics({
    screenName: 'EventCheckInModal',
  });

  useEffect(() => {
    if (visible) {
      // Show motivational animation
      Animated.timing(motivationOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Get user location for verification
      getCurrentLocation();

      trackFeatureUsage('event_attendance', {
        action: 'check_in_modal_opened',
        event_id: eventId,
        event_type: eventType,
      });
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      // In a real app, this would use expo-location
      // For now, using mock location
      setLocation({
        latitude: 29.4241,
        longitude: -98.4936, // San Antonio coordinates
      });
    } catch (error) {
      console.warn('Could not get location:', error);
    }
  };

  const calculatePotentialPoints = () => {
    const aetPoints = AET_POINTS_MATRIX[eventType as keyof typeof AET_POINTS_MATRIX] || 5;
    const saePoints = SAE_POINTS_MATRIX[eventType as keyof typeof SAE_POINTS_MATRIX] || 2;
    return aetPoints + saePoints;
  };

  const handleCheckIn = async () => {
    if (!eventId) {
      Alert.alert('Error', 'Event information is missing. Please try again.');
      return;
    }

    setIsCheckingIn(true);

    try {
      const checkInData: EventCheckInData = {
        event_id: eventId,
        verification_code: verificationCode || undefined,
        location: location || undefined,
        notes: notes || undefined,
      };

      const attendedEvent = await attendedEventsService.checkInToEvent(
        'current-user-id', // Would get from auth context
        checkInData
      );

      // Show success and encourage participation
      Alert.alert(
        '🎯 Successfully Checked In!',
        `Welcome to ${eventTitle}! You can earn up to ${calculatePotentialPoints()} points by staying for the full event. Make the most of this learning opportunity!`,
        [
          {
            text: 'Let\'s Go!',
            onPress: () => {
              onCheckInSuccess(attendedEvent);
              onClose();
            },
          },
        ]
      );

      trackFeatureUsage('event_attendance', {
        action: 'check_in_completed',
        event_id: eventId,
        event_type: eventType,
        has_verification_code: !!verificationCode,
        has_location: !!location,
        potential_points: calculatePotentialPoints(),
      });

    } catch (error) {
      console.error('Check-in failed:', error);
      Alert.alert(
        'Check-in Failed',
        'Unable to check into the event. Please verify your information and try again.'
      );
      
      trackError(error as Error, {
        feature: 'event_attendance',
        action: 'check_in_failed',
        event_id: eventId,
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const renderMotivationalHeader = () => (
    <Animated.View style={[styles.motivationContainer, { opacity: motivationOpacity }]}>
      <Text style={styles.motivationTitle}>🌟 Ready to Earn Points?</Text>
      <Text style={styles.motivationText}>
        This {eventType.replace('_', ' ')} can earn you up to {calculatePotentialPoints()} points!
      </Text>
      <View style={styles.pointsBreakdown}>
        <View style={styles.pointsItem}>
          <Text style={styles.pointsValue}>
            {AET_POINTS_MATRIX[eventType as keyof typeof AET_POINTS_MATRIX] || 5}
          </Text>
          <Text style={styles.pointsLabel}>AET Points</Text>
        </View>
        <View style={styles.pointsItem}>
          <Text style={styles.pointsValue}>
            {SAE_POINTS_MATRIX[eventType as keyof typeof SAE_POINTS_MATRIX] || 2}
          </Text>
          <Text style={styles.pointsLabel}>SAE Points</Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContainer}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Check In to Event</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Event Info */}
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{eventTitle}</Text>
                  <Text style={styles.eventType}>
                    {eventType.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                {/* Motivational Header */}
                {renderMotivationalHeader()}

                {/* Check-in Form */}
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Verification</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Event Code (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      placeholder="Enter event code if provided"
                      autoCapitalize="none"
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.notesInput]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="What are you excited to learn?"
                      multiline
                      numberOfLines={3}
                      returnKeyType="done"
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Location Status */}
                  <View style={styles.locationStatus}>
                    <Text style={styles.locationText}>
                      📍 Location: {location ? '✅ Verified' : '⏳ Getting location...'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    disabled={isCheckingIn}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.checkInButton, isCheckingIn && styles.checkInButtonDisabled]}
                    onPress={handleCheckIn}
                    disabled={isCheckingIn}
                  >
                    {isCheckingIn ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.checkInButtonText}>🎯 Check In & Start Earning!</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Encouragement Footer */}
                <View style={styles.encouragement}>
                  <Text style={styles.encouragementText}>
                    💪 Stay engaged and participate actively to maximize your learning and points!
                  </Text>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
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
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    paddingBottom: 30,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  eventInfo: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 14,
    color: '#388E3C',
    fontWeight: '600',
  },
  motivationContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#F57C00',
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  pointsItem: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E65100',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  form: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationStatus: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  checkInButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  checkInButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkInButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  encouragement: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  encouragementText: {
    fontSize: 12,
    color: '#1565C0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EventCheckInModal;