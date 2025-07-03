import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Expense, ExpenseCategory } from '../../../core/models/Expense';
import { useExpenseStore } from '../../../core/stores/ExpenseStore';

interface ExpenseListScreenProps {
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onViewAnalytics: () => void;
  onExportData: () => void;
}

export const ExpenseListScreen: React.FC<ExpenseListScreenProps> = ({
  onAddExpense,
  onEditExpense,
  onViewAnalytics,
  onExportData,
}) => {
  const { expenses, summary, loadExpenses, deleteExpense, error } = useExpenseStore();
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'All'>('All');

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpense(expense.id),
        },
      ]
    );
  };

  const filteredExpenses = filterCategory === 'All' 
    ? expenses 
    : expenses.filter(expense => expense.category === filterCategory);

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseCard}
      onPress={() => onEditExpense(item)}
      onLongPress={() => handleDeleteExpense(item)}
    >
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseDescription}>{item.description}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        {item.subcategory && (
          <Text style={styles.expenseSubcategory}> • {item.subcategory}</Text>
        )}
        <Text style={styles.expenseDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.expenseFooter}>
        {item.vendor && (
          <Text style={styles.expenseVendor}>📍 {item.vendor}</Text>
        )}
        {item.isDeductible && (
          <View style={styles.deductibleBadge}>
            <Text style={styles.deductibleText}>💰 Tax Deductible</Text>
          </View>
        )}
      </View>
      
      {item.aetCategory && (
        <View style={styles.aetBadge}>
          <Text style={styles.aetText}>🎓 AET: {item.aetCategory}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>💰 Expense Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Expenses:</Text>
        <Text style={styles.summaryValue}>
          ${summary?.totalExpenses.toFixed(2) || '0.00'}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tax Deductible:</Text>
        <Text style={[styles.summaryValue, styles.deductibleAmount]}>
          ${summary?.totalDeductible.toFixed(2) || '0.00'}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>This Month:</Text>
        <Text style={styles.summaryValue}>
          ${summary?.monthlyTrend[summary.monthlyTrend.length - 1]?.total.toFixed(2) || '0.00'}
        </Text>
      </View>
      
      <View style={styles.summaryActions}>
        <TouchableOpacity style={styles.analyticsButton} onPress={onViewAnalytics}>
          <Text style={styles.analyticsButtonText}>📊 View Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton} onPress={onExportData}>
          <Text style={styles.exportButtonText}>📤 Export Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterButtons = () => {
    const categories: Array<ExpenseCategory | 'All'> = [
      'All', 'Feed', 'Veterinary', 'Supplies', 'Equipment', 'Transportation'
    ];

    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Category:</Text>
        <View style={styles.filterButtons}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                filterCategory === category && styles.activeFilterButton,
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterCategory === category && styles.activeFilterButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>📝 No Expenses Recorded</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your livestock project expenses for better financial management
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onAddExpense}>
        <Text style={styles.emptyButtonText}>Add First Expense</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Expense Tracker</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddExpense}>
          <Text style={styles.addButtonText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <FlatList
        data={sortedExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseItem}
        ListHeaderComponent={
          <>
            {summary && renderSummaryCard()}
            {expenses.length > 0 && renderFilterButtons()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deductibleAmount: {
    color: '#28a745',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  analyticsButton: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  analyticsButtonText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#28a745',
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  expenseSubcategory: {
    fontSize: 14,
    color: '#666',
  },
  expenseDate: {
    fontSize: 14,
    color: '#999',
    marginLeft: 'auto',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseVendor: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  deductibleBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deductibleText: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '600',
  },
  aetBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  aetText: {
    fontSize: 11,
    color: '#856404',
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