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
import KgCookie from './KgCookie' // 👈 【新增】：咱们自己新建的独立酷狗组件
import NavMenu from "@/screens/Home/Views/Setting/settings/Basic/NavMenu.tsx";

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
      <NavMenu /> 
      <Language />
      <FontSize />
      <ShareType />
      <Source />
      <SourceName />
      <WyCookie /> 
      <KgCookie /> {/* 👈 【新增】：把新组件挂上去 */}
    </Section>
  )
})
