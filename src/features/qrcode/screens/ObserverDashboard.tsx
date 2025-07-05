import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { ObserverDashboardData } from '../../../core/models/QRCode';
import { qrCodeService } from '../../../core/services/QRCodeService';

interface ObserverDashboardProps {
  dashboardData: ObserverDashboardData;
  onBack: () => void;
}

export const ObserverDashboard: React.FC<ObserverDashboardProps> = ({
  dashboardData: initialData,
  onBack,
}) => {
  const [dashboardData, setDashboardData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleRefresh = async () => {
    // In a real implementation, you'd refresh the data here
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderStudentHeader = () => (
    <View style={styles.studentHeader}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{dashboardData.student.studentName}</Text>
        <Text style={styles.projectName}>{dashboardData.student.projectName}</Text>
        <Text style={styles.schoolInfo}>
          {dashboardData.student.school} • {dashboardData.student.chapter}
        </Text>
      </View>
      <View style={styles.projectStats}>
        <View style={styles.projectStat}>
          <Text style={styles.projectStatValue}>{dashboardData.student.totalAnimals}</Text>
          <Text style={styles.projectStatLabel}>Animals</Text>
        </View>
        <View style={styles.projectStat}>
          <Text style={styles.projectStatValue}>{Math.round(dashboardData.student.totalHours / 60)}h</Text>
          <Text style={styles.projectStatLabel}>Hours</Text>
        </View>
      </View>
    </View>
  );

  const renderProjectOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📊 Project Overview</Text>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>📅</Text>
          <Text style={styles.overviewLabel}>Started</Text>
          <Text style={styles.overviewValue}>
            {formatDate(dashboardData.student.projectStartDate)}
          </Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>⏰</Text>
          <Text style={styles.overviewLabel}>Last Active</Text>
          <Text style={styles.overviewValue}>
            {formatDate(dashboardData.student.lastActivity)}
          </Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewIcon}>🏆</Text>
          <Text style={styles.overviewLabel}>Achievements</Text>
          <Text style={styles.overviewValue}>
            {dashboardData.student.achievements.length}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAnimals = () => {
    if (!dashboardData.animals || dashboardData.animals.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐄 Animals</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyText}>No animals in this project yet</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🐄 Animals ({dashboardData.animals.length})</Text>
        <View style={styles.animalsList}>
          {dashboardData.animals.map((animal) => (
            <View key={animal.id} style={styles.animalCard}>
              <View style={styles.animalHeader}>
                <Text style={styles.animalName}>{animal.name}</Text>
                <View style={[
                  styles.healthBadge,
                  { backgroundColor: animal.healthStatus === 'Healthy' ? '#28a745' : '#ffc107' }
                ]}>
                  <Text style={styles.healthBadgeText}>{animal.healthStatus}</Text>
                </View>
              </View>
              <Text style={styles.animalDetails}>
                {animal.breed} • {animal.species}
                {animal.age && ` • ${animal.age} months old`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecentJournal = () => {
    if (!dashboardData.recentJournalEntries || dashboardData.recentJournalEntries.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Recent Activities</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📔</Text>
            <Text style={styles.emptyText}>No journal entries yet</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Recent Activities</Text>
        <View style={styles.journalList}>
          {dashboardData.recentJournalEntries.map((entry) => (
            <View key={entry.id} style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalTitle}>{entry.title}</Text>
                <Text style={styles.journalDate}>{formatDate(entry.date)}</Text>
              </View>
              <View style={styles.journalMetrics}>
                <View style={styles.journalMetric}>
                  <Text style={styles.journalMetricIcon}>⏱️</Text>
                  <Text style={styles.journalMetricText}>{entry.hoursWorked}h</Text>
                </View>
                {entry.aetCategories.length > 0 && (
                  <View style={styles.journalMetric}>
                    <Text style={styles.journalMetricIcon}>🎯</Text>
                    <Text style={styles.journalMetricText}>
                      {entry.aetCategories.length} skills
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFinancials = () => {
    if (!dashboardData.financialSummary) {
      return null;
    }

    const { financialSummary } = dashboardData;
    const profitColor = financialSummary.profitLoss >= 0 ? '#28a745' : '#dc3545';

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Financial Summary</Text>
        <View style={styles.financialGrid}>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Total Expenses</Text>
            <Text style={[styles.financialValue, { color: '#dc3545' }]}>
              {formatCurrency(financialSummary.totalExpenses)}
            </Text>
          </View>
          <View style={styles.financialCard}>
            <Text style={styles.financialLabel}>Total Revenue</Text>
            <Text style={[styles.financialValue, { color: '#28a745' }]}>
              {formatCurrency(financialSummary.totalRevenue)}
            </Text>
          </View>
          <View style={[styles.financialCard, styles.financialCardWide]}>
            <Text style={styles.financialLabel}>Net Profit/Loss</Text>
            <Text style={[styles.financialValue, { color: profitColor }]}>
              {formatCurrency(financialSummary.profitLoss)}
            </Text>
          </View>
        </View>
        
        {financialSummary.topExpenseCategories.length > 0 && (
          <View style={styles.expenseCategories}>
            <Text style={styles.expenseCategoriesTitle}>Top Expense Categories:</Text>
            <View style={styles.categoryTags}>
              {financialSummary.topExpenseCategories.map((category) => (
                <View key={category} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderHealthAlerts = () => {
    if (!dashboardData.healthAlerts || dashboardData.healthAlerts.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏥 Health Status</Text>
          <View style={styles.healthGoodState}>
            <Text style={styles.healthGoodIcon}>✅</Text>
            <Text style={styles.healthGoodText}>All animals are healthy!</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏥 Health Alerts</Text>
        <View style={styles.alertsList}>
          {dashboardData.healthAlerts.map((alert, index) => (
            <View key={index} style={[
              styles.alertCard,
              { borderLeftColor: alert.alertType === 'urgent' ? '#dc3545' : 
                               alert.alertType === 'warning' ? '#ffc107' : '#17a2b8' }
            ]}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertAnimal}>{alert.animalName}</Text>
                <Text style={styles.alertDate}>{formatDate(alert.date)}</Text>
              </View>
              <Text style={styles.alertDescription}>{alert.description}</Text>
              <View style={[
                styles.alertBadge,
                { backgroundColor: alert.alertType === 'urgent' ? '#dc3545' : 
                                 alert.alertType === 'warning' ? '#ffc107' : '#17a2b8' }
              ]}>
                <Text style={styles.alertBadgeText}>
                  {alert.alertType.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMilestones = () => {
    if (!dashboardData.milestones || dashboardData.milestones.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Recent Milestones</Text>
        <View style={styles.milestonesList}>
          {dashboardData.milestones.map((milestone) => (
            <View key={milestone.id} style={styles.milestoneCard}>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDate}>
                  {formatDate(milestone.achievedDate)}
                </Text>
              </View>
              <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              <View style={styles.milestoneCategory}>
                <Text style={styles.milestoneCategoryText}>{milestone.category}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Observer View</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderStudentHeader()}
        {renderProjectOverview()}
        {renderAnimals()}
        {renderRecentJournal()}
        {renderFinancials()}
        {renderHealthAlerts()}
        {renderMilestones()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 You have observer access to this FFA project. Data is view-only and updated in real-time.
          </Text>
        </View>
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
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  studentHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  schoolInfo: {
    fontSize: 14,
    color: '#666',
  },
  projectStats: {
    flexDirection: 'row',
    gap: 16,
  },
  projectStat: {
    alignItems: 'center',
  },
  projectStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  projectStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  animalsList: {
    gap: 12,
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
  },
  journalList: {
    gap: 12,
  },
  journalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  journalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  journalDate: {
    fontSize: 12,
    color: '#666',
  },
  journalMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  journalMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  journalMetricIcon: {
    fontSize: 14,
  },
  journalMetricText: {
    fontSize: 12,
    color: '#666',
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  financialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  financialCardWide: {
    minWidth: '100%',
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseCategories: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseCategoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  healthGoodState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  healthGoodIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  healthGoodText: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '500',
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertAnimal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  alertDate: {
    fontSize: 12,
    color: '#666',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  milestonesList: {
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#666',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  milestoneCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  milestoneCategoryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});