// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
const lightTheme = themes.github;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Jiahao Chen',
  favicon: 'img/favicon.ico',
  noIndex: true,
  // Set the production url of your site here
  url: 'https://jiahao.vercel.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'jiahao-c', // Usually your GitHub org/user name.
  projectName: 'jiahao-space', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),

        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Jiahao',
        logo: {
          alt: 'Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Blog',
          },
          {
            href: "/projects",
            position: "left",
            label: "Projects",
          },
          {
            href: "https://github.com/jiahao-c",
            label: "GitHub",
            position: "right",
          },
          {
            href: "https://jiahao.vercel.app/fly",
            label: "Travel",
            position: "right",
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `© ${new Date().getFullYear()} Built with Docusaurus.`,
      },
      prism: {
        theme: lightTheme,
      },
    }),
};

module.exports = config;
