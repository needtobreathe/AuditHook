import { ref } from 'vue';

const isDark = ref(true);

export function useTheme() {
  function initTheme() {
    const saved = localStorage.getItem('audithook-theme');
    if (saved) {
      isDark.value = saved === 'dark';
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    localStorage.setItem('audithook-theme', isDark.value ? 'dark' : 'light');
    applyTheme();
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }

  return {
    isDark,
    initTheme,
    toggleTheme
  };
}
