import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryKeys } from '@fithub/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { WeeklyGoalRing } from '../../components/WeeklyGoalRing';
import { ModalCard } from '../../components/ModalCard';
import { getWeekdayDates, formatDateKey } from '../../lib/date-utils';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import { fetchHomeData } from '../../lib/member-data';

const COMEBACK_PROMPT_KEY = 'fithub.comeback-prompt-key';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [comebackTier, setComebackTier] = useState<2 | 3 | null>(null);
  const appliedFreshStartKey = useRef<string | null>(null);

  const homeQuery = useQuery({
    queryKey: queryKeys.member.home(user?.id ?? 'anonymous'),
    enabled: Boolean(user?.id),
    queryFn: () => fetchHomeData(user!.id),
  });

  const updateGoalMutation = useMutation({
    mutationFn: (goal: number | null) => api.updatePreferences(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.member.home(user?.id ?? 'anonymous'),
      });
    },
  });

  useFocusEffect(
    useCallback(() => {
      homeQuery.refetch();
    }, [homeQuery.refetch]),
  );

  useEffect(() => {
    if (!homeQuery.data) return;
    if (homeQuery.data.comebackTier < 2 || !homeQuery.data.lastVisitAt) return;

    const currentKey = `${homeQuery.data.memberId}:${homeQuery.data.lastVisitAt}:${homeQuery.data.comebackTier}`;
    AsyncStorage.getItem(COMEBACK_PROMPT_KEY).then((storedKey) => {
      if (storedKey !== currentKey) {
        setComebackTier(homeQuery.data!.comebackTier as 2 | 3);
        AsyncStorage.setItem(COMEBACK_PROMPT_KEY, currentKey);
      }
    });
  }, [homeQuery.data]);

  useEffect(() => {
    if (!homeQuery.data) return;
    if (
      homeQuery.data.comebackTier === 3 &&
      homeQuery.data.visitsThisWeek === 0 &&
      !updateGoalMutation.isPending &&
      (homeQuery.data.personalWeeklyGoal === null || homeQuery.data.personalWeeklyGoal > 1)
    ) {
      const freshStartKey = `${homeQuery.data.memberId}:${homeQuery.data.lastVisitAt}`;
      if (appliedFreshStartKey.current === freshStartKey) {
        return;
      }
      appliedFreshStartKey.current = freshStartKey;
      updateGoalMutation.mutate(1);
    }
  }, [homeQuery.data, updateGoalMutation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await homeQuery.refetch();
    setRefreshing(false);
  };

  const handleGoalPress = () => {
    Alert.alert('Set your weekly goal', 'Choose the number of visits that feels sustainable this week.', [
      { text: 'Use gym default', onPress: () => updateGoalMutation.mutate(null) },
      ...[1, 2, 3, 4, 5].map((goal) => ({
        text: `${goal} visit${goal === 1 ? '' : 's'}`,
        onPress: () => updateGoalMutation.mutate(goal),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const weekdayDots = useMemo(() => {
    const data = homeQuery.data;
    if (!data) return [];
    const weekDates = getWeekdayDates(data.timezone);
    return weekDates.map((date) => ({
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: data.timezone,
      }),
      key: formatDateKey(date, data.timezone),
      filled: data.weeklyVisitedKeys.includes(
        formatDateKey(date, data.timezone),
      ),
    }));
  }, [homeQuery.data]);

  if (homeQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading your week...</Text>
      </View>
    );
  }

  if (!homeQuery.data) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Dumbbell size={48} color="#16a34a" strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Join a gym to get started</Text>
        <Text style={styles.emptyBody}>
          Once you join a gym, your weekly goal and streak will show up here.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the Join Gym tab"
          onPress={() => router.push('/(private)/join')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Join a Gym</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const homeData = homeQuery.data;

  const streakHeadline =
    homeData.currentStreakWeeks > 0
      ? `${homeData.currentStreakWeeks}-week streak`
      : 'Start fresh today';

  const contextualCard = getContextualCard(homeData);

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.kicker}>Welcome back</Text>
        <Text style={styles.heading}>{homeData.displayName}</Text>
        <Text style={styles.subheading}>{homeData.gymName}</Text>

        <View style={styles.heroCard}>
          <WeeklyGoalRing
            visits={homeData.visitsThisWeek}
            goal={homeData.effectiveGoal}
            onPress={handleGoalPress}
          />
          <Text style={styles.goalHint}>Tap the ring to change your goal</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              homeData.checkedInToday
                ? 'You are already checked in today'
                : 'Open the QR scanner to check in'
            }
            onPress={() => router.push('/(private)/scan')}
            style={[
              styles.ctaButton,
              homeData.checkedInToday && styles.ctaButtonSuccess,
            ]}
          >
            <Text style={styles.ctaTitle}>
              {homeData.checkedInToday ? "You're here! Nice." : 'Check in now'}
            </Text>
            <Text style={styles.ctaBody}>
              {homeData.checkedInToday
                ? 'Your visit is already logged for today.'
                : 'Open the scanner in one tap.'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Current streak</Text>
            <Text style={styles.metricValue}>{streakHeadline}</Text>
            <Text style={styles.metricHint}>
              Personal best: {homeData.longestStreakWeeks} weeks
            </Text>
            {homeData.restWeekBalance > 0 ? (
              <Text style={styles.restWeekText}>
                {homeData.restWeekBalance} Rest Week
                {homeData.restWeekBalance === 1 ? '' : 's'} available
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>This week</Text>
          <View style={styles.weekRow}>
            {weekdayDots.map((item) => (
              <View key={item.key} style={styles.dayItem}>
                <View
                  style={[
                    styles.dayDot,
                    item.filled ? styles.dayDotFilled : styles.dayDotEmpty,
                  ]}
                />
                <Text style={styles.dayLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextTitle}>{contextualCard.title}</Text>
          <Text style={styles.contextBody}>{contextualCard.body}</Text>
        </View>
      </ScrollView>

      <ModalCard
        visible={comebackTier === 2}
        title="Ready to start a new week?"
        body={`You've visited ${homeData.lifetimeVisits} times since joining. That's real progress.`}
        primaryAction={{
          label: 'Check in now',
          onPress: () => {
            setComebackTier(null);
            router.push('/(private)/scan');
          },
        }}
        secondaryAction={{
          label: 'Adjust my weekly goal',
          onPress: () => {
            setComebackTier(null);
            handleGoalPress();
          },
        }}
        onRequestClose={() => setComebackTier(null)}
      />

      <ModalCard
        visible={comebackTier === 3}
        title="Welcome back"
        body={`Today is Day 1 of your comeback. You've already shown up ${homeData.lifetimeVisits} times before, and this week your goal resets to one visit.`}
        primaryAction={{
          label: 'Check in now',
          onPress: () => {
            setComebackTier(null);
            router.push('/(private)/scan');
          },
        }}
        secondaryAction={{
          label: 'Keep the fresh start',
          onPress: () => setComebackTier(null),
        }}
        onRequestClose={() => setComebackTier(null)}
      />
    </>
  );
}

function getContextualCard(data: NonNullable<Awaited<ReturnType<typeof fetchHomeData>>>) {
  if (data.comebackTier === 3) {
    return {
      title: 'Welcome back',
      body: 'Even one visit counts right now. Hit two visits in the next two weeks to rebuild momentum.',
    };
  }

  if (data.comebackTier === 2) {
    return {
      title: 'Your progress still counts',
      body: `You've already logged ${data.lifetimeVisits} visits. A gentle week is enough to get moving again.`,
    };
  }

  if (data.comebackTier === 1) {
    return {
      title: 'It has only been a few days',
      body: 'Your streak is still alive. One visit this week keeps it going.',
    };
  }

  return {
    title: data.checkedInToday ? 'Momentum locked in' : 'A steady week beats a perfect one',
    body: data.checkedInToday
      ? 'Nice work showing up today. You are one step closer to your weekly goal.'
      : `You are ${Math.max(0, data.effectiveGoal - data.visitsThisWeek)} visit${Math.max(0, data.effectiveGoal - data.visitsThisWeek) === 1 ? '' : 's'} away from your target.`,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8f4',
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f8f4',
  },
  loadingText: {
    color: '#4b5563',
    fontSize: 16,
  },
  kicker: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#15803d',
  },
  heading: {
    marginTop: 6,
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
  },
  subheading: {
    marginTop: 4,
    fontSize: 15,
    color: '#4b5563',
  },
  heroCard: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  goalHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
  },
  ctaButton: {
    width: '100%',
    marginTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: '#111827',
  },
  ctaButtonSuccess: {
    backgroundColor: '#14532d',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  ctaBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#d1fae5',
  },
  metricsRow: {
    marginTop: 16,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  metricHint: {
    marginTop: 6,
    fontSize: 14,
    color: '#4b5563',
  },
  restWeekText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  calendarCard: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  weekRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 8,
  },
  dayDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dayDotFilled: {
    backgroundColor: '#16a34a',
  },
  dayDotEmpty: {
    backgroundColor: '#e5e7eb',
  },
  dayLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  contextCard: {
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    padding: 20,
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14532d',
  },
  contextBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#166534',
  },
  emptyState: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 64,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#4b5563',
  },
  secondaryButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
