module.exports = {
  options: {
    output: 'docs'
  },

  use: ['neutrino-preset-web', {
    hot: true,

    // polyfills: {
    //   async: false,
    //   babel: false
    // },

    html: {
      title: 'Some test for a job',
    }
  }]
};