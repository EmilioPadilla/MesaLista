import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setNotify, type NotifyApi } from 'platform/notify';

type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  id: number;
  kind: ToastKind;
  message: string;
  description?: string;
}

const KIND_STYLES: Record<ToastKind, { bg: string; text: string }> = {
  success: { bg: 'bg-success', text: 'text-white' },
  error: { bg: 'bg-danger', text: 'text-white' },
  warning: { bg: 'bg-warning', text: 'text-white' },
  info: { bg: 'bg-ink', text: 'text-white' },
};

const ToastContext = createContext<NotifyApi | null>(null);

/**
 * Lightweight toast host that also registers the spine's `notify` adapter, so
 * shared hooks (useCart, useUser, …) surface their messages natively.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback(
    (kind: ToastKind, message: string, description?: string) => {
      counter.current += 1;
      setToast({ id: counter.current, kind, message, description });
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
      }, kind === 'error' ? 5000 : 3500);
    },
    [opacity],
  );

  const api = useMemo<NotifyApi>(
    () => ({
      success: (m, d) => show('success', m, d),
      error: (m, d) => show('error', m, d),
      warning: (m, d) => show('warning', m, d),
      info: (m, d) => show('info', m, d),
    }),
    [show],
  );

  useEffect(() => {
    setNotify(api);
  }, [api]);

  const palette = toast ? KIND_STYLES[toast.kind] : KIND_STYLES.info;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={{ opacity, top: insets.top + 8 }}
          className="absolute left-4 right-4 z-50"
        >
          <View className={`rounded-ml px-4 py-3 shadow-lg ${palette.bg}`}>
            <Text className={`text-base font-semibold ${palette.text}`}>{toast.message}</Text>
            {toast.description ? <Text className={`mt-0.5 text-sm ${palette.text} opacity-90`}>{toast.description}</Text> : null}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): NotifyApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
