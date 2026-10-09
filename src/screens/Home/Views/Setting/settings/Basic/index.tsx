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

// 引入网易云组件
import WyCookie from './WyCookie'
// 酷狗组件：排除法，暂时注释掉
// import KgCookie from './KgCookie'
// 导航菜单：排除法，暂时注释掉
// import NavMenu from './NavMenu'

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

      {/* 保留网易云 Cookie 做测试 */}
      <WyCookie />
      {/* 酷狗 Cookie：暂时注释 */}
      {/* <KgCookie /> */}
      {/* 导航菜单：暂时注释 */}
      {/* <NavMenu /> */}
    </Section>
  )
})
