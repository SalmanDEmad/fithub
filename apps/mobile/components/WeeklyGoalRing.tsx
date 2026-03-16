import Svg, { Circle } from 'react-native-svg';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface WeeklyGoalRingProps {
  visits: number;
  goal: number;
  onPress: () => void;
}

const SIZE = 164;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WeeklyGoalRing({
  visits,
  goal,
  onPress,
}: WeeklyGoalRingProps) {
  const progress = Math.min(1, visits / Math.max(goal, 1));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Weekly goal, ${visits} of ${goal} visits this week. Double tap to change your goal.`}
      onPress={onPress}
      style={styles.wrapper}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#d1fae5"
          strokeWidth={STROKE}
          fill="transparent"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#16a34a"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Weekly goal</Text>
        <Text style={styles.count}>{visits} of {goal}</Text>
        <Text style={styles.caption}>visits this week</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#15803d',
    letterSpacing: 0.8,
  },
  count: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  caption: {
    marginTop: 4,
    fontSize: 14,
    color: '#4b5563',
  },
});
