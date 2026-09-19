<script setup lang="ts">
defineProps<{
  size?: number;
}>();
</script>

<template>
  <svg
    :width="size || 28"
    :height="size || 28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="shrink-0"
  >
    <circle
      cx="16"
      cy="16"
      r="13"
      stroke="#1e293b"
      stroke-width="2"
      stroke-dasharray="3 3"
    />
    <path
      d="M16 3C23.1797 3 29 8.8203 29 16C29 20.2536 26.9536 24.0305 23.8 26.37"
      stroke="url(#audit_hook_glow)"
      stroke-width="2.5"
      stroke-linecap="round"
    />
    <path
      d="M9 13V18.5C9 22.0899 11.9101 25 15.5 25C19.0899 25 22 22.0899 22 18.5V10C22 8.34315 20.6569 7 19 7C17.3431 7 16 8.34315 16 10V18"
      stroke="#10b981"
      stroke-width="2.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="16" cy="18" r="2" fill="#38bdf8" />
    <defs>
      <linearGradient id="audit_hook_glow" x1="16" y1="3" x2="29" y2="27" gradientUnits="userSpaceOnUse">
        <stop stop-color="#10b981" />
        <stop offset="0.5" stop-color="#06b6d4" />
        <stop offset="1" stop-color="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
</template>
