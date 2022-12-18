import { style } from '@vanilla-extract/css'

export const styles = {
  container: style({
    display: 'grid',
    placeItems: 'center',
    textAlign: 'left',
  }),
  contentWrap: style({
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100%',
    width: '752px',
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
    backgroundColor: '#71DBF2',
    borderRadius: '12px',
    alignItems: 'center',
  }),

  inputLabel: style({
    fontSize: '28px',
    lineHeight: '1',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
  }),
  inputText: style({
    height: '64px',
    fontSize: '28px',
    lineHeight: '64px',

    boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.35)',
    padding: '0 20px',
  }),

  joinButton: style({
    height: '96px',
    fontSize: '28px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '#A3FFAC',
    borderRadius: '8px',

    border: 'solid 4px #ffffff',
    maxWidth: '304px',

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
  }),

  dummyText: style({
    fontSize: '36px',
    lineHeight: '36px',
    color: 'transparent',
    userSelect: 'none',
  }),
}

// export const interfaceTextBox = style({

// })
