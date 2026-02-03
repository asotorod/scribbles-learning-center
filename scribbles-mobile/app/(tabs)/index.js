import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { portalAPI } from '../../services/api';
import PhotoAvatar from '../../components/PhotoAvatar';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import Colors from '../../constants/colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [childrenRes, absencesRes] = await Promise.all([
        portalAPI.getMyChildren().catch(() => null),
        portalAPI.getAbsences({ upcoming: 'true' }).catch(() => null),
      ]);

      const childrenData = childrenRes?.data?.data?.children || [];
      setChildren(childrenData);

      const absencesData = absencesRes?.data?.data?.absences || [];
      setAbsences(absencesData.slice(0, 3));
    } catch (err) {
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusText = (child) => {
    const status = child.todayStatus || child.status || 'not_checked_in';
    if (status === 'checked_in') return 'Checked in';
    if (status === 'checked_out') return 'Checked out';
    return 'Not checked in';
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const firstName = user?.firstName || user?.first_name || 'there';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{getGreeting()}, {firstName}!</Text>
        <Text style={styles.greetingSub}>Here's what's happening today.</Text>
      </View>

      {/* Children Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Status</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/children')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {children.map((child) => (
          <View key={child.id} style={styles.childCard}>
            <PhotoAvatar
              photoUrl={child.photoUrl}
              firstName={child.firstName}
              size={52}
            />
            <View style={styles.childInfo}>
              <Text style={styles.childName}>
                {child.firstName} {child.lastName}
              </Text>
              <Text style={styles.childProgram}>{child.programName}</Text>
              <StatusBadge status={child.todayStatus || child.status || 'not_checked_in'} />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionPrimary]}
            onPress={() => router.push('/(tabs)/report-absence')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={[styles.actionLabel, { color: Colors.white }]}>Report Absence</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/absences')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Absence History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/children')}
          >
            <Text style={styles.actionIcon}>👶</Text>
            <Text style={styles.actionLabel}>My Children</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/account')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>My Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Absences */}
      {absences.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Absences</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/absences')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {absences.map((absence) => (
            <View key={absence.id} style={styles.absenceCard}>
              <View style={styles.absenceDate}>
                <Text style={styles.absenceDay}>
                  {new Date(absence.startDate).getDate()}
                </Text>
                <Text style={styles.absenceMonth}>
                  {new Date(absence.startDate).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.absenceInfo}>
                <Text style={styles.absenceChild}>{absence.childName}</Text>
                <Text style={styles.absenceReason}>{absence.reasonName}</Text>
              </View>
              <StatusBadge status={absence.status} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },

  greeting: { marginBottom: 24 },
  greetingText: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: Colors.charcoal,
  },
  greetingSub: {
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    marginTop: 2,
  },

  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  sectionLink: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.primary,
  },

  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  childInfo: { flex: 1, gap: 4 },
  childName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  childProgram: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionPrimary: {
    backgroundColor: Colors.peach,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: {
    fontSize: 13,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.charcoal,
    textAlign: 'center',
  },

  absenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  absenceDate: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 50,
  },
  absenceDay: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
    lineHeight: 24,
  },
  absenceMonth: {
    fontSize: 11,
    fontFamily: 'OpenSans-Medium',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  absenceInfo: { flex: 1, gap: 2 },
  absenceChild: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  absenceReason: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
  },
});
