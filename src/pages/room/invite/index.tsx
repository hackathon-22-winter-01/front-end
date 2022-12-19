import React, { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { styles } from './styles.css'
import { useClient } from '/@/api/'
import useSWR from 'swr'
import { getRoom } from '/@/api/rooms/[roomId]'
import { createRoom } from '/@/api/rooms/new'
import { joinRoom } from '/@/api/rooms/join'

function useQuery() {
  const { search } = useLocation()

  return useMemo(() => new URLSearchParams(search), [search])
}

const New = () => {
  const query = useQuery()
  const id = useMemo(() => {
    return query.get('roomId')
  }, [query])
  const client = useClient()

  const navigate = useNavigate()

  const { data, error } = useSWR(
    id !== null ? ['/api/room', id] : null,
    getRoom(client),
  )

  const [name, setName] = useState<string>('')
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value)
    },
    [setName],
  )

  const inviteInfo = useMemo(() => {
    if (id === null) {
      return null
    }

    if (error) {
      console.error(error)
      return null
    }

    if (data === undefined) {
      return null
    }

    const inviteOwnerName = data.players[0].name

    return `${inviteOwnerName}に招待されました！`
  }, [id])

  const enterRoom = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (name === '') {
        return
      }

      if (inviteInfo === null) {
        try {
          const res = await createRoom(client)(name)

          navigate(`/room/${res.id}`, {
            state: res.players,
          })
          // TODO
        } catch (e) {
          console.error(e)
        }
      } else {
        try {
          const res = await joinRoom(client)(id!, name)

          navigate(`/room/${res.id}`, {
            state: res.players,
          })
          // TODO
        } catch (e) {
          console.error(e)
        }
      }
      return
    },
    [client, name, id],
  )

  return (
    <div className={styles.container}>
      <div className={styles.contentWrap}>
        <h1 className={styles.titleText}>
          {inviteInfo !== null ? inviteInfo : 'ルームを立てる'}
        </h1>
        <form className={styles.interfaceWrap} onSubmit={enterRoom}>
          <label className={styles.inputLabel}>
            プレイヤー名
            <input
              type="text"
              className={styles.inputText}
              value={name}
              onChange={handleChange}
            />
          </label>

          <button
            type="submit"
            className={styles.joinButton}
            disabled={name === ''}
          >
            部屋に入る
          </button>
        </form>

        <div className={styles.dummyText}>
          {inviteInfo !== null ? inviteInfo : 'ルームを立てる'}
        </div>
      </div>
    </div>
  )
}
export default New
