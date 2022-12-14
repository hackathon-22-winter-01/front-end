import { style } from '@vanilla-extract/css'
import { Game } from '/@/objects/Game'

export const styles = {
  pageContainer: style({
    height: '100%',
    width: '100%',
  }),
  gameWrap: style({
    height: '100%',
    width: '100%',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: 'cyan',
  }),
  gameContainer: style({
    aspectRatio: '1444 / 892', // `${Game.WIDTH} / ${Game.HEIGHT}`,
    backgroundColor: 'green',
    margin: 'auto',
  }),
}
