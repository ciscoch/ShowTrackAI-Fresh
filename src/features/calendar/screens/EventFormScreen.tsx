/**
 * EventFormScreen - Add/Edit Calendar Events
 * 
 * Comprehensive form for creating and editing calendar events
 * with FFA-specific features and validation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { Event, CreateEventRequest, EVENT_TYPES, PRIORITY_LEVELS } from '../../../core/models/Event';
import { calendarService } from '../../../core/services/CalendarService';
import { useProfileStore } from '../../../core/stores/ProfileStore';
import { useAnalytics } from '../../../core/hooks/useAnalytics';
import { FormPicker } from '../../../shared/components/FormPicker';
import { DatePicker } from '../../../shared/components/DatePicker';

interface EventFormScreenProps {
  onSave: () => void;
  onCancel: () => void;
  event?: Event; // If provided, we're editing; otherwise, creating
}

export const EventFormScreen: React.FC<EventFormScreenProps> = ({
  onSave,
  onCancel,
  event,
}) => {
  const { currentProfile } = useProfileStore();
  const isEditing = !!event;

  // Analytics
  const { trackFeatureUsage, trackError } = useAnalytics({
    autoTrackScreenView: true,
    screenName: isEditing ? 'EditEventScreen' : 'AddEventScreen',
  });

  // Form state
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || new Date(),
    endDate: event?.endDate || undefined,
    location: event?.location || '',
    eventType: event?.eventType || 'other' as Event['eventType'],
    priority: event?.priority || 'medium' as Event['priority'],
    isAllDay: event?.isAllDay ?? true,
    organizerName: event?.organizerName || '',
    organizerContact: event?.organizerContact || '',
    registrationRequired: event?.registrationRequired ?? false,
    registrationDeadline: event?.registrationDeadline || undefined,
    cost: event?.cost?.toString() || '',
    notes: event?.notes || '',
    isCountyShow: event?.isCountyShow ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    }

    if (formData.endDate && formData.endDate < formData.date) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.registrationRequired && !formData.registrationDeadline) {
      newErrors.registrationDeadline = 'Registration deadline is required when registration is required';
    }

    if (formData.registrationDeadline && formData.registrationDeadline > formData.date) {
      newErrors.registrationDeadline = 'Registration deadline must be before event date';
    }

    if (formData.cost && (isNaN(Number(formData.cost)) || Number(formData.cost) < 0)) {
      newErrors.cost = 'Cost must be a valid positive number';
    }

    if (formData.organizerContact && formData.organizerContact.length > 0) {
      // Basic email or phone validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!emailRegex.test(formData.organizerContact) && !phoneRegex.test(formData.organizerContact.replace(/[-\s\(\)]/g, ''))) {
        newErrors.organizerContact = 'Please enter a valid email or phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm() || !currentProfile) {
      trackFeatureUsage('calendar', {
        action: 'form_validation_failed',
        is_editing: isEditing,
        event_type: formData.eventType,
      });
      return;
    }

    setIsLoading(true);

    try {
      const eventData: CreateEventRequest = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date,
        endDate: formData.endDate,
        location: formData.location.trim() || undefined,
        eventType: formData.eventType,
        priority: formData.priority,
        isAllDay: formData.isAllDay,
        organizerName: formData.organizerName.trim() || undefined,
        organizerContact: formData.organizerContact.trim() || undefined,
        registrationRequired: formData.registrationRequired,
        registrationDeadline: formData.registrationDeadline,
        cost: formData.cost ? Number(formData.cost) : undefined,
        notes: formData.notes.trim() || undefined,
        userId: currentProfile.id,
        isCountyShow: formData.isCountyShow,
        reminders: [],
        attendees: [],
      };

      if (isEditing && event) {
        await calendarService.updateEvent(event.id, eventData);
        trackFeatureUsage('calendar', {
          action: 'event_updated',
          event_type: formData.eventType,
          event_priority: formData.priority,
          is_county_show: formData.isCountyShow,
          has_registration: formData.registrationRequired,
        });
      } else {
        await calendarService.addEvent(eventData);
        trackFeatureUsage('calendar', {
          action: 'event_created',
          event_type: formData.eventType,
          event_priority: formData.priority,
          is_county_show: formData.isCountyShow,
          has_registration: formData.registrationRequired,
        });
      }

      Alert.alert(
        'Success',
        `Event ${isEditing ? 'updated' : 'created'} successfully!`,
        [{ text: 'OK', onPress: onSave }]
      );
    } catch (error) {
      console.error('Failed to save event:', error);
      trackError(error as Error, {
        feature: 'calendar',
        userAction: isEditing ? 'update_event' : 'create_event',
        eventType: formData.eventType,
      });
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} event. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    trackFeatureUsage('calendar', {
      action: 'form_cancelled',
      is_editing: isEditing,
      has_changes: JSON.stringify(formData) !== JSON.stringify({
        title: event?.title || '',
        description: event?.description || '',
        // ... other initial values
      }),
    });
    onCancel();
  };

  // Form field update helper
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getEventTypeIcon = (eventType: Event['eventType']): string => {
    const typeData = EVENT_TYPES.find(t => t.value === eventType);
    return typeData?.icon || '📅';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isEditing ? '✏️ Edit Event' : '📅 New Event'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Basic Information</Text>
          
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              placeholder="Enter event title"
              returnKeyType="next"
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Add event description..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Event Type */}
          <FormPicker
            label="Event Type"
            value={formData.eventType}
            onValueChange={(value) => updateField('eventType', value)}
            options={EVENT_TYPES.map(type => ({
              label: `${type.icon} ${type.label}`,
              value: type.value,
            }))}
            placeholder="Select event type"
            error={errors.eventType}
            required
          />

          {/* Priority */}
          <FormPicker
            label="Priority"
            value={formData.priority}
            onValueChange={(value) => updateField('priority', value)}
            options={PRIORITY_LEVELS.map(priority => ({
              label: priority.label,
              value: priority.value,
            }))}
            placeholder="Select priority"
            error={errors.priority}
            required
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Date & Time</Text>

          {/* All Day Toggle */}
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>All Day Event</Text>
            <Switch
              value={formData.isAllDay}
              onValueChange={(value) => updateField('isAllDay', value)}
              trackColor={{ false: '#ccc', true: '#667eea' }}
              thumbColor={formData.isAllDay ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Start Date */}
          <DatePicker
            label="Event Date"
            value={formData.date}
            onDateChange={(date) => updateField('date', date || new Date())}
            placeholder="Select event date"
            error={errors.date}
            required
            mode={formData.isAllDay ? 'date' : 'datetime'}
          />

          {/* End Date (optional) */}
          <DatePicker
            label="End Date (Optional)"
            value={formData.endDate}
            onDateChange={(date) => updateField('endDate', date)}
            placeholder="Select end date"
            error={errors.endDate}
            mode={formData.isAllDay ? 'date' : 'datetime'}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
              placeholder="Enter event location"
              returnKeyType="next"
              maxLength={200}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>
        </View>

        {/* Organizer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Organizer Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organizer Name</Text>
            <TextInput
              style={[styles.input, errors.organizerName && styles.inputError]}
              value={formData.organizerName}
              onChangeText={(text) => updateField('organizerName', text)}
              placeholder="Enter organizer name"
              returnKeyType="next"
              maxLength={100}
            />
            {errors.organizerName && <Text style={styles.errorText}>{errors.organizerName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Info</Text>
            <TextInput
              style={[styles.input, errors.organizerContact && styles.inputError]}
              value={formData.organizerContact}
              onChangeText={(text) => updateField('organizerContact', text)}
              placeholder="Email or phone number"
              keyboardType="email-address"
              returnKeyType="next"
              maxLength={100}
            />
            {errors.organizerContact && <Text style={styles.errorText}>{errors.organizerContact}</Text>}
          </View>
        </View>

        {/* Registration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Registration</Text>

          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>Registration Required</Text>
            <Switch
              value={formData.registrationRequired}
              onValueChange={(value) => updateField('registrationRequired', value)}
              trackColor={{ false: '#ccc', true: '#667eea' }}
              thumbColor={formData.registrationRequired ? '#fff' : '#f4f3f4'}
            />
          </View>

          {formData.registrationRequired && (
            <>
              <DatePicker
                label="Registration Deadline"
                value={formData.registrationDeadline}
                onDateChange={(date) => updateField('registrationDeadline', date)}
                placeholder="Select registration deadline"
                error={errors.registrationDeadline}
                required
                mode="date"
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cost ($)</Text>
                <TextInput
                  style={[styles.input, errors.cost && styles.inputError]}
                  value={formData.cost}
                  onChangeText={(text) => updateField('cost', text)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
                {errors.cost && <Text style={styles.errorText}>{errors.cost}</Text>}
              </View>
            </>
          )}
        </View>

        {/* Special Flags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Special Event Types</Text>

          <View style={styles.switchGroup}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>County Show</Text>
              <Text style={styles.switchDescription}>
                Mark this as your main county livestock show
              </Text>
            </View>
            <Switch
              value={formData.isCountyShow}
              onValueChange={(value) => updateField('isCountyShow', value)}
              trackColor={{ false: '#ccc', true: '#ffc107' }}
              thumbColor={formData.isCountyShow ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Additional Notes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.textArea, errors.notes && styles.inputError]}
              value={formData.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
            {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
          </View>
        </View>

        {/* Event Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>👀 Event Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewIcon}>{getEventTypeIcon(formData.eventType)}</Text>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>
                  {formData.title || 'Event Title'}
                </Text>
                <Text style={styles.previewDate}>
                  {formData.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {!formData.isAllDay && ` at ${formData.date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`}
                </Text>
              </View>
              <View style={[styles.previewPriority, { 
                backgroundColor: PRIORITY_LEVELS.find(p => p.value === formData.priority)?.color || '#ccc' 
              }]} />
            </View>
            {formData.location && (
              <Text style={styles.previewLocation}>📍 {formData.location}</Text>
            )}
            {formData.isCountyShow && (
              <View style={styles.previewCountyShowBadge}>
                <Text style={styles.previewCountyShowText}>🏆 County Show</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#667eea',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 80,
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 4,
    fontWeight: '500',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  switchDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  previewSection: {
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 2,
  },
  previewDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  previewPriority: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewLocation: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginBottom: 8,
  },
  previewCountyShowBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  previewCountyShowText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
});