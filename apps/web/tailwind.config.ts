import type { Config } from 'tailwindcss';

// Every value resolves to a CSS variable written from the theme saved in the admin dashboard.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--colors-primary)', sage: 'var(--colors-secondary)', accent: 'var(--colors-accent)',
        canvas: 'var(--colors-background)', surface: 'var(--colors-surface)', ink: 'var(--colors-text)',
        link: 'var(--colors-link)', sunny: 'var(--colors-sunny, #ffc93c)', sky: 'var(--colors-sky, #5bbce4)', coral: 'var(--colors-coral, #ff7a59)', berry: 'var(--colors-berry, #e0629a)', btn: 'var(--colors-buttonBg)', btntext: 'var(--colors-buttonText)', oak: 'var(--colors-brown)',
      },
      fontFamily: { heading: 'var(--fonts-heading)', body: 'var(--fonts-body)', script: 'var(--fonts-script)' },
      fontSize: {
        h1: 'var(--sizes-h1)', h2: 'var(--sizes-h2)', h3: 'var(--sizes-h3)', h4: 'var(--sizes-h4)',
        h5: 'var(--sizes-h5)', h6: 'var(--sizes-h6)', body: 'var(--sizes-body)', btn: 'var(--sizes-button)',
      },
      borderRadius: { card: 'var(--radius-card)', btn: 'var(--radius-button)' },
      boxShadow: { card: 'var(--shadow-card)' },
      spacing: { section: 'var(--spacing-section)' },
      maxWidth: { container: 'var(--container)' },
    },
  },
  plugins: [],
};
export default config;
