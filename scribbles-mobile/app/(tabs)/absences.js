import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { portalAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import Colors from '../../constants/colors';

export default function AbsencesScreen() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchAbsences = useCallback(async () => {
    try {
      setError(null);
      const res = await portalAPI.getAbsences();
      const data = res.data?.data?.absences || [];
      setAbsences(data);
    } catch (err) {
      setError('Unable to load absences.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAbsences(); }, [fetchAbsences]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAbsences();
    setRefreshing(false);
  };

  const handleCancel = (absenceId) => {
    Alert.alert(
      'Cancel Absence',
      'Are you sure you want to cancel this absence?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await portalAPI.cancelAbsence(absenceId);
              setAbsences(prev =>
                prev.map(a => a.id === absenceId ? { ...a, status: 'cancelled' } : a)
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to cancel absence.');
            }
          },
        },
      ]
    );
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAbsences = absences.filter((a) => {
    if (a.status === 'cancelled') return false;
    const endDate = a.endDate ? new Date(a.endDate) : new Date(a.startDate);
    return activeTab === 'upcoming' ? endDate >= today : endDate < today;
  });

  const upcomingCount = absences.filter(a => {
    if (a.status === 'cancelled') return false;
    const end = a.endDate ? new Date(a.endDate) : new Date(a.startDate);
    return end >= today;
  }).length;

  const pastCount = absences.filter(a => {
    if (a.status === 'cancelled') return false;
    const end = a.endDate ? new Date(a.endDate) : new Date(a.startDate);
    return end < today;
  }).length;

  const formatDateRange = (start, end) => {
    const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!end || end === start) return s;
    const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${s} - ${e}`;
  };

  const renderAbsence = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{new Date(item.startDate).getDate()}</Text>
        <Text style={styles.dateMonth}>
          {new Date(item.startDate).toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.childName}>{item.childName}</Text>
        <Text style={styles.reason}>{item.reasonName}</Text>
        <Text style={styles.dateRange}>
          📅 {formatDateRange(item.startDate, item.endDate)}
        </Text>
        {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}
      </View>
      <View style={styles.cardActions}>
        <StatusBadge status={item.status} />
        {activeTab === 'upcoming' && item.canEdit !== false && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchAbsences} />;

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          <View style={[styles.tabBadge, activeTab === 'upcoming' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'upcoming' && styles.tabBadgeTextActive]}>
              {upcomingCount}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
          <View style={[styles.tabBadge, activeTab === 'past' && styles.tabBadgeActive]}>
            <Text style={[styles.tabBadgeText, activeTab === 'past' && styles.tabBadgeTextActive]}>
              {pastCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAbsences}
        keyExtractor={(item) => item.id}
        renderItem={renderAbsence}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="📅"
            title={`No ${activeTab} absences`}
            message={activeTab === 'upcoming'
              ? "You haven't reported any upcoming absences."
              : 'No past absences on record.'
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  listContent: { padding: 20, paddingBottom: 40 },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.gray600,
  },
  tabTextActive: { color: Colors.white },
  tabBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: {
    fontSize: 12,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.gray600,
  },
  tabBadgeTextActive: { color: Colors.white },

  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dateBox: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 50,
    alignSelf: 'flex-start',
  },
  dateDay: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    lineHeight: 24,
  },
  dateMonth: {
    fontSize: 11,
    fontFamily: 'OpenSans-Medium',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  info: { flex: 1, gap: 3 },
  childName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  reason: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray600,
  },
  dateRange: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
  },
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: 'OpenSans-Medium',
    color: Colors.error,
  },
});
