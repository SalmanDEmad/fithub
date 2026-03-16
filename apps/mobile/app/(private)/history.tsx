import { queryKeys } from '@fithub/api-client';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera } from 'lucide-react-native';
import { useAuth } from '../../lib/auth-context';
import { fetchHistoryData } from '../../lib/member-data';

export default function HistoryScreen() {
  const { user } = useAuth();
  const historyQuery = useQuery({
    queryKey: queryKeys.member.history(user?.id ?? 'anonymous'),
    enabled: Boolean(user?.id),
    queryFn: () => fetchHistoryData(user!.id),
  });

  useFocusEffect(
    useCallback(() => {
      historyQuery.refetch();
    }, [historyQuery.refetch]),
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={historyQuery.isRefetching}
          onRefresh={() => historyQuery.refetch()}
        />
      }
    >
      {historyQuery.data?.streak ? (
        <View style={styles.streakBanner}>
          <Text style={styles.streakNumber}>
            {historyQuery.data.streak.current_streak_weeks > 0
              ? historyQuery.data.streak.current_streak_weeks
              : 'Fresh'}
          </Text>
          <Text style={styles.streakLabel}>
            {historyQuery.data.streak.current_streak_weeks > 0
              ? 'week streak'
              : 'start'}
          </Text>
          <View style={styles.streakRow}>
            <View style={styles.streakStat}>
              <Text style={styles.statNumber}>
                {historyQuery.data.streak.visits_this_week}
              </Text>
              <Text style={styles.statLabel}>
                this week / {historyQuery.data.effectiveGoal}
              </Text>
            </View>
            <View style={styles.streakStat}>
              <Text style={styles.statNumber}>
                {historyQuery.data.streak.longest_streak_weeks}
              </Text>
              <Text style={styles.statLabel}>best streak</Text>
            </View>
          </View>
          {historyQuery.data.streak.rest_week_balance > 0 ? (
            <Text style={styles.restWeekText}>
              {historyQuery.data.streak.rest_week_balance} Rest Week
              {historyQuery.data.streak.rest_week_balance === 1 ? '' : 's'} banked
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Recent Visits</Text>
      {historyQuery.data?.attendance.map((visit, index) => (
        <View key={`${visit.checked_in_at}-${index}`} style={styles.visitRow}>
          <View>
            <Text style={styles.visitDate}>
              {new Date(visit.checked_in_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.visitTime}>
              {new Date(visit.checked_in_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.methodBadge}>
            <Text style={styles.methodText}>{visit.method}</Text>
          </View>
        </View>
      ))}

      {historyQuery.data && historyQuery.data.attendance.length === 0 ? (
        <View style={styles.emptyState}>
          <Camera size={48} color="#16a34a" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No visits yet</Text>
          <Text style={styles.emptyText}>
            Scan the QR code at your gym to record your first check-in.
          </Text>
        </View>
      ) : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  streakBanner: {
    marginTop: 18,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f0fdf4',
    borderRadius: 24,
    marginBottom: 24,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#15803d',
  },
  streakLabel: {
    fontSize: 16,
    color: '#166534',
    marginBottom: 18,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 32,
  },
  streakStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  restWeekText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  visitDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  visitTime: {
    marginTop: 2,
    fontSize: 13,
    color: '#6b7280',
  },
  methodBadge: {
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#6b7280',
  },
});
