import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function PhotoAvatar({ photoUrl, firstName, size = 56, style }) {
  const initial = (firstName || '?').charAt(0).toUpperCase();

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: Colors.white,
    fontFamily: 'Poppins-SemiBold',
  },
});
