import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native'
import { useState, useImperativeHandle, forwardRef, useMemo } from 'react'
import { getLastSelectQuality, saveLastSelectQuality } from '@/utils/data'
import { addTask as addDownloadTask } from '@/core/download';
import { fetchAndApplyDetailedQuality } from "@/utils/musicSdk/wy/musicDetail.js";
import settingState from '@/store/setting/state'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook' // ⭐ 如果报错找不到这个路径，去 PageContent.tsx 里看 useTheme 是从哪导入的

export interface MusicDownloadModalType {
  show: (info: LX.Music.MusicInfo) => void
}

interface MusicDownloadModalProps {
  onDownloadInfo: (info: LX.Music.MusicInfo) => void
}

interface MusicOption {
  id: LX.Quality
  name: string
  size?: string | null
  key?: string
}

export default forwardRef<MusicDownloadModalType, MusicDownloadModalProps>(
  ({ onDownloadInfo }, ref) => {
    const [visible, setVisible] = useState(false)
    const [musicInfo, setMusicInfo] = useState<LX.Music.MusicInfo | null>(null)
    const [playQualityList, setPlayQualityList] = useState<MusicOption[]>([])
    const [selectedTarget, setSelectedTarget] = useState<'local' | 'onedrive'>('local')
    const showOneDriveDownload = useSettingValue('menu.downloadOneDrive')

    // ⭐ 获取主题对象
    const theme = useTheme()
    
    // ⭐ 动态生成样式
    const styles = useMemo(() => createStyles(theme), [theme])

    const QUALITY_ORDER = ['128k', '192k', '320k', 'flac', 'hires', 'atmos', 'atmos_plus', 'master', 'master_plus'];

    const calcQualitys = (info: LX.Music.MusicInfo) => {
      const nameMap = new Map()
      nameMap.set('128k', global.i18n.t('128k') || '128K')
      nameMap.set('192k', global.i18n.t('192k') || '192K')
      nameMap.set('320k', global.i18n.t('320k') || '320K')
      nameMap.set('flac', global.i18n.t('flac') || 'FLAC')
      nameMap.set('hires', global.i18n.t('hires') || 'Hi-Res')
      nameMap.set('atmos', global.i18n.t('atmos') || '全景声')
      nameMap.set('atmos_plus', global.i18n.t('atmos_plus') || '全景声Plus')
      nameMap.set('master', global.i18n.t('master') || '母带')
      nameMap.set('master_plus', global.i18n.t('master_plus') || '臻品母带')

      // ⭐ 优先读取自定义源挂载的全局音质列表
      let qualitys: any[] = info.meta?.qualitys || []
      if ((global as any).lx?.qualityList && (global as any).lx.qualityList[info.source]) {
        const customQualitys = (global as any).lx.qualityList[info.source]
        if (Array.isArray(customQualitys) && typeof customQualitys[0] === 'string') {
          qualitys = customQualitys.map(q => ({ type: q, size: null }))
        } else if (Array.isArray(customQualitys)) {
          qualitys = customQualitys
        }
      }

      const qualityMap: Record<string, MusicOption> = {}
      for (const element of qualitys) {
        if (!element || !element.type) continue;
        
        const displayName = nameMap.has(element.type) ? nameMap.get(element.type) : element.type.toUpperCase();

        // ⭐ 估算文件大小
        let displaySize = element.size;
        if (!displaySize && info.interval) {
          const parts = info.interval.split(':');
          if (parts.length === 2) {
            const totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            let kbps = 128;
            if (element.type === '320k') kbps = 320;
            else if (element.type === 'flac') kbps = 800;
            else if (element.type === 'hires') kbps = 1500;
            else if (element.type === 'master') kbps = 2000;

            if (totalSeconds > 0) {
              displaySize = `${(totalSeconds * kbps / 8 / 1024).toFixed(2)}MB`;
            }
          }
        }

        qualityMap[element.type] = {
          id: element.type,
          name: displayName,
          size: displaySize,
          key: element.type,
        }
      }

      const sortedList = Object.values(qualityMap).sort((a, b) => {
        const indexA = QUALITY_ORDER.indexOf(a.id);
        const indexB = QUALITY_ORDER.indexOf(b.id);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      });
      setPlayQualityList(sortedList)
    }

    useImperativeHandle(ref, () => ({
      async show(info) {
        setMusicInfo(info)
        calcQualitys(info)
        setVisible(true)

        const isCustomSource = /^user_api/.test(settingState.setting['common.apiSource']);
        if (info.source === 'wy' && !info.meta?._full && !isCustomSource) {
          try {
            const detailedInfo = await fetchAndApplyDetailedQuality(info as LX.Music.MusicInfoOnline);
            if (detailedInfo.meta?._full) {
              setMusicInfo(detailedInfo)
              calcQualitys(detailedInfo)
            }
          } catch (e) {
            console.log('获取网易云详细音质失败', e)
          }
        }
      },
    }))

    const handleDownloadMusic = (qualityId: LX.Quality) => {
      void saveLastSelectQuality(qualityId)
      setVisible(false)
      if (musicInfo) {
        const target = showOneDriveDownload && selectedTarget === 'onedrive' ? 'onedrive' : 'local'
        addDownloadTask(musicInfo, qualityId, false, target);
        onDownloadInfo?.(musicInfo)
      }
    }

    const closeModal = () => setVisible(false)

    if (!visible || !musicInfo) return null

    return (
      <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
                
                {/* 头部 */}
                <View style={styles.header}>
                  <View style={styles.headerLeft} />
                  <View style={styles.headerTitleBox}>
                    <Text style={styles.songName} numberOfLines={1}>{musicInfo.name}</Text>
                    <Text style={styles.artistName} numberOfLines={1}>{musicInfo.singer}</Text>
                  </View>
                  <TouchableOpacity style={styles.headerRight} onPress={closeModal}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* 下载位置选择（如果开启了 OneDrive） */}
                {showOneDriveDownload && (
                  <View style={styles.targetRow}>
                     <TouchableOpacity style={styles.targetBtn} onPress={() => setSelectedTarget('local')}>
                        <Text style={selectedTarget === 'local' ? styles.targetTextActive : styles.targetText}>下载到本地</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.targetBtn} onPress={() => setSelectedTarget('onedrive')}>
                        <Text style={selectedTarget === 'onedrive' ? styles.targetTextActive : styles.targetText}>下载到 OneDrive</Text>
                     </TouchableOpacity>
                  </View>
                )}

                {/* 音质按钮列表 */}
                <View style={styles.listContainer}>
                  {playQualityList.length > 0 ? (
                    playQualityList.map((item) => (
                      <TouchableOpacity
                        key={item.key || item.id}
                        style={styles.qualityButton}
                        activeOpacity={0.7}
                        onPress={() => handleDownloadMusic(item.id)}
                      >
                        <Text style={styles.qualityText}>
                          {item.name} {item.size ? `- ${item.size}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyText}>该音源暂无可下载的音质</Text>
                    </View>
                  )}
                </View>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )
  }
)

// ⭐ 根据主题动态生成样式
const createStyles = (theme: any) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 遮罩层保持半透明
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContainer: { 
    width: '85%', 
    backgroundColor: theme.backgroundColor || theme.modalBackground || '#FFFFFF', // ⭐ 弹窗背景
    borderRadius: 16, 
    paddingVertical: 20, 
    paddingHorizontal: 15 
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerLeft: { width: 30 },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  songName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.fontColor || theme.textColor || '#333333', // ⭐ 歌曲名
    marginBottom: 4 
  },
  artistName: { 
    fontSize: 13, 
    color: theme.fontColor2 || theme.descColor || '#888888' // ⭐ 歌手名
  },
  headerRight: { width: 30, alignItems: 'flex-end' },
  closeIcon: { 
    fontSize: 20, 
    color: theme.fontColor2 || '#999999', 
    fontWeight: '300' 
  },
  targetRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  targetBtn: { paddingHorizontal: 12, paddingVertical: 6, marginHorizontal: 5 },
  targetText: { color: theme.fontColor2 || '#999999', fontSize: 13 },
  targetTextActive: { color: theme.primaryColor || '#3CB371', fontSize: 13, fontWeight: 'bold' },
  listContainer: { width: '100%' },
  qualityButton: { 
    backgroundColor: theme.buttonBackground || theme.cardBackground || '#F0F9F4', // ⭐ 按钮背景
    borderRadius: 8, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  qualityText: { 
    color: theme.primaryColor || '#3CB371', // ⭐ 按钮文字颜色
    fontSize: 15, 
    fontWeight: '500' 
  },
  emptyBox: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { color: theme.fontColor2 || '#999999', fontSize: 14 }
});
