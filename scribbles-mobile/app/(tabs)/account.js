import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  RefreshControl, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { portalAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Colors from '../../constants/colors';

export default function AccountScreen() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profile, setProfile] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '',
  });

  const [passwords, setPasswords] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });

  const [childContacts, setChildContacts] = useState([]);
  const [savingContactId, setSavingContactId] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await portalAPI.getProfile();
      const data = res.data?.data || {};
      setProfile({
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
      const kids = Array.isArray(data.children) ? data.children : [];
      setChildContacts(kids.map(c => ({
        id: c.id,
        first_name: c.first_name || c.firstName || '',
        last_name: c.last_name || c.lastName || '',
        emergency_contact_name: c.emergency_contact_name || c.emergencyContactName || '',
        emergency_contact_phone: c.emergency_contact_phone || c.emergencyContactPhone || '',
      })));
    } catch {
      setMessage({ type: 'error', text: 'Unable to load profile.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await portalAPI.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profile updated!' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async (childId) => {
    const child = childContacts.find(c => c.id === childId);
    if (!child) return;
    setSavingContactId(childId);
    setMessage({ type: '', text: '' });
    try {
      await portalAPI.updateEmergencyContact(childId, {
        emergency_contact_name: child.emergency_contact_name,
        emergency_contact_phone: child.emergency_contact_phone,
      });
      setMessage({ type: 'success', text: `Contact updated for ${child.first_name}.` });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessage({ type: 'error', text: 'Failed to update contact.' });
    } finally {
      setSavingContactId(null);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (passwords.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await portalAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setMessage({ type: 'success', text: 'Password changed!' });
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {message.text ? (
        <View style={[styles.alert, message.type === 'error' ? styles.alertError : styles.alertSuccess]}>
          <Text style={[styles.alertText, { color: message.type === 'error' ? Colors.error : Colors.statusPresent }]}>
            {message.text}
          </Text>
        </View>
      ) : null}

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} value={profile.first_name}
              onChangeText={v => setProfile(p => ({ ...p, first_name: v }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={styles.input} value={profile.last_name}
              onChangeText={v => setProfile(p => ({ ...p, last_name: v }))} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={profile.email}
            keyboardType="email-address" autoCapitalize="none"
            onChangeText={v => setProfile(p => ({ ...p, email: v }))} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={profile.phone}
            keyboardType="phone-pad"
            onChangeText={v => setProfile(p => ({ ...p, phone: v }))} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} value={profile.address}
            onChangeText={v => setProfile(p => ({ ...p, address: v }))} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={Colors.white} size="small" /> : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts */}
      {childContacts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <Text style={styles.sectionSub}>
            Set an emergency contact for each of your children.
          </Text>

          {childContacts.map((child) => (
            <View key={child.id} style={styles.contactCard}>
              <Text style={styles.contactChildName}>{child.first_name} {child.last_name}</Text>
              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>Contact Name</Text>
                  <TextInput style={styles.input} value={child.emergency_contact_name}
                    placeholder="Name"
                    onChangeText={v => setChildContacts(prev =>
                      prev.map(c => c.id === child.id ? { ...c, emergency_contact_name: v } : c)
                    )} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput style={styles.input} value={child.emergency_contact_phone}
                    keyboardType="phone-pad" placeholder="(201) 555-0123"
                    onChangeText={v => setChildContacts(prev =>
                      prev.map(c => c.id === child.id ? { ...c, emergency_contact_phone: v } : c)
                    )} />
                </View>
              </View>
              <TouchableOpacity
                style={styles.saveContactBtn}
                onPress={() => handleSaveContact(child.id)}
                disabled={savingContactId === child.id}
              >
                <Text style={styles.saveContactText}>
                  {savingContactId === child.id ? 'Saving...' : 'Save Contact'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Change Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput style={styles.input} value={passwords.current_password}
            secureTextEntry autoComplete="current-password"
            onChangeText={v => setPasswords(p => ({ ...p, current_password: v }))} />
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <TextInput style={styles.input} value={passwords.new_password}
              secureTextEntry autoComplete="new-password"
              onChangeText={v => setPasswords(p => ({ ...p, new_password: v }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirm</Text>
            <TextInput style={styles.input} value={passwords.confirm_password}
              secureTextEntry
              onChangeText={v => setPasswords(p => ({ ...p, confirm_password: v }))} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!passwords.current_password || !passwords.new_password) && styles.saveBtnDisabled]}
          onPress={handleChangePassword}
          disabled={!passwords.current_password || !passwords.new_password || saving}
        >
          <Text style={styles.saveBtnText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 60 },

  alert: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  alertSuccess: { backgroundColor: Colors.statusPresentBg },
  alertError: { backgroundColor: Colors.errorLight },
  alertText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Medium',
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    marginBottom: 16,
  },

  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, marginBottom: 16 },
  label: {
    fontSize: 13,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.charcoal,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.charcoal,
    backgroundColor: Colors.white,
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'OpenSans-SemiBold',
  },

  contactCard: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  contactChildName: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
    marginBottom: 12,
  },
  saveContactBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveContactText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'OpenSans-SemiBold',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.error,
  },
});
