<script setup>
import emblem from '@/assets/brand/wolf-emblem.png'

defineProps({
  size: { type: String, default: 'md' }, // 'md' | 'lg'
})
</script>

<template>
  <span class="group/logo inline-flex items-center gap-2.5 select-none" :class="size === 'lg' ? 'gap-4' : ''">
    <img
      :src="emblem"
      alt=""
      width="256"
      height="256"
      decoding="async"
      class="shrink-0 drop-shadow-[0_0_12px_rgb(247_134_15/0.25)] transition-transform duration-500 group-hover/logo:-rotate-6 group-hover/logo:scale-105"
      :class="size === 'lg' ? 'h-20 w-20' : 'h-11 w-11'"
    />
    <span class="flex flex-col leading-none">
      <span
        class="font-display font-black uppercase tracking-[0.02em] text-bone"
        :class="size === 'lg' ? 'text-5xl' : 'text-[1.6rem]'"
      >Black Wolf</span>
      <span
        class="font-sans font-medium text-ash"
        :class="size === 'lg' ? 'mt-1.5 text-sm tracking-[0.32em]' : 'mt-1 text-[0.68rem] tracking-[0.28em]'"
      >FITNESS CLUB</span>
    </span>
  </span>
</template>
