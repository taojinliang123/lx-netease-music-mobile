import { View, TouchableOpacity, Modal, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import Text from '@/components/common/Text'
import { getLastSelectQuality, saveLastSelectQuality } from '@/utils/data'
import { addTask as addDownloadTask } from '@/core/download';
import { fetchAndApplyDetailedQuality } from "@/utils/musicSdk/wy/musicDetail.js";

export interface MusicDownloadModalType {
  show: (info: LX.Music.MusicInfo) => void
}

interface MusicDownloadModalProps {
  onDownloadInfo: (info: LX.Music.MusicInfo) => void
}

export default forwardRef<MusicDownloadModalType, MusicDownloadModalProps>(
  ({ onDownloadInfo }, ref) => {
    const [visible, setVisible] = useState(false)
    const [musicInfo, setMusicInfo] = useState<LX.Music.MusicInfo | null>(null)
    const [playQualityList, setPlayQualityList] = useState<MusicOption[]>([])

    interface MusicOption {
      id: LX.Quality
      name: string
      size?: string | null
      key?: string
    }

    // ⭐ 完整的音质排序顺序（从低到高，补充了 192k, master_plus 等）
    const QUALITY_ORDER = [
      '128k', 
      '192k', 
      '320k', 
      'flac', 
      'hires', 
      'atmos', 
      'atmos_plus', 
      'master', 
      'master_plus'
    ];

    // 根据音源动态计算音质列表
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

      // @ts-ignore
      const qualitys = info.meta.qualitys || []
      const qualityMap: Record<string, MusicOption> = {}

      for (const element of qualitys) {
        if (!element || !element.type) continue;
        
        // 优先使用映射表里的名字，如果映射表里没有，就直接显示原始 type
        const displayName = nameMap.has(element.type) 
          ? nameMap.get(element.type) 
          : element.type.toUpperCase();

        qualityMap[element.type] = {
          id: element.type,
          name: displayName,
          size: element.size,
          key: element.type,
        }
      }

      // 转化为数组并按 QUALITY_ORDER 排序
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

        if (info.source === 'wy' && !info.meta._full) {
          const detailedInfo = await fetchAndApplyDetailedQuality(info as LX.Music.MusicInfoOnline);
          if (detailedInfo.meta._full) {
            setMusicInfo(detailedInfo)
            calcQualitys(detailedInfo)
          }
        }
      },
    }))

    const handleDownloadMusic = (qualityId: LX.Quality) => {
      void saveLastSelectQuality(qualityId)
      setVisible(false)
      
      if (musicInfo) {
        addDownloadTask(musicInfo, qualityId);
        onDownloadInfo?.(musicInfo)
      }
    }

    const closeModal = () => setVisible(false)

    if (!visible || !musicInfo) return null

    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={closeModal}
      >
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

                {/* 音质列表 / 空状态 */}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { width: 30 },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  songName: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  artistName: { fontSize: 13, color: '#888888' },
  headerRight: { width: 30, alignItems: 'flex-end' },
  closeIcon: { fontSize: 20, color: '#999999', fontWeight: '300' },
  listContainer: { width: '100%' },
  qualityButton: {
    backgroundColor: '#F0F9F4',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityText: { color: '#3CB371', fontSize: 15, fontWeight: '500' },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
  }
});
