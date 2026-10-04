import { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Modal, { type ModalType } from '@/components/common/Modal';
import WebView, { type WebViewNavigation } from 'react-native-webview';
import { useTheme } from '@/store/theme/hook';
import { useStatusbarHeight } from '@/store/common/hook';
import { Icon } from '@/components/common/Icon';
import Text from '@/components/common/Text';
import { toast } from '@/utils/tools';
import CookieManager from '@react-native-cookies/cookies';

const LOGIN_URL = 'https://m.kugou.com/login'; // 酷狗 H5 登录页
const SUCCESS_URL_FLAG = 'kugou.com';

export interface KgWebLoginModalType {
  show: () => void;
}

const Header = ({ onClose }: { onClose: () => void }) => {
  const theme = useTheme();
  const statusBarHeight = useStatusbarHeight();

  return (
    <View style={[styles.header, { height: 50 + statusBarHeight, paddingTop: statusBarHeight, backgroundColor: theme['c-content-background'] }]}>
      <TouchableOpacity onPress={onClose} style={styles.backButton}>
        <Icon name="chevron-left" size={24} color={theme['c-font']} />
      </TouchableOpacity>
      <Text size={18}>酷狗音乐登录</Text>
      <View style={styles.backButton} />
    </View>
  );
};

export default forwardRef<KgWebLoginModalType, {}>((props, ref) => {
  const modalRef = useRef<ModalType>(null);
  const webViewRef = useRef<WebView>(null);
  const loggedInRef = useRef(false);
  const isCheckingRef = useRef(false);
  const theme = useTheme();

  useImperativeHandle(ref, () => ({
    show() {
      loggedInRef.current = false;
      isCheckingRef.current = false;
      modalRef.current?.setVisible(true);
    },
  }));

  const handleClose = useCallback(() => {
    modalRef.current?.setVisible(false);
  }, []);

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    console.log('酷狗Web登录: 页面导航状态变化:', navState.url);
    const url = navState.url;
    // 如果跳转到了酷狗主站且不是登录页，或者包含特定成功标志，就去抓 Cookie
    const isLoggedIn = url.includes(SUCCESS_URL_FLAG) && !url.includes('/login');
    
    if (isLoggedIn) {
      console.log('酷狗Web登录: 正在提取 Cookie');
      try {
        const cookies = await CookieManager.get(navState.url, true);
        const cookieString = Object.values(cookies)
          .map(c => `${c.name}=${c.value}`)
          .join('; ');
        console.log('酷狗Web登录: CookieManager 捕获成功');
        handleMessage({ nativeEvent: { data: cookieString } });
      } catch (err) {
        console.error('酷狗Web登录: CookieManager 提取失败，尝试 fallback', err);
        webViewRef.current?.injectJavaScript('window.ReactNativeWebView.postMessage(document.cookie);');
      }
    }
  };

  const handleMessage = async (event: any) => {
    console.log('酷狗Web登录: 收到消息:', event.nativeEvent.data);
    if (loggedInRef.current || isCheckingRef.current) return;

    const cookie = event.nativeEvent.data;
    // 酷狗登录成功后，Cookie 里必须包含 token 和 userid
    if (!cookie || !cookie.includes('token=') || !cookie.includes('userid=')) return;

    isCheckingRef.current = true;
    try {
      // 目前没有酷狗的 getUid 接口，直接认为拿到 token 就算成功
      loggedInRef.current = true;
      global.app_event.emit('kg-cookie-set', cookie); // 发送酷狗专属事件
      toast('酷狗登录成功，已自动获取Cookie！');
      handleClose();
    } catch (error) {
      console.log('酷狗Web登录: Cookie验证失败:', (error as Error).message);
    } finally {
      isCheckingRef.current = false;
    }
  };

  return (
    <Modal ref={modalRef} onHide={() => {}} statusBarPadding={false} bgHide={false}>
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        <Header onClose={handleClose} />
        <WebView
          ref={webViewRef}
          source={{ uri: LOGIN_URL }}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
    width: 40,
  },
});
