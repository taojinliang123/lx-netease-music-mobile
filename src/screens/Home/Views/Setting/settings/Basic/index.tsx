import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsHomePageScroll from './IsHomePageScroll'
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import DrawerLayoutPosition from './DrawerLayoutPosition'
import { useI18n } from '@/lang/i18n'
import WyCookie from './WyCookie'
import NavMenu from "@/screens/Home/Views/Setting/settings/Basic/NavMenu.tsx"; // 找回菜单显示

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_basic')}>
      <IsStartupAutoPlay />
      <IsHomePageScroll />
      <IsUseSystemFileSelector />
      <IsAlwaysKeepStatusbarHeight />
      <Theme />
      <DrawerLayoutPosition />
      <NavMenu /> {/* 菜单显示设置回来了！ */}
      <Language />
      <FontSize />
      <ShareType />
      <Source />
      <SourceName />
      <WyCookie /> {/* 网易云和酷狗都在这里了 */}
    </Section>
  )
})
