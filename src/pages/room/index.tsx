import { useEffect, useRef } from 'react'
import { styles } from './styles.css'
import { WsManager } from '/@/lib/websocket'

const Room: React.FC = () => {
  const wsManagerRef = useRef<WsManager | null>(null)
  useEffect(() => {
    wsManagerRef.current = new WsManager('')
    wsManagerRef.current.connect()
    return () => {
      wsManagerRef.current?.disconnect()
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.contentWrap}>
        <h1 className={styles.titleText}>ルーム</h1>
        <div className={styles.interfaceWrap}>
          <div className={styles.linkWrap}>
            <h2 className={styles.inputLabel}>招待リンク</h2>
            <div className={styles.inputButton}>
              <input
                className={styles.LinkText}
                readOnly
                value="www.kirakira"
              />
              <button type="button">コピー</button>
            </div>
          </div>

          <div className={styles.memberWrap}>
            <h2>メンバー</h2>
            {/* TODO */}
          </div>

          <button className={styles.startButtonWrap}>
            <div className={styles.startButtonContent}>スタート</div>
          </button>
        </div>

        <div className={styles.dummyText}>ルーム</div>
      </div>
    </div>
  )
}
export default Room
