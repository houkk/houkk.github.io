module.exports = {
  title: 'kk',
  description: 'Just playing around',
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    logo: '/avatar-small.png',
    lastUpdated: '最近更新',
    smoothScroll: true,
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Node.js', link: '/node/' },
      {
        text: 'CDC',
        items: [
          { text: 'Debezium', link: '/debezium/' }
        ]
      },
      { text: 'k8s', link: '/k8s/k8s-first' },
      { text: 'Github', link: 'https://github.com/houkk' },
    ],
    sidebar: {
      '/debezium/': ['', 'mysql', 'pg', 'mongo', 'debezium_docker'],
      '/k8s/': ['k8s-first', 'helm'],
      '/node/': ['', 'promise-simple']
    }
  },
  plugins: [
    '@vuepress/back-to-top',
    '@vuepress/medium-zoom'
  ]
}
