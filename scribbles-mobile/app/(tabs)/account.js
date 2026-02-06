import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  RefreshControl, StyleSheet, Alert, ActivityIndicator, Switch, Modal,
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

  const [childrenData, setChildrenData] = useState([]);

  // Form state for add/edit
  const [activeForm, setActiveForm] = useState(null); // { type: 'pickup'|'contact', childId, editId? }
  const [formData, setFormData] = useState({ name: '', relationship: '', phone: '', is_primary: false });
  const [savingForm, setSavingForm] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

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
      const childrenWithData = await Promise.all(
        kids.map(async (child) => {
          const [pickupsRes, contactsRes] = await Promise.all([
            portalAPI.getAuthorizedPickups(child.id).catch(() => ({ data: { data: { pickups: [] } } })),
            portalAPI.getEmergencyContacts(child.id).catch(() => ({ data: { data: { contacts: [] } } })),
          ]);
          return {
            id: child.id,
            firstName: child.first_name || child.firstName || '',
            lastName: child.last_name || child.lastName || '',
            authorizedPickups: pickupsRes?.data?.data?.pickups || [],
            emergencyContacts: contactsRes?.data?.data?.contacts || [],
          };
        })
      );
      setChildrenData(childrenWithData);
    } catch {
      showMsg('error', 'Unable to load profile.');
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

  // === Profile ===
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await portalAPI.updateProfile(profile);
      showMsg('success', 'Profile updated!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showMsg('error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // === Password ===
  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      return showMsg('error', 'Passwords do not match.');
    }
    if (passwords.new_password.length < 8) {
      return showMsg('error', 'Password must be at least 8 characters.');
    }
    setSaving(true);
    try {
      await portalAPI.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      showMsg('success', 'Password changed!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showMsg('error', 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  // === Form helpers ===
  const openAddForm = (type, childId) => {
    setActiveForm({ type, childId, editId: null });
    setFormData({ name: '', relationship: '', phone: '', is_primary: false });
  };

  const openEditForm = (type, childId, item) => {
    setActiveForm({ type, childId, editId: item.id });
    setFormData({
      name: item.name || '',
      relationship: item.relationship || '',
      phone: item.phone || '',
      is_primary: item.isPrimary || false,
    });
  };

  const closeForm = () => {
    setActiveForm(null);
    setFormData({ name: '', relationship: '', phone: '', is_primary: false });
  };

  const handleSaveForm = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      return showMsg('error', 'Name and phone are required.');
    }
    setSavingForm(true);
    try {
      const { type, childId, editId } = activeForm;
      if (type === 'pickup') {
        if (editId) {
          await portalAPI.updateAuthorizedPickup(childId, editId, formData);
        } else {
          await portalAPI.createAuthorizedPickup(childId, formData);
        }
        showMsg('success', editId ? 'Pickup updated!' : 'Pickup added!');
      } else {
        if (editId) {
          await portalAPI.updateEmergencyContactEntry(childId, editId, formData);
        } else {
          await portalAPI.createEmergencyContact(childId, formData);
        }
        showMsg('success', editId ? 'Contact updated!' : 'Contact added!');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeForm();
      await fetchProfile();
    } catch {
      showMsg('error', 'Failed to save.');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDeletePickup = (childId, pickupId, name) => {
    Alert.alert('Remove Pickup', `Remove ${name} from authorized pickups?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await portalAPI.deleteAuthorizedPickup(childId, pickupId);
            showMsg('success', 'Pickup removed.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await fetchProfile();
          } catch { showMsg('error', 'Failed to remove pickup.'); }
        },
      },
    ]);
  };

  const handleDeleteContact = (childId, contactId, name) => {
    Alert.alert('Delete Contact', `Delete ${name} from emergency contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await portalAPI.deleteEmergencyContact(childId, contactId);
            showMsg('success', 'Contact deleted.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await fetchProfile();
          } catch { showMsg('error', 'Failed to delete contact.'); }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setDeleting(true);
    try {
      await portalAPI.deleteAccount(deleteConfirmation);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDeleteModal(false);
      await logout();
    } catch (err) {
      showMsg('error', 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  // === Inline form render ===
  const renderForm = () => {
    if (!activeForm) return null;
    const isContact = activeForm.type === 'contact';
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {activeForm.editId ? 'Edit' : 'Add'} {isContact ? 'Emergency Contact' : 'Authorized Pickup'}
        </Text>
        <View style={styles.field}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={formData.name}
            placeholder="Jane Doe"
            onChangeText={v => setFormData(p => ({ ...p, name: v }))} />
        </View>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Relationship</Text>
            <TextInput style={styles.input} value={formData.relationship}
              placeholder="Aunt"
              onChangeText={v => setFormData(p => ({ ...p, relationship: v }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput style={styles.input} value={formData.phone}
              placeholder="(201) 555-0123" keyboardType="phone-pad"
              onChangeText={v => setFormData(p => ({ ...p, phone: v }))} />
          </View>
        </View>
        {isContact && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Primary contact</Text>
            <Switch value={formData.is_primary}
              onValueChange={v => setFormData(p => ({ ...p, is_primary: v }))}
              trackColor={{ false: Colors.gray300, true: Colors.pistachio }}
              thumbColor={formData.is_primary ? Colors.primary : Colors.gray400} />
          </View>
        )}
        <View style={styles.formActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={closeForm}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, savingForm && styles.saveBtnDisabled]}
            onPress={handleSaveForm} disabled={savingForm}>
            {savingForm ? <ActivityIndicator color={Colors.white} size="small" /> : (
              <Text style={styles.saveBtnText}>
                {activeForm.editId ? 'Update' : 'Add'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
  <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Owl Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      </View>

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
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSaveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} size="small" /> : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts - Per Child */}
      {childrenData.map((child) => (
        <View key={`contacts-${child.id}`} style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts for {child.firstName}</Text>
          <Text style={styles.sectionSub}>Primary contact will be called first.</Text>

          {child.emergencyContacts.length === 0 && (
            <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
          )}

          {child.emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.entryCard}>
              <View style={styles.entryAvatar}>
                <Text style={styles.entryAvatarText}>{contact.name.charAt(0)}</Text>
              </View>
              <View style={styles.entryInfo}>
                <View style={styles.entryNameRow}>
                  <Text style={styles.entryName}>{contact.name}</Text>
                  {contact.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.entryDetails}>
                  {[contact.relationship, contact.phone].filter(Boolean).join(' \u2022 ')}
                </Text>
              </View>
              <View style={styles.entryActions}>
                <TouchableOpacity onPress={() => openEditForm('contact', child.id, contact)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteContact(child.id, contact.id, contact.name)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {activeForm && activeForm.type === 'contact' && activeForm.childId === child.id
            ? renderForm()
            : (
              <TouchableOpacity style={styles.addBtn} onPress={() => openAddForm('contact', child.id)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Emergency Contact</Text>
              </TouchableOpacity>
            )
          }
        </View>
      ))}

      {/* Authorized Pickups - Per Child */}
      {childrenData.map((child) => (
        <View key={`pickups-${child.id}`} style={styles.section}>
          <Text style={styles.sectionTitle}>Authorized Pickups for {child.firstName}</Text>
          <Text style={styles.sectionSub}>People authorized to pick up {child.firstName}.</Text>

          {child.authorizedPickups.length === 0 && (
            <Text style={styles.emptyText}>No authorized pickups added yet.</Text>
          )}

          {child.authorizedPickups.map((pickup) => (
            <View key={pickup.id} style={styles.entryCard}>
              <View style={styles.entryAvatar}>
                <Text style={styles.entryAvatarText}>{pickup.name.charAt(0)}</Text>
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryName}>{pickup.name}</Text>
                <Text style={styles.entryDetails}>
                  {[pickup.relationship, pickup.phone].filter(Boolean).join(' \u2022 ')}
                </Text>
              </View>
              <View style={styles.entryActions}>
                <TouchableOpacity onPress={() => openEditForm('pickup', child.id, pickup)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePickup(child.id, pickup.id, pickup.name)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {activeForm && activeForm.type === 'pickup' && activeForm.childId === child.id
            ? renderForm()
            : (
              <TouchableOpacity style={styles.addBtn} onPress={() => openAddForm('pickup', child.id)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Authorized Pickup</Text>
              </TouchableOpacity>
            )
          }
        </View>
      ))}

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

      {/* Delete Account */}
      <TouchableOpacity style={styles.deleteAccountBtn} onPress={() => { setDeleteConfirmation(''); setShowDeleteModal(true); }}>
        <Ionicons name="trash-outline" size={20} color={Colors.error} />
        <Text style={styles.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Delete Account Modal */}
    <Modal visible={showDeleteModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Delete Your Account?</Text>
          <Text style={styles.modalBody}>
            This will permanently delete your account, profile data, children linked only to you, and all associated information.
          </Text>
          <Text style={[styles.modalBody, { fontWeight: '700', color: Colors.charcoal }]}>
            This action cannot be undone.
          </Text>
          <Text style={styles.modalLabel}>Type DELETE to confirm:</Text>
          <TextInput
            style={styles.modalInput}
            value={deleteConfirmation}
            onChangeText={setDeleteConfirmation}
            placeholder="DELETE"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalDeleteBtn, deleteConfirmation !== 'DELETE' && styles.saveBtnDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || deleting}
            >
              {deleting
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.modalDeleteText}>Delete Account</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 20, paddingBottom: 60 },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },

  alert: { borderRadius: 10, padding: 12, marginBottom: 16 },
  alertSuccess: { backgroundColor: Colors.statusPresentBg },
  alertError: { backgroundColor: Colors.errorLight },
  alertText: { fontSize: 14, fontFamily: 'OpenSans-Medium', textAlign: 'center' },

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

  // Entry cards (pickups & contacts)
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  entryAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.pistachio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarText: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  entryInfo: { flex: 1 },
  entryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryName: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
  },
  entryDetails: {
    fontSize: 13,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    marginTop: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },

  primaryBadge: {
    backgroundColor: Colors.peach,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.white,
  },

  emptyText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    fontStyle: 'italic',
    marginBottom: 8,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.gray300,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.gray500,
  },

  // Inline form
  formContainer: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  formTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.charcoal,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.charcoal,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.gray600,
  },

  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 10,
  },
  deleteAccountText: {
    fontSize: 16,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.error,
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

  // Delete account modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.error,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray600,
    marginBottom: 12,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.charcoal,
    marginBottom: 8,
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'OpenSans-Regular',
    color: Colors.charcoal,
    letterSpacing: 2,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
    color: Colors.gray600,
  },
  modalDeleteBtn: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'OpenSans-SemiBold',
  },
});
