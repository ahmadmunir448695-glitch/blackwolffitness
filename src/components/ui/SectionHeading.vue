<script setup>
defineProps({
  title: { type: String, required: true },
  intro: { type: String, default: '' },
  level: { type: String, default: 'h2' },
  size: { type: String, default: 'title' }, // title | display | heading
  tone: { type: String, default: 'dark' }, // dark | light
  align: { type: String, default: 'left' },
})
</script>

<template>
  <div :class="align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'">
    <component
      :is="level"
      class="font-display font-extrabold uppercase"
      :class="[
        { title: 'text-title', display: 'text-display', heading: 'text-heading' }[size],
        tone === 'light' ? 'text-graphite' : 'text-bone',
      ]"
    >
      {{ title }}
    </component>
    <p
      v-if="intro"
      class="mt-4 text-lg leading-relaxed"
      :class="[tone === 'light' ? 'text-slate' : 'text-ash', align === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl']"
    >
      {{ intro }}
    </p>
    <slot />
  </div>
</template>
