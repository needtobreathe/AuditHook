<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Copy, Check, Code2, AlignLeft, Search, X } from 'lucide-vue-next';

const props = defineProps<{
  data: any;
}>();

const copied = ref(false);
const isRaw = ref(false);
const searchQuery = ref('');
const minimapEl = ref<HTMLDivElement | null>(null);
const scrollEl = ref<HTMLDivElement | null>(null);

const jsonString = computed(() => {
  if (typeof props.data === 'string') {
    try {
      return JSON.stringify(JSON.parse(props.data), null, 2);
    } catch {
      return props.data;
    }
  }
  return JSON.stringify(props.data, null, 2);
});

const lines = computed(() => jsonString.value.split('\n'));

const matchingLineIndices = computed(() => {
  if (!searchQuery.value.trim()) return new Set<number>();
  const q = searchQuery.value.toLowerCase();
  const result = new Set<number>();
  lines.value.forEach((line, idx) => {
    if (line.toLowerCase().includes(q)) result.add(idx);
  });
  return result;
});

const matchCount = computed(() => matchingLineIndices.value.size);

function copyJson() {
  navigator.clipboard.writeText(jsonString.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightLine(line: string, isMatch: boolean): string {
  let escaped = escapeHtml(line);

  escaped = escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-purple-400';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-sky-300 font-medium' : 'text-emerald-300';
      } else if (/true|false/.test(match)) {
        cls = 'text-amber-400 font-medium';
      } else if (/null/.test(match)) {
        cls = 'text-rose-400 italic';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );

  if (isMatch && searchQuery.value.trim()) {
    const q = escapeHtml(searchQuery.value);
    escaped = escaped.replace(
      new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      (m) => `<mark class="bg-amber-400/30 text-amber-200 rounded-sm">${m}</mark>`
    );
  }

  return escaped;
}

const highlightedLines = computed(() => {
  return lines.value.map((line, idx) => ({
    html: highlightLine(line, matchingLineIndices.value.has(idx)),
    isMatch: matchingLineIndices.value.has(idx)
  }));
});

const minimapLines = computed(() => {
  return lines.value.map((line, idx) => {
    const depth = (line.match(/^\s+/) || [''])[0].length / 2;
    const isMatch = matchingLineIndices.value.has(idx);
    const content = line.trim();
    return { depth, isMatch, hasContent: content.length > 0, idx };
  });
});

function jumpToFirstMatch() {
  if (!matchingLineIndices.value.size || !scrollEl.value) return;
  const firstIdx = [...matchingLineIndices.value][0];
  const lineHeight = 20;
  scrollEl.value.scrollTop = firstIdx * lineHeight - 80;
}

watch(searchQuery, () => {
  if (searchQuery.value.trim()) {
    jumpToFirstMatch();
  }
});

function clearSearch() {
  searchQuery.value = '';
}
</script>

<template>
  <div class="h-full flex flex-col bg-slate-950 rounded border border-slate-800/80 overflow-hidden font-mono text-xs">
    <div class="h-8 px-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between shrink-0">
      <div class="flex items-center space-x-1">
        <button
          @click="isRaw = false"
          :class="[
            'px-1.5 py-0.5 rounded text-[11px] transition flex items-center space-x-1',
            !isRaw ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          <Code2 class="w-3 h-3 text-indigo-400" />
          <span>JSON</span>
        </button>
        <button
          @click="isRaw = true"
          :class="[
            'px-1.5 py-0.5 rounded text-[11px] transition flex items-center space-x-1',
            isRaw ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          <AlignLeft class="w-3 h-3 text-indigo-400" />
          <span>Raw</span>
        </button>
      </div>

      <div class="flex items-center space-x-2">
        <div class="relative flex items-center">
          <Search class="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter payload keys..."
            class="bg-slate-900 border border-slate-800 rounded pl-6 pr-6 py-0.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600 w-44 transition"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-1.5 text-slate-500 hover:text-slate-300"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <span v-if="searchQuery.trim()" class="text-[10px] text-slate-500">
          <span :class="matchCount > 0 ? 'text-amber-400' : 'text-rose-400'">
            {{ matchCount }}
          </span> matches
        </span>

        <span v-else class="text-[10px] text-slate-600">{{ lines.length }} lines</span>

        <button
          @click="copyJson"
          class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 transition flex items-center space-x-1 border border-slate-800 text-[11px]"
        >
          <Check v-if="copied" class="w-3 h-3 text-emerald-400" />
          <Copy v-else class="w-3 h-3" />
          <span>{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div
        ref="scrollEl"
        class="flex-1 overflow-auto p-2 text-xs leading-5 select-text"
      >
        <div v-if="!isRaw" class="table w-full">
          <div
            v-for="(item, idx) in highlightedLines"
            :key="idx"
            :class="[
              'table-row',
              item.isMatch ? 'bg-amber-500/8' : 'hover:bg-slate-900/30'
            ]"
          >
            <span
              :class="[
                'table-cell select-none pr-3 text-right font-mono text-[10px] w-8 sticky left-0',
                item.isMatch ? 'text-amber-500' : 'text-slate-700'
              ]"
            >
              {{ idx + 1 }}
            </span>
            <span
              v-html="item.html"
              class="table-cell font-mono text-slate-300 whitespace-pre"
            ></span>
          </div>
        </div>
        <pre v-else class="font-mono text-slate-300 whitespace-pre-wrap break-all p-2">{{ jsonString }}</pre>
      </div>

      <div
        v-if="!isRaw && lines.length > 30"
        ref="minimapEl"
        class="w-10 shrink-0 border-l border-slate-800/60 bg-slate-950/80 overflow-hidden relative cursor-default"
        title="Minimap"
      >
        <div class="absolute inset-0 flex flex-col pt-0.5">
          <div
            v-for="ml in minimapLines"
            :key="ml.idx"
            class="h-[2px] flex items-center"
            :style="{ paddingLeft: Math.min(ml.depth * 1.5, 8) + 'px' }"
          >
            <div
              v-if="ml.hasContent"
              :class="[
                'rounded-sm',
                ml.isMatch
                  ? 'bg-amber-400 h-[2px]'
                  : 'bg-slate-700/60 h-[1px]'
              ]"
              :style="{ width: ml.isMatch ? '28px' : Math.min(24 - ml.depth * 2, 20) + 'px' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
