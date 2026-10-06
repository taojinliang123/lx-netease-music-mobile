import { useEffect, useRef, useState } from 'react';
import WebLoginModal, { type WebLoginModalType } from './WebLoginModal';
// 酷狗弹窗引入已移除，防止底层 WebView 崩溃

export default () => {
  const modalRef = useRef<WebLoginModalType>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleShowWy = () => {
      if (visible) {
        modalRef.current?.show();
      } else {
        setVisible(true);
        requestAnimationFrame(() => {
          modalRef.current?.show();
        });
      }
    };

    global.app_event.on('showWebLogin', handleShowWy);
    
    return () => {
      global.app_event.off('showWebLogin', handleShowWy);
    };
  }, [visible]);

  return (
    <>
      {visible ? <WebLoginModal ref={modalRef} /> : null}
      {/* 酷狗网页登录弹窗已移除，防崩溃 */}
    </>
  );
};
