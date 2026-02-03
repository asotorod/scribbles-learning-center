import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>😕</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: Colors.cream,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray600,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'OpenSans-SemiBold',
  },
});
