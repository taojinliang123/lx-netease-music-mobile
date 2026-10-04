import { useEffect, useRef, useState } from 'react';
import WebLoginModal, { type WebLoginModalType } from './WebLoginModal';
import KgWebLoginModal, { type KgWebLoginModalType } from './KgWebLoginModal';

export default () => {
  const modalRef = useRef<WebLoginModalType>(null);
  const kgModalRef = useRef<KgWebLoginModalType>(null);
  const [visible, setVisible] = useState(false);
  const [kgVisible, setKgVisible] = useState(false);

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

    const handleShowKg = () => {
      if (kgVisible) {
        kgModalRef.current?.show();
      } else {
        setKgVisible(true);
        requestAnimationFrame(() => {
          kgModalRef.current?.show();
        });
      }
    };

    global.app_event.on('showWebLogin', handleShowWy);
    global.app_event.on('showKugouWebLogin', handleShowKg);
    
    return () => {
      global.app_event.off('showWebLogin', handleShowWy);
      global.app_event.off('showKugouWebLogin', handleShowKg);
    };
  }, [visible, kgVisible]);

  return (
    <>
      {visible ? <WebLoginModal ref={modalRef} /> : null}
      {kgVisible ? <KgWebLoginModal ref={kgModalRef} /> : null}
    </>
  );
};
