import { memo, useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native'
import { pop, navigations } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { usePlayMusicInfo } from '@/store/player/hook'
import Text from '@/components/common/Text'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT as _HEADER_HEIGHT, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import commonState from '@/store/common/state'
import SettingPopup, { type SettingPopupType } from '../../components/SettingPopup'
import { useStatusbarHeight } from '@/store/common/hook'
import Btn from './Btn'
import TimeoutExitBtn from './TimeoutExitBtn'
import Marquee from './Marquee'
import StatusBar from '@/components/common/StatusBar'
import { useSettingValue } from '@/store/setting/hook'
import settingState from '@/store/setting/state'
import { getPosition } from '@/plugins/player'
import { getMusicUrl } from '@/core/music'
import { playMusic } from '@/plugins/player/playList'

export const HEADER_HEIGHT = scaleSizeH(_HEADER_HEIGHT)

const QUALITY_NAME_MAP: Record<string, string> = {
  '128k': '128K',
  '192k': '192K',
  '320k': '320K',
  'flac': 'FLAC',
  'hires': 'Hi-Res',
  'atmos': 'Atmos',
  'atmos_plus': 'Atmos Plus',
  'master': 'Master',
  'master_plus': 'Master Plus',
}

const Title = () => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const musicInfo = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null

  const handleArtistPress = useCallback((artist: { id: string | number, name: string }) => {
    if (!musicInfo || musicInfo.source !== 'wy' || !artist.id) return
    navigations.pushArtistDetailScreen(commonState.componentIds[commonState.componentIds.length - 1]?.id!, { id: String(artist.id), name: artist.name })
  }, [musicInfo])

  const handleAlbumPress = useCallback(() => {
    if (!musicInfo || musicInfo.source !== 'wy' || !(musicInfo.meta as any).albumId) return
    navigations.pushAlbumDetailScreen(commonState.componentIds[commonState.componentIds.length - 1]?.id!, { id: String((musicInfo.meta as any).albumId), name: musicInfo.meta.albumName, source: musicInfo.source })
  }, [musicInfo])

  const singerRender = useMemo(() => {
    if (!musicInfo) return null
    const albumName = musicInfo.meta?.albumName
    const albumId = (musicInfo.meta as any)?.albumId

    if (!musicInfo.artists?.length || musicInfo.source == 'local') {
      return (
        <View style={styles.singerContainer}>
          <Text numberOfLines={1} size={12} color={theme['c-font']}>
            {musicInfo.singer}
          </Text>
          {albumName ? (
            <TouchableOpacity style={{ flexShrink: 1 }} onPress={handleAlbumPress} disabled={musicInfo.source !== 'wy' || !albumId}>
              <Text numberOfLines={1} size={12} color={theme['c-font']}>
                {` · ${albumName}`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )
    }

    return (
      <View style={styles.singerContainer}>
        {musicInfo.artists.map((artist, index) => (
          <TouchableOpacity key={artist.id || index} onPress={() => handleArtistPress(artist)}>
            <Text style={styles.singerText} size={12} color={theme['c-font']}>
              {artist.name}
              {(musicInfo.artists?.length ?? 0) > 0 && index < (musicInfo.artists?.length ?? 0) - 1 ? ' / ' : ''}
            </Text>
          </TouchableOpacity>
        ))}
        {albumName ? (
          <TouchableOpacity style={{ flexShrink: 1 }} onPress={handleAlbumPress} disabled={musicInfo.source !== 'wy' || !albumId}>
            <Text numberOfLines={1} size={12} color={theme['c-font']}>
              {` · ${albumName}`}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }, [musicInfo, theme, handleArtistPress, handleAlbumPress])

  return (
    <View style={styles.titleContent}>
      {musicInfo ? (
        <>
          <Marquee style={styles.title} size={16}>
            {musicInfo.name}
            {musicInfo.alias ? <Text color={theme['c-font-label']}> ({musicInfo.alias})</Text> : null}
          </Marquee>
          {singerRender}
        </>
      ) : null}
    </View>
  )
}

// ⭐ 右上角显示平台+音质
const QualityBadge = ({ onPress, actualQuality }: { onPress: () => void, actualQuality: string | null }) => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const musicInfo = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null
  const currentQuality = actualQuality || useSettingValue('player.playQuality') || '128k'

  // ⭐ 安全保护：拿不到数据就静默隐藏，不渲染，防止崩溃
  if (!musicInfo || !musicInfo.source) return null

  const platformName = (musicInfo.source || '').toUpperCase()
  const qualityName = QUALITY_NAME_MAP[currentQuality] || currentQuality.toUpperCase()

  return (
    <TouchableOpacity style={styles.qualityBadge} onPress={onPress}>
      <Text size={11} color={theme['c-primary']} style={{ fontWeight: 'bold' }}>
        {platformName}
      </Text>
      <Text size={11} color={theme['c-font-label']}>
        {qualityName}
      </Text>
    </TouchableOpacity>
  )
}

const QualitySelectModal = ({ visible, onClose, onQualityChange }: { visible: boolean; onClose: () => void; onQualityChange: (q: string) => void }) => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const currentQuality = useSettingValue('player.playQuality') || '128k'
  
  const musicInfo = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null

  const displayQualityList = useMemo(() => {
    if (!musicInfo) return []
    let rawQualities: any[] = musicInfo.meta?.qualitys || []
    
    if ((global as any).lx?.qualityList && (global as any).lx.qualityList[musicInfo.source]) {
      const customQualitys = (global as any).lx.qualityList[musicInfo.source]
      if (Array.isArray(customQualitys) && typeof customQualitys[0] === 'string') {
        rawQualities = customQualitys.map(q => ({ type: q, size: null }))
      } else if (Array.isArray(customQualitys)) {
        rawQualities = customQualitys
      }
    }

    const qualityMap: Record<string, any> = {}
    for (const element of rawQualities) {
      if (!element || !element.type) continue
      
      let displaySize = element.size
      if (!displaySize && musicInfo.interval) {
        const parts = musicInfo.interval.split(':')
        if (parts.length === 2) {
          const totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
          let kbps = 128
          if (element.type === '320k') kbps = 320
          else if (element.type === 'flac') kbps = 800
          else if (element.type === 'hires') kbps = 1500
          else if (element.type === 'master') kbps = 2000

          if (totalSeconds > 0) {
            displaySize = `${(totalSeconds * kbps / 8 / 1024).toFixed(2)}MB`
          }
        }
      }

      qualityMap[element.type] = {
        id: element.type,
        name: QUALITY_NAME_MAP[element.type] || element.type.toUpperCase(),
        size: displaySize
      }
    }

    const order = ['128k', '192k', '320k', 'flac', 'hires', 'atmos', 'atmos_plus', 'master', 'master_plus']
    return Object.values(qualityMap).sort((a: any, b: any) => {
      const indexA = order.indexOf(a.id)
      const indexB = order.indexOf(b.id)
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })
  }, [musicInfo])

  const handleSelect = async (quality: string) => {
    onClose()

    if (!musicInfo) return

    try {
      console.log('[QualitySwitch] === 开始切换音质 ===')
      const currentTime = await getPosition()
      console.log('[QualitySwitch] 当前播放位置:', currentTime)

      const result = await getMusicUrl({
        musicInfo: musicInfo as LX.Music.MusicInfo,
        quality: quality as LX.Quality,
        isRefresh: true,
      })
      console.log('[QualitySwitch] getMusicUrl 返回:', result)

      let newUrl = ''
      let actualQ = quality
      
      if (typeof result === 'string') {
        newUrl = result
      } else if (result && typeof result === 'object') {
        newUrl = result.url || ''
        actualQ = result.quality || result.type || quality
      }

      if (!newUrl) throw new Error('获取到的 URL 为空')

      console.log('[QualitySwitch] 准备切换至:', actualQ, '链接:', newUrl)

      // ⭐ 保护：使用 setTimeout 避免与 UI 关闭动画冲突导致渲染崩溃
      setTimeout(() => {
        playMusic(musicInfo as any, newUrl, currentTime || 0)
        onQualityChange(actualQ)
        console.log('[QualitySwitch] 指令已发送，UI 已更新')
      }, 100)
      
    } catch (e: any) {
      console.error('[QualitySwitch] 切换音质失败:', e)
    }
  }

  if (!visible) return null

  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modalContent, { backgroundColor: theme['c-content-bg'] || theme['c-bg'] || '#FFFFFF' }]}>
              <Text size={16} color={theme['c-font']} style={{ marginBottom: 15, fontWeight: 'bold' }}>切换播放音质</Text>
              {displayQualityList.length > 0 ? (
                displayQualityList.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalItem,
                      { backgroundColor: currentQuality === item.id ? (theme['c-primary-light-200-alpha-800'] || '#F0F9F4') : 'transparent' }
                    ]}
                    onPress={() => handleSelect(item.id)}
                  >
                    <Text style={{ color: currentQuality === item.id ? theme['c-primary'] : theme['c-font'] }}>
                      {item.name} {item.size ? `- ${item.size}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ color: theme['c-font-label'], textAlign: 'center', paddingVertical: 20 }}>
                  该音源暂无可下载的音质
                </Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default memo(() => {
  const popupRef = useRef<SettingPopupType>(null)
  const statusBarHeight = useStatusbarHeight()
  const [showQualityModal, setShowQualityModal] = useState(false)
  
  const [actualQuality, setActualQuality] = useState<string | null>(null)
  
  const back = () => {
    void pop(commonState.componentIds[commonState.componentIds.length - 1]?.id!)
  }
  const showSetting = () => {
    popupRef.current?.show()
  }

  return (
    <View
      style={{ height: HEADER_HEIGHT + statusBarHeight, paddingTop: statusBarHeight }}
      nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_header}
    >
      <StatusBar />
      <View style={styles.container}>
        <Btn icon="chevron-left" onPress={back} />
        <Title />
        <QualityBadge onPress={() => setShowQualityModal(true)} actualQuality={actualQuality} />
        <TimeoutExitBtn />
        <Btn icon="slider" onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
      <QualitySelectModal 
        visible={showQualityModal} 
        onClose={() => setShowQualityModal(false)} 
        onQualityChange={(q) => setActualQuality(q)} 
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  titleContent: {
    flex: 1,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  title: {},
  singerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  singerText: {
    paddingRight: 2,
  },
  qualityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
})
