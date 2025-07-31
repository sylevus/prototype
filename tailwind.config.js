/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        samuel: {
          'dark-red': '#8C1F28',
          'darker-red': '#591C21',
          'dark-teal': '#044040',
          'bright-red': '#D92525',
          'off-white': '#F2F2F2',
        },
      },
      typography: (theme) => ({
        invert: {
          css: {
            '--tw-prose-body': theme('colors.samuel.off-white'),
            '--tw-prose-headings': theme('colors.samuel.off-white'),
            '--tw-prose-lead': theme('colors.samuel.off-white'),
            '--tw-prose-links': theme('colors.samuel.bright-red'),
            '--tw-prose-bold': theme('colors.samuel.off-white'),
            '--tw-prose-counters': theme('colors.samuel.off-white'),
            '--tw-prose-bullets': theme('colors.samuel.off-white'),
            '--tw-prose-hr': theme('colors.samuel.dark-red'),
            '--tw-prose-quotes': theme('colors.samuel.off-white'),
            '--tw-prose-quote-borders': theme('colors.samuel.dark-red'),
            '--tw-prose-captions': theme('colors.samuel.off-white'),
            '--tw-prose-code': theme('colors.samuel.off-white'),
            '--tw-prose-pre-code': theme('colors.samuel.off-white'),
            '--tw-prose-pre-bg': theme('colors.samuel.darker-red'),
            '--tw-prose-th-borders': theme('colors.samuel.dark-red'),
            '--tw-prose-td-borders': theme('colors.samuel.dark-red'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}