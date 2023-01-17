export default {
  extract: {
    include: ['./**/*.html'],
  },
  safelist: ['prose', 'prose-sm', 'm-auto'],
  darkMode: 'class',
  extend: {
    lineClamp: {
      1: '1',
    },
  },
  plugins: [require('windicss/plugin/line-clamp'), require('windicss/plugin/forms')],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        error: '#e55039',
        info: '#3498db',
        info2: '#0652DD',
        success: '#78e08f',
        warning: '#f6b93b',
        transparent: 'transparent',

        dark: {
          100: '#0D0C22',
          80: '#3D3D4E',
          60: '#6E6D7A',
          40: '#9E9EA7',
          20: '#CFCED3',
          10: '#E7E7E9',
          5: '#F3F3F4',
        },
      },
    },
  },
};
