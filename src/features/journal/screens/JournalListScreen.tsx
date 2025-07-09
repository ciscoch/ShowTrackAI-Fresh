import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Journal } from '../../../core/models/Journal';
import { useJournalStore } from '../../../core/stores/JournalStore';
import { useTimeTrackingStore } from '../../../core/stores/TimeTrackingStore';
import { aetSkillMatcher } from '../../../core/services/AETSkillMatcher';

interface JournalListScreenProps {
  onAddEntry: () => void;
  onViewEntry: (entry: Journal) => void;
  onViewAnalytics: () => void;
  onBack?: () => void;
}

export const JournalListScreen: React.FC<JournalListScreenProps> = ({
  onAddEntry,
  onViewEntry,
  onViewAnalytics,
  onBack,
}) => {
  const { entries, loadEntries, deleteEntry, error } = useJournalStore();
  const { activeEntry, stopTracking } = useTimeTrackingStore();
  const [skillSummary, setSkillSummary] = useState<any>(null);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    // Calculate skill summary when entries change
    if (entries.length > 0) {
      const allSkills = entries.flatMap(entry => entry.aetSkills);
      const summary = aetSkillMatcher.getSkillProgressSummary(allSkills);
      setSkillSummary(summary);
    }
  }, [entries]);

  const handleDeleteEntry = (entry: Journal) => {
    Alert.alert(
      'Delete Journal Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };

  const handleStopTracking = () => {
    if (activeEntry) {
      Alert.alert(
        'Stop Time Tracking',
        'Stop tracking and save this activity?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop & Save',
            onPress: () => stopTracking(activeEntry.id),
          },
        ]
      );
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const renderEntry = ({ item }: { item: Journal }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => onViewEntry(item)}
      onLongPress={() => handleDeleteEntry(item)}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.entryTitle}>{item.title}</Text>
        <Text style={styles.entryDuration}>{formatDuration(item.duration)}</Text>
      </View>
      
      <Text style={styles.entryDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.entryDetails}>
        <Text style={styles.entryCategory}>{item.category}</Text>
        <Text style={styles.entryDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      
      {item.aetSkills.length > 0 && (
        <View style={styles.skillsContainer}>
          <Text style={styles.skillsLabel}>🎓 AET Skills ({item.aetSkills.length}):</Text>
          <View style={styles.skillsBadges}>
            {item.aetSkills.slice(0, 2).map((skillId, index) => {
              const skill = skillId; // Would lookup from database in real implementation
              return (
                <View key={index} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>Skill {index + 1}</Text>
                </View>
              );
            })}
            {item.aetSkills.length > 2 && (
              <View style={styles.skillBadge}>
                <Text style={styles.skillBadgeText}>+{item.aetSkills.length - 2}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderActiveTracker = () => {
    if (!activeEntry) return null;

    const duration = Math.floor((Date.now() - activeEntry.startTime.getTime()) / 60000);

    return (
      <View style={styles.activeTrackerCard}>
        <View style={styles.activeTrackerHeader}>
          <Text style={styles.activeTrackerTitle}>⏱️ Currently Tracking</Text>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTracking}
          >
            <Text style={styles.stopButtonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.activeTrackerActivity}>{activeEntry.activity}</Text>
        <Text style={styles.activeTrackerDuration}>
          Duration: {formatDuration(duration)}
        </Text>
      </View>
    );
  };

  const renderSummaryCard = () => {
    if (!skillSummary || entries.length === 0) return null;

    const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const thisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📈 Journal Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{entries.length}</Text>
            <Text style={styles.summaryLabel}>Total Entries</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.summaryLabel}>Total Time</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{thisWeek}</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{skillSummary.careerReadiness}%</Text>
            <Text style={styles.summaryLabel}>Career Ready</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.analyticsButton} onPress={onViewAnalytics}>
          <Text style={styles.analyticsButtonText}>📊 View Detailed Analytics</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>📓 Start Your Journal</Text>
      <Text style={styles.emptySubtitle}>
        Track your daily activities and develop AET skills for career readiness
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddEntry}>
        <Text style={styles.emptyButtonText}>Create First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>📝 Activity Journal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.addButton} onPress={onAddEntry}>
            <Text style={styles.addButtonText}>+ New Entry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <FlatList
        data={sortedEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={
          <>
            {renderActiveTracker()}
            {renderSummaryCard()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  activeTrackerCard: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  activeTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTrackerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
  },
  stopButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTrackerActivity: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activeTrackerDuration: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  analyticsButton: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  analyticsButtonText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  entryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
  },
  skillsContainer: {
    marginTop: 8,
  },
  skillsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  skillsBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  skillBadgeText: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
});