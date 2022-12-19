import { style } from '@vanilla-extract/css'
import { InShadow } from '/@/vars.css'

export const styles = {
  container: style({
    display: 'grid',
    placeItems: 'center',
    textAlign: 'left',

    position: 'relative',

    backgroundColor: '#71DBF2',
    height: '100%',
    width: '100%',
  }),

  contentWrap: style({
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '1088px',
    rowGap: '64px',
  }),

  titleText: style({
    fontSize: '36px',
    lineHeight: '36px',
    margin: '0',
  }),
  interfaceWrap: style({
    padding: '64px 0',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '48px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    alignItems: 'center',
  }),

  linkWrap: style({
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
    maxWidth: '480px',
  }),

  inputButton: style({}),
  inputLabel: style({
    fontSize: '28px',
    lineHeight: '1',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
  }),
  LinkText: style({
    height: '64px',
    fontSize: '28px',
    lineHeight: '64px',

    boxShadow: InShadow,
    padding: '0 20px',

    backgroundColor: 'rgba(240, 240, 240, 1)',
    border: '0',
  }),

  memberWrap: style({}),

  startButtonWrap: style({
    height: '96px',
    borderRadius: '12px',
    padding: '8px',
    background: '#ffffff',

    maxWidth: '304px',
    width: '100%',
    boxShadow: InShadow,

    position: 'relative',

    cursor: 'pointer',
    ':disabled': {
      borderColor: '#666666',
      cursor: 'not-allowed',
    },

    selectors: {
      '&:disabled::after': {
        content: '""',
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
      },
    },

    ':before': {
      content: '""',
      position: 'absolute',
    },
  }),
  startButtonContent: style({
    fontSize: '28px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '#A3FFAC',
    borderRadius: '8px',
    boxShadow: InShadow,

    height: '100%',
    width: '100%',
  }),

  dummyText: style({
    fontSize: '36px',
    lineHeight: '36px',
    color: 'transparent',
    userSelect: 'none',
  }),
}
