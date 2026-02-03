import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { portalAPI } from '../../services/api';
import EmptyState from '../../components/EmptyState';
import Colors from '../../constants/colors';

export default function MessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await portalAPI.getNotifications();
      setMessages(res.data?.data?.notifications || []);
    } catch (err) {
      // Notifications endpoint may not exist yet — show empty state
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const handleRead = async (id) => {
    try {
      await portalAPI.markNotificationRead(id);
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, readAt: new Date().toISOString() } : m)
      );
    } catch {
      // Silent fail
    }
  };

  const toggleExpand = (id) => {
    const isExpanding = expandedId !== id;
    setExpandedId(isExpanding ? id : null);
    if (isExpanding) {
      const msg = messages.find(m => m.id === id);
      if (msg && !msg.readAt) handleRead(id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderMessage = ({ item }) => {
    const isRead = !!item.readAt;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, !isRead && styles.cardUnread]}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={item.notificationType === 'alert' ? 'alert-circle' : 'mail'}
              size={20}
              color={!isRead ? Colors.peach : Colors.gray400}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, !isRead && styles.titleUnread]}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatDate(item.sentAt || item.createdAt)}</Text>
          </View>
          {!isRead && <View style={styles.unreadDot} />}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.gray400}
          />
        </View>
        {isExpanded && (
          <View style={styles.body}>
            <Text style={styles.bodyText}>{item.message}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
      ListEmptyComponent={
        loading ? null : (
          <EmptyState
            icon="💬"
            title="No messages yet"
            message="Notifications from the learning center will appear here."
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  listContent: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.peach,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  title: {
    fontSize: 15,
    fontFamily: 'OpenSans-Regular',
    color: Colors.charcoal,
  },
  titleUnread: {
    fontFamily: 'OpenSans-SemiBold',
  },
  time: {
    fontSize: 12,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray500,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.peach,
  },

  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'OpenSans-Regular',
    color: Colors.gray600,
    lineHeight: 22,
  },
});
