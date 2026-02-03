import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

const STATUS_CONFIG = {
  checked_in: { label: 'Checked In', bg: Colors.statusPresentBg, color: Colors.statusPresent },
  checked_out: { label: 'Checked Out', bg: Colors.statusGoneBg, color: Colors.statusGone },
  not_checked_in: { label: 'Not Checked In', bg: Colors.statusPendingBg, color: Colors.statusPending },
  pending: { label: 'Pending', bg: Colors.statusPendingBg, color: Colors.statusPending },
  acknowledged: { label: 'Confirmed', bg: Colors.statusPresentBg, color: Colors.statusPresent },
  cancelled: { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>
        {label || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontFamily: 'OpenSans-Medium',
  },
});
