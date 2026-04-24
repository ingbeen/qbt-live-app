import React, { forwardRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { COLORS } from '../utils/colors';
import { generateChartHtml } from '../utils/chartHtml';
import type { CrosshairValues } from './ChartValueHeader';

interface ChartWebViewProps {
  onReady: () => void;
  onLoadEarlier: () => void;
  onCrosshair: (date: string, values: CrosshairValues) => void;
  onError?: (message: string) => void;
}

// WebView → RN 메시지 화이트리스트 (CLAUDE.md §9.2). 외 타입은 무시.
type IncomingMessage =
  | { type: 'ready' }
  | { type: 'load_earlier' }
  | { type: 'crosshair'; date: string; values: CrosshairValues };

const isIncomingMessage = (v: unknown): v is IncomingMessage => {
  if (typeof v !== 'object' || v === null) return false;
  const t = (v as { type?: unknown }).type;
  if (t === 'ready' || t === 'load_earlier') return true;
  if (t === 'crosshair') {
    const d = (v as { date?: unknown }).date;
    const vals = (v as { values?: unknown }).values;
    return typeof d === 'string' && typeof vals === 'object' && vals !== null;
  }
  return false;
};

export const ChartWebView = forwardRef<WebView, ChartWebViewProps>(
  ({ onReady, onLoadEarlier, onCrosshair, onError }, ref) => {
    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.nativeEvent.data);
        } catch (e) {
          console.warn('[chart] invalid message payload:', e);
          return;
        }
        if (!isIncomingMessage(parsed)) {
          console.warn('[chart] unknown message type:', parsed);
          return;
        }
        if (parsed.type === 'ready') {
          onReady();
        } else if (parsed.type === 'load_earlier') {
          onLoadEarlier();
        } else if (parsed.type === 'crosshair') {
          onCrosshair(parsed.date, parsed.values);
        }
      },
      [onReady, onLoadEarlier, onCrosshair],
    );

    return (
      <WebView
        ref={ref}
        source={{ html: generateChartHtml() }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        scrollEnabled={false}
        onMessage={handleMessage}
        onError={syntheticEvent => {
          const { nativeEvent } = syntheticEvent;
          console.error('[chart] WebView error:', nativeEvent);
          onError?.('차트를 불러올 수 없습니다. 네트워크를 확인하세요.');
        }}
        onHttpError={syntheticEvent => {
          const { nativeEvent } = syntheticEvent;
          console.error('[chart] WebView HTTP error:', nativeEvent);
        }}
        style={styles.webview}
      />
    );
  },
);

ChartWebView.displayName = 'ChartWebView';

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
});
