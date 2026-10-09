import { memo } from 'react'

import Theme from '../Theme'
import Section from '../../components/Section'
import Source from './Source'
import SourceName from './SourceName'
import Language from './Language'
import FontSize from './FontSize'
import ShareType from './ShareType'
import IsStartupAutoPlay from './IsStartupAutoPlay'
import IsStartupPushPlayDetailScreen from './IsStartupPushPlayDetailScreen'
import IsAutoHidePlayBar from './IsAutoHidePlayBar'
import IsHomePageScroll from './IsHomePageScroll'
// import IsAllowProgressBarSeek from './IsAllowProgressBarSeek' // 注释：文件不存在，导致打包崩溃
import IsUseSystemFileSelector from './IsUseSystemFileSelector'
import IsAlwaysKeepStatusbarHeight from './IsAlwaysKeepStatusbarHeight'
import IsShowBackBtn from './IsShowBackBtn'
import IsShowExitBtn from './IsShowExitBtn'
import DrawerLayoutPosition from './DrawerLayoutPosition'

// 去掉网易云组件（排除法，测试红框来源）
// import WyCookie from './WyCookie'
// 引入酷狗组件和导航菜单
import KgCookie from './KgCookie'
import NavMenu from './NavMenu'

import { useI18n } from '@/lang/i18n'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_basic')}>
      <IsStartupAutoPlay />
      <IsStartupPushPlayDetailScreen />
      <IsShowBackBtn />
      <IsShowExitBtn />
      <IsAutoHidePlayBar />
      <IsHomePageScroll />
      {/* <IsAllowProgressBarSeek /> */} {/* 注释：文件不存在 */}
      <IsUseSystemFileSelector />
      <IsAlwaysKeepStatusbarHeight />
      <Theme />
      <DrawerLayoutPosition />
      <Language />
      <FontSize />
      <ShareType />
      <Source />
      <SourceName />

      {/* 启用酷狗和导航菜单 */}
      <KgCookie />
      <NavMenu />
      {/* <WyCookie /> */}
    </Section>
  )
})
