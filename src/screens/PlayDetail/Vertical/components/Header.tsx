import { memo, useRef, useCallback, useMemo, useState } from 'react'
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

// ⭐ 音质名称映射
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

// ⭐ 右上角显示平台+音质的按钮
const QualityBadge = ({ onPress }: { onPress: () => void }) => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const musicInfo = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null
  const currentQuality = useSettingValue('player.playQuality') || '128k'

  if (!musicInfo) return null

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

// ⭐ 音质切换弹窗
const QualitySelectModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const theme = useTheme()
  const playMusicInfo = usePlayMusicInfo()
  const currentQuality = useSettingValue('player.playQuality') || '128k'
  
  // 获取当前歌曲信息
  const musicInfo = playMusicInfo.musicInfo ? ('progress' in playMusicInfo.musicInfo ? playMusicInfo.musicInfo.metadata.musicInfo : playMusicInfo.musicInfo) : null

  // ⭐ 动态计算音质列表和大小
  const displayQualityList = useMemo(() => {
    if (!musicInfo) return []
    
    // 默认使用内置音质
    let rawQualities: any[] = musicInfo.meta?.qualitys || []
    
    // ⭐ 优先读取自定义源挂载的全局音质列表
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
      
      // ⭐ 估算文件大小
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
    settingState.setting['player.playQuality'] = quality as LX.Quality
    onClose()

    if (!musicInfo) return

    try {
      const currentTime = await getPosition()
      const newUrl = await getMusicUrl({
        musicInfo: musicInfo as LX.Music.MusicInfo,
        quality: quality as LX.Quality,
        isRefresh: true,
      })

      if (!newUrl) throw new Error('获取新音质链接失败')

      playMusic(musicInfo as any, newUrl, currentTime)
    } catch (e) {
      console.error('切换音质失败:', e)
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
        <QualityBadge onPress={() => setShowQualityModal(true)} />
        <TimeoutExitBtn />
        <Btn icon="slider" onPress={showSetting} />
      </View>
      <SettingPopup ref={popupRef} direction="vertical" />
      <QualitySelectModal visible={showQualityModal} onClose={() => setShowQualityModal(false)} />
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
