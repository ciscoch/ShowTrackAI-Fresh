import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Event, EVENT_TYPES, PRIORITY_LEVELS, CreateEventRequest } from '../../../core/models/Event';
import { calendarService } from '../../../core/services/CalendarService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';

interface AddEventScreenProps {
  onBack: () => void;
  onEventAdded: () => void;
}

export const AddEventScreen: React.FC<AddEventScreenProps> = ({
  onBack,
  onEventAdded,
}) => {
  const { currentProfile } = useProfileStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: null as Date | null,
    endDate: null as Date | null,
    location: '',
    eventType: '',
    priority: 'medium',
    isAllDay: false,
    organizerName: '',
    organizerContact: '',
    registrationRequired: false,
    registrationDeadline: null as Date | null,
    cost: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.date) newErrors.date = 'Event date is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    
    if (formData.cost && isNaN(Number(formData.cost))) {
      newErrors.cost = 'Cost must be a valid number';
    }

    if (formData.registrationRequired && !formData.registrationDeadline) {
      newErrors.registrationDeadline = 'Registration deadline is required when registration is required';
    }

    if (formData.endDate && formData.date && formData.endDate < formData.date) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !currentProfile) {
      return;
    }

    try {
      setLoading(true);

      const eventData: CreateEventRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date!,
        endDate: formData.endDate || undefined,
        location: formData.location.trim() || undefined,
        eventType: formData.eventType as any,
        priority: formData.priority as any,
        isAllDay: formData.isAllDay,
        organizerName: formData.organizerName.trim() || undefined,
        organizerContact: formData.organizerContact.trim() || undefined,
        registrationRequired: formData.registrationRequired,
        registrationDeadline: formData.registrationDeadline || undefined,
        cost: formData.cost ? Number(formData.cost) : undefined,
        notes: formData.notes.trim() || undefined,
        userId: currentProfile.id,
        reminders: [],
        attendees: [],
      };

      await calendarService.addEvent(eventData);
      
      Alert.alert(
        'Success!',
        'Event has been added to your calendar.',
        [{ text: 'OK', onPress: onEventAdded }]
      );

    } catch (error) {
      console.error('Failed to save event:', error);
      Alert.alert('Error', 'Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const eventTypeOptions = EVENT_TYPES.map(type => ({
    label: `${type.icon} ${type.label}`,
    value: type.value,
  }));

  const priorityOptions = PRIORITY_LEVELS.map(priority => ({
    label: priority.label,
    value: priority.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Event</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter event title"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter event description (optional)"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <FormPicker
            label="Event Type"
            value={formData.eventType}
            onValueChange={(value) => setFormData({ ...formData, eventType: value })}
            options={eventTypeOptions}
            placeholder="Select event type"
            required
            error={errors.eventType}
          />

          <FormPicker
            label="Priority"
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
            options={priorityOptions}
            placeholder="Select priority"
            required
            error={errors.priority}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>All Day Event</Text>
            <Switch
              value={formData.isAllDay}
              onValueChange={(value) => setFormData({ ...formData, isAllDay: value })}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.isAllDay ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <DatePicker
            label="Start Date"
            value={formData.date}
            onDateChange={(date) => setFormData({ ...formData, date })}
            placeholder="Select start date"
            required
            error={errors.date}
            showTime={!formData.isAllDay}
          />

          {!formData.isAllDay && (
            <DatePicker
              label="End Date/Time (Optional)"
              value={formData.endDate}
              onDateChange={(date) => setFormData({ ...formData, endDate: date })}
              placeholder="Select end date/time"
              error={errors.endDate}
              showTime={true}
            />
          )}
        </View>

        {/* Location & Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Contact</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Enter location (optional)"
              maxLength={200}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organizer Name</Text>
            <TextInput
              style={[styles.input, errors.organizerName && styles.inputError]}
              value={formData.organizerName}
              onChangeText={(text) => setFormData({ ...formData, organizerName: text })}
              placeholder="Enter organizer name (optional)"
              maxLength={100}
            />
            {errors.organizerName && <Text style={styles.errorText}>{errors.organizerName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organizer Contact</Text>
            <TextInput
              style={[styles.input, errors.organizerContact && styles.inputError]}
              value={formData.organizerContact}
              onChangeText={(text) => setFormData({ ...formData, organizerContact: text })}
              placeholder="Email or phone (optional)"
              maxLength={100}
            />
            {errors.organizerContact && <Text style={styles.errorText}>{errors.organizerContact}</Text>}
          </View>
        </View>

        {/* Registration & Cost */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration & Cost</Text>

          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>Registration Required</Text>
            <Switch
              value={formData.registrationRequired}
              onValueChange={(value) => setFormData({ ...formData, registrationRequired: value })}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={formData.registrationRequired ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          {formData.registrationRequired && (
            <DatePicker
              label="Registration Deadline"
              value={formData.registrationDeadline}
              onDateChange={(date) => setFormData({ ...formData, registrationDeadline: date })}
              placeholder="Select registration deadline"
              required={formData.registrationRequired}
              error={errors.registrationDeadline}
              showTime={false}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cost ($)</Text>
            <TextInput
              style={[styles.input, errors.cost && styles.inputError]}
              value={formData.cost}
              onChangeText={(text) => setFormData({ ...formData, cost: text })}
              placeholder="Enter cost (optional)"
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.cost && <Text style={styles.errorText}>{errors.cost}</Text>}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.textArea, errors.notes && styles.inputError]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Any additional notes or special instructions (optional)"
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 4,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bottomSpacer: {
    height: 40,
  },
});