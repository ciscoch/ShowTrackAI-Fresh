/**
 * EventCheckOutModal - Event Check-out Component
 * 
 * Modal for checking out of events with reflection, points celebration,
 * and FFA degree progress updates.
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
import { EventCheckOutData, AttendedEvent } from '../../../core/models/EventAttendance';

interface EventCheckOutModalProps {
  visible: boolean;
  onClose: () => void;
  attendedEventId: string;
  eventTitle: string;
  checkInTime: string;
  onCheckOutSuccess: (updatedEvent: AttendedEvent) => void;
}

export const EventCheckOutModal: React.FC<EventCheckOutModalProps> = ({
  visible,
  onClose,
  attendedEventId,
  eventTitle,
  checkInTime,
  onCheckOutSuccess,
}) => {
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [skillsLearned, setSkillsLearned] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [networkingContacts, setNetworkingContacts] = useState('0');
  const [overallRating, setOverallRating] = useState(5);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [celebrationOpacity] = useState(new Animated.Value(0));
  
  const { trackFeatureUsage, trackError } = useAnalytics({
    screenName: 'EventCheckOutModal',
  });

  useEffect(() => {
    if (visible) {
      // Show celebration animation
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      trackFeatureUsage('event_attendance', {
        action: 'check_out_modal_opened',
        attended_event_id: attendedEventId,
      });
    }
  }, [visible]);

  const calculateDuration = () => {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMinutes = Math.round((now.getTime() - checkIn.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return { hours, minutes, total: diffMinutes };
  };

  const addSkill = () => {
    if (newSkill.trim() && !skillsLearned.includes(newSkill.trim())) {
      setSkillsLearned([...skillsLearned, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsLearned(skillsLearned.filter(s => s !== skill));
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);

    try {
      const checkOutData: EventCheckOutData = {
        attended_event_id: attendedEventId,
        reflection_notes: reflectionNotes,
        skills_learned: skillsLearned,
        networking_contacts: parseInt(networkingContacts) || 0,
        overall_rating: overallRating,
      };

      const updatedEvent = await attendedEventsService.checkOutOfEvent(
        'current-user-id', // Would get from auth context
        checkOutData
      );

      // Show success celebration
      const totalPoints = updatedEvent.aet_points_awarded + updatedEvent.sae_points_awarded;
      const duration = calculateDuration();
      
      Alert.alert(
        '🎉 Event Completed!',
        `Congratulations! You attended ${eventTitle} for ${duration.hours}h ${duration.minutes}m and earned ${totalPoints} points!\n\n` +
        `• ${updatedEvent.aet_points_awarded} AET Points\n` +
        `• ${updatedEvent.sae_points_awarded} SAE Points\n\n` +
        `Your FFA degree progress has been updated. Keep up the great work!`,
        [
          {
            text: 'Awesome!',
            onPress: () => {
              onCheckOutSuccess(updatedEvent);
              onClose();
            },
          },
        ]
      );

      trackFeatureUsage('event_attendance', {
        action: 'check_out_completed',
        attended_event_id: attendedEventId,
        duration_minutes: duration.total,
        points_earned: totalPoints,
        skills_count: skillsLearned.length,
        overall_rating: overallRating,
        has_reflection: !!reflectionNotes,
      });

    } catch (error) {
      console.error('Check-out failed:', error);
      Alert.alert(
        'Check-out Failed',
        'Unable to complete event check-out. Please try again.'
      );
      
      trackError(error as Error, {
        feature: 'event_attendance',
        action: 'check_out_failed',
        attended_event_id: attendedEventId,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const renderStarRating = () => (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>Overall Experience:</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setOverallRating(star)}
            style={styles.star}
          >
            <Text style={[
              styles.starText,
              { color: star <= overallRating ? '#FFD700' : '#ddd' }
            ]}>
              ⭐
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCelebrationHeader = () => {
    const duration = calculateDuration();
    
    return (
      <Animated.View style={[styles.celebrationContainer, { opacity: celebrationOpacity }]}>
        <Text style={styles.celebrationTitle}>🎊 Event Complete!</Text>
        <Text style={styles.celebrationText}>
          You attended for {duration.hours}h {duration.minutes}m
        </Text>
        <Text style={styles.celebrationSubtext}>
          Time to reflect and claim your points!
        </Text>
      </Animated.View>
    );
  };

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
              <Text style={styles.title}>Event Check-Out</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Event Info */}
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{eventTitle}</Text>
              <Text style={styles.checkInTime}>
                Checked in at {new Date(checkInTime).toLocaleTimeString()}
              </Text>
            </View>

            {/* Celebration Header */}
            {renderCelebrationHeader()}

            {/* Reflection Form */}
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>📝 Reflection & Learning</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What did you learn or accomplish?</Text>
                <TextInput
                  style={[styles.textInput, styles.reflectionInput]}
                  value={reflectionNotes}
                  onChangeText={setReflectionNotes}
                  placeholder="Share your key takeaways, insights, or accomplishments..."
                  multiline
                  numberOfLines={4}
                  returnKeyType="done"
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Skills Developed</Text>
                <View style={styles.skillsContainer}>
                  {skillsLearned.map((skill, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.skillChip}
                      onPress={() => removeSkill(skill)}
                    >
                      <Text style={styles.skillText}>{skill}</Text>
                      <Text style={styles.skillRemove}>×</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addSkillContainer}>
                  <TextInput
                    style={styles.skillInput}
                    value={newSkill}
                    onChangeText={setNewSkill}
                    placeholder="Add a skill you developed..."
                    onSubmitEditing={addSkill}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={addSkill} style={styles.addSkillButton}>
                    <Text style={styles.addSkillButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Connections Made</Text>
                <TextInput
                  style={styles.numberInput}
                  value={networkingContacts}
                  onChangeText={setNetworkingContacts}
                  placeholder="0"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
                <Text style={styles.inputHint}>
                  How many new people did you meet or connect with?
                </Text>
              </View>

              {/* Rating */}
              {renderStarRating()}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isCheckingOut}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.checkOutButton, isCheckingOut && styles.checkOutButtonDisabled]}
                onPress={handleCheckOut}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.checkOutButtonText}>🏆 Complete & Earn Points!</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Encouragement Footer */}
            <View style={styles.encouragement}>
              <Text style={styles.encouragementText}>
                🌟 Great job participating! Your engagement in FFA activities builds valuable skills and advances your degree progress.
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
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
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
  checkInTime: {
    fontSize: 14,
    color: '#388E3C',
  },
  celebrationContainer: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 8,
  },
  celebrationText: {
    fontSize: 16,
    color: '#F9A825',
    fontWeight: '600',
    marginBottom: 4,
  },
  celebrationSubtext: {
    fontSize: 14,
    color: '#FBC02D',
    textAlign: 'center',
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
  reflectionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  skillChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillText: {
    color: '#1565C0',
    fontSize: 14,
    marginRight: 4,
  },
  skillRemove: {
    color: '#1565C0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addSkillButton: {
    backgroundColor: '#2E7D32',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addSkillButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 80,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  ratingContainer: {
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    padding: 4,
  },
  starText: {
    fontSize: 24,
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
  checkOutButton: {
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
  checkOutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  encouragement: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  encouragementText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EventCheckOutModal;