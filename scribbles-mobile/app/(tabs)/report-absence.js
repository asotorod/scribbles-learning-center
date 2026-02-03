import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { portalAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Colors from '../../constants/colors';

export default function ReportAbsenceScreen() {
  const router = useRouter();
  const [children, setChildren] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [selectedChildId, setSelectedChildId] = useState(null);
  const [dateType, setDateType] = useState('single');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedReasonId, setSelectedReasonId] = useState(null);
  const [notes, setNotes] = useState('');
  const [returnDate, setReturnDate] = useState(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [childrenRes, reasonsRes] = await Promise.all([
        portalAPI.getMyChildren().catch(() => null),
        portalAPI.getAbsenceReasons().catch(() => null),
      ]);

      const c = childrenRes?.data?.data?.children || [];
      setChildren(c);
      if (c.length === 1) setSelectedChildId(c[0].id);

      const r = reasonsRes?.data?.data?.reasons || [];
      setReasons(r);

      if (c.length === 0) setError('Unable to load children. Please try again.');
    } catch {
      setError('Unable to load form data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const handleSubmit = async () => {
    if (!selectedChildId) { setError('Please select a child.'); return; }
    if (!selectedReasonId) { setError('Please select a reason.'); return; }

    const selectedChild = children.find(c => c.id === selectedChildId);
    if (!selectedChild) { setError('Child data unavailable. Please refresh.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const toDateStr = (d) => d.toISOString().split('T')[0];

      await portalAPI.reportAbsence({
        childId: selectedChildId,
        startDate: toDateStr(startDate),
        endDate: dateType === 'multiple' ? toDateStr(endDate) : toDateStr(startDate),
        reasonId: selectedReasonId,
        notes: notes.trim() || undefined,
        expectedReturnDate: returnDate ? toDateStr(returnDate) : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit. Please try again.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (submitted) {
    const child = children.find(c => c.id === selectedChildId);
    const reason = reasons.find(r => r.id === selectedReasonId);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Absence Reported</Text>
          <Text style={styles.successMsg}>We've received your notification.</Text>

          <View style={styles.successDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Child</Text>
              <Text style={styles.detailValue}>{child?.firstName} {child?.lastName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(startDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reason</Text>
              <Text style={styles.detailValue}>{reason?.name || 'Other'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(tabs)/absences')}
          >
            <Text style={styles.primaryBtnText}>View Absences</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setSubmitted(false);
              setSelectedChildId(children.length === 1 ? children[0].id : null);
              setSelectedReasonId(null);
              setNotes('');
              setReturnDate(null);
              setDateType('single');
              setStartDate(new Date());
              setEndDate(new Date());
            }}
          >
            <Text style={styles.secondaryBtnText}>Report Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Select Child */}
      <Text style={styles.sectionLabel}>Select Child *</Text>
      <View style={styles.chipRow}>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[styles.chip, selectedChildId === child.id && styles.chipActive]}
            onPress={() => { setSelectedChildId(child.id); setError(''); }}
          >
            <Text style={[styles.chipText, selectedChildId === child.id && styles.chipTextActive]}>
              {child.firstName} {child.lastName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Type */}
      <Text style={styles.sectionLabel}>Duration</Text>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, dateType === 'single' && styles.toggleActive]}
          onPress={() => setDateType('single')}
        >
          <Text style={[styles.toggleText, dateType === 'single' && styles.toggleTextActive]}>Single Day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, dateType === 'multiple' && styles.toggleActive]}
          onPress={() => setDateType('multiple')}
        >
          <Text style={[styles.toggleText, dateType === 'multiple' && styles.toggleTextActive]}>Multiple Days</Text>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      <Text style={styles.sectionLabel}>{dateType === 'single' ? 'Date *' : 'Start Date *'}</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
        <Ionicons name="calendar-outline" size={18} color={Colors.gray500} />
        <Text style={styles.dateText}>{formatDate(startDate)}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(e, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setStartDate(date);
          }}
        />
      )}

      {dateType === 'multiple' && (
        <>
          <Text style={styles.sectionLabel}>End Date *</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={Colors.gray500} />
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              minimumDate={startDate}
              onChange={(e, date) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
            />
          )}
        </>
      )}

      {/* Reason */}
      <Text style={styles.sectionLabel}>Reason *</Text>
      <View style={styles.chipRow}>
        {reasons.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={[styles.chip, selectedReasonId === reason.id && styles.chipActive]}
            onPress={() => { setSelectedReasonId(reason.id); setError(''); }}
          >
            <Text style={[styles.chipText, selectedReasonId === reason.id && styles.chipTextActive]}>
              {reason.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.sectionLabel}>Notes (Optional)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Any additional details..."
        placeholderTextColor={Colors.gray400}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Return Date */}
      <Text style={styles.sectionLabel}>Expected Return (Optional)</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowReturnPicker(true)}>
        <Ionicons name="calendar-outline" size={18} color={Colors.gray500} />
        <Text style={styles.dateText}>
          {returnDate ? formatDate(returnDate) : 'Select return date'}
        </Text>
      </TouchableOpacity>
      {showReturnPicker && (
        <DateTimePicker
          value={returnDate || new Date()}
          mode="date"
          minimumDate={startDate}
          onChange={(e, date) => {
            setShowReturnPicker(Platform.OS === 'ios');
            if (date) setReturnDate(date);
          }}
        />
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (submitting || children.length === 0) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting || children.length === 0}
      >
        {submitting ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.submitBtnText}>Submit Absence Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 40 },

  errorBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.charcoal,
    marginBottom: 10,
    marginTop: 20,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.charcoal,
  },
  chipTextActive: {
    color: Colors.white,
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.gray500,
  },
  toggleTextActive: {
    color: Colors.charcoal,
  },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.charcoal,
  },

  textArea: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.charcoal,
    minHeight: 80,
  },

  submitBtn: {
    backgroundColor: Colors.peach,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    shadowColor: Colors.peach,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: Colors.white,
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
  },

  // Success screen
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.charcoal,
    marginBottom: 6,
  },
  successMsg: {
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    marginBottom: 24,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.charcoal,
  },
  primaryBtn: {
    backgroundColor: Colors.peach,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: 'OpenSans-Medium',
  },
});
