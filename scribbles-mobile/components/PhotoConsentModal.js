import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '../constants/colors';

const PhotoConsentModal = ({ visible, onClose, onAgree, childName, loading }) => {
  const [agreed, setAgreed] = useState(false);

  const handleToggleAgreed = () => {
    setAgreed(!agreed);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAgree = () => {
    if (agreed && !loading) {
      onAgree();
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Photo Upload Consent</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
            <Ionicons name="close" size={24} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
          <Text style={styles.intro}>
            By uploading a photo of your child, you acknowledge and agree to the following:
          </Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                This photo will be used to help our staff identify your child during check-in,
                check-out, and daily activities.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <View style={styles.bulletContent}>
                <Text style={styles.bulletText}>
                  The photo will be securely stored and only visible to:
                </Text>
                <View style={styles.subList}>
                  <Text style={styles.subBulletText}>
                    {'\u2022'} You and linked family members
                  </Text>
                  <Text style={styles.subBulletText}>
                    {'\u2022'} Authorized Scribbles Learning Center staff
                  </Text>
                  <Text style={styles.subBulletText}>
                    {'\u2022'} Authorized pickup persons you have designated
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                The photo will <Text style={styles.bold}>NOT</Text> be shared publicly or with any third parties.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                You may delete this photo at any time through your account settings.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>
                Upon disenrollment, your child's photo will be permanently deleted within 30 days.
              </Text>
            </View>
          </View>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={handleToggleAgreed}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={16} color={Colors.white} />}
            </View>
            <Text style={styles.checkboxText}>
              I am the parent or legal guardian of {childName || 'this child'} and I consent to
              uploading and storing this photo for identification purposes.
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.agreeBtn, (!agreed || loading) && styles.agreeBtnDisabled]}
            onPress={handleAgree}
            disabled={!agreed || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.agreeText}>I Agree & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray700,
    lineHeight: 24,
    marginBottom: 20,
  },
  bulletList: {
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  bulletContent: {
    flex: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray600,
    lineHeight: 22,
  },
  bold: {
    fontFamily: 'OpenSans-Bold',
  },
  subList: {
    marginTop: 8,
    marginLeft: 8,
  },
  subBulletText: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    lineHeight: 20,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray300,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    color: Colors.gray700,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34, // Account for home indicator
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.gray600,
  },
  agreeBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeBtnDisabled: {
    backgroundColor: Colors.gray300,
  },
  agreeText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.white,
  },
});

export default PhotoConsentModal;
