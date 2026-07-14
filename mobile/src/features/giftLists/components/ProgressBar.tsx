import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface ProgressBarProps {
  /** Fill ratio 0–1 (clamped). */
  ratio: number;
  height?: number;
  trackColor?: string;
  fillColor?: string;
  /** Delay (ms) before the fill animates in, for staggered reveals. */
  delay?: number;
}

/**
 * Thin rounded progress bar that animates its fill on mount. Colors are passed
 * as plain values (not className) so it works on any surface without relying on
 * NativeWind interop for the Animated fill.
 */
export function ProgressBar({
  ratio,
  height = 8,
  trackColor = 'rgba(212,112,74,0.14)',
  fillColor = '#d4704a',
  delay = 0,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: clamped,
      duration: 900,
      delay,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, delay, progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ height, backgroundColor: trackColor, borderRadius: height, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', width, backgroundColor: fillColor, borderRadius: height }} />
    </View>
  );
}
