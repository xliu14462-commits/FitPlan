import React, { useRef, useCallback } from 'react';
import { StatusBar, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const appHtml = require('./assets/app.html');

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = React.useState(false);
  const [htmlContent, setHtmlContent] = React.useState('');

  // Load HTML on mount
  React.useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(appHtml);
        await asset.downloadAsync();
        if (asset.localUri) {
          const html = await FileSystem.readAsStringAsync(asset.localUri);
          setHtmlContent(html);
        }
        setReady(true);
      } catch (e) {
        console.error('Failed to load app HTML:', e);
        setReady(true);
      }
    })();
  }, []);

  // Bridge: WebView → Native
  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      const { id, type, payload } = msg;

      switch (type) {

        // ── Voice ──
        case 'speak': {
          Speech.speak(payload.text, {
            language: 'zh-CN',
            rate: 1.0,
            pitch: 1.1,
          });
          break;
        }
        case 'stopSpeech': {
          await Speech.stop();
          break;
        }

        // ── Image Picker ──
        case 'pickImage': {
          try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              reply(id, { error: 'Permission denied' });
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.8,
              base64: true,
            });
            if (!result.canceled && result.assets[0]?.base64) {
              const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
              reply(id, { dataUrl: uri });
            } else {
              reply(id, { cancelled: true });
            }
          } catch (e: any) {
            reply(id, { error: e.message });
          }
          break;
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  // Send result back to WebView
  const reply = (id: string, payload: any) => {
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'nativeReply',
      id,
      payload,
    }));
  };

  if (!ready) {
    return <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />;
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F5F7"
        translucent={false}
      />
      <WebView
        ref={webViewRef}
        source={{
          html: htmlContent,
          baseUrl: 'file:///',
        }}
        style={{ flex: 1, backgroundColor: '#F5F5F7' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        onMessage={onMessage}
        originWhitelist={['*']}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        containerStyle={{ flex: 1 }}
      />
    </>
  );
}
