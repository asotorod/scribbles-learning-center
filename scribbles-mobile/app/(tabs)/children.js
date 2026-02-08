import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { portalAPI } from '../../services/api';
import PhotoAvatar from '../../components/PhotoAvatar';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import PhotoConsentModal from '../../components/PhotoConsentModal';
import Colors from '../../constants/colors';

export default function ChildrenScreen() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [consentModalVisible, setConsentModalVisible] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [pendingPhotoChild, setPendingPhotoChild] = useState(null);

  const fetchChildren = useCallback(async () => {
    try {
      setError(null);
      const res = await portalAPI.getMyChildren();
      setChildren(res.data?.data?.children || []);
    } catch (err) {
      setError('Unable to load children.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChildren();
    setRefreshing(false);
  };

  const handlePhotoPress = (child) => {
    // Check if consent has been given
    if (!child.photoConsentGiven) {
      // Show consent modal
      setPendingPhotoChild(child);
      setConsentModalVisible(true);
    } else {
      // Consent already given, proceed to image picker
      launchImagePicker(child.id);
    }
  };

  const handleConsentAgree = async () => {
    if (!pendingPhotoChild) return;

    setConsentLoading(true);
    try {
      // Record consent via API
      await portalAPI.givePhotoConsent(pendingPhotoChild.id);

      // Update local state
      setChildren(prev =>
        prev.map(c => c.id === pendingPhotoChild.id
          ? { ...c, photoConsentGiven: true, photoConsentDate: new Date().toISOString() }
          : c
        )
      );

      // Close modal
      setConsentModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Launch image picker after consent
      const childId = pendingPhotoChild.id;
      setPendingPhotoChild(null);
      launchImagePicker(childId);
    } catch (err) {
      Alert.alert('Error', 'Failed to record consent. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleConsentClose = () => {
    setConsentModalVisible(false);
    setPendingPhotoChild(null);
  };

  const launchImagePicker = async (childId) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingId(childId);

      const response = await portalAPI.uploadChildPhoto(childId, {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || 'photo.jpg',
      });

      const newUrl = response.data?.data?.photoUrl;
      if (newUrl) {
        setChildren(prev =>
          prev.map(c => c.id === childId ? { ...c, photoUrl: newUrl } : c)
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUploadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} years old`;
  };

  const renderChild = ({ item: child }) => {
    const isExpanded = expandedId === child.id;
    const isUploading = uploadingId === child.id;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => handlePhotoPress(child)}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={[styles.avatarPlaceholder, { width: 64, height: 64, borderRadius: 32 }]}>
                <ActivityIndicator color={Colors.white} />
              </View>
            ) : (
              <PhotoAvatar photoUrl={child.photoUrl} firstName={child.firstName} size={64} />
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
            <Text style={styles.childProgram}>{child.programName}</Text>
            {child.photoConsentGiven && child.photoConsentDate && (
              <Text style={styles.consentStatus}>
                Photo consent given on {formatDate(child.photoConsentDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            <Text style={styles.infoValue}>{formatDate(child.dateOfBirth)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{calculateAge(child.dateOfBirth)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Enrolled Since</Text>
            <Text style={styles.infoValue}>{formatDate(child.enrollmentDate)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <StatusBadge status={child.status || 'not_checked_in'} />
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expanded}>
            {(child.emergencyContactName || child.emergencyContactPhone) && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Emergency Contact</Text>
                <View style={styles.detailBox}>
                  <Text style={styles.detailName}>{child.emergencyContactName || 'N/A'}</Text>
                  {child.emergencyContactPhone && (
                    <Text style={styles.detailPhone}>{child.emergencyContactPhone}</Text>
                  )}
                </View>
              </View>
            )}
            {child.allergies && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Allergies</Text>
                <Text style={styles.detailText}>{child.allergies}</Text>
              </View>
            )}
            {child.medicalNotes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Medical Notes</Text>
                <Text style={styles.detailText}>{child.medicalNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Expand Toggle */}
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => {
            setExpandedId(isExpanded ? null : child.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={styles.expandText}>
            {isExpanded ? 'Show Less' : 'Show More Details'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchChildren} />;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={renderChild}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />

      <PhotoConsentModal
        visible={consentModalVisible}
        onClose={handleConsentClose}
        onAgree={handleConsentAgree}
        childName={pendingPhotoChild ? `${pendingPhotoChild.firstName} ${pendingPhotoChild.lastName}` : ''}
        loading={consentLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  list: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: Colors.primary,
  },
  avatarWrap: { position: 'relative' },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.peach,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerInfo: { flex: 1 },
  childName: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.white,
  },
  childProgram: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  consentStatus: {
    fontSize: 11,
    fontFamily: 'OpenSans-Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  infoItem: { width: '45%', gap: 4 },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'OpenSans-Medium',
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.charcoal,
  },

  expanded: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: 16,
  },
  detailSection: { marginBottom: 16 },
  detailTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailBox: {
    backgroundColor: Colors.cream,
    padding: 12,
    borderRadius: 8,
  },
  detailName: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.charcoal,
  },
  detailPhone: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.primary,
    marginTop: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray600,
    backgroundColor: Colors.cream,
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },

  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    marginHorizontal: 20,
  },
  expandText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.primary,
  },
});
