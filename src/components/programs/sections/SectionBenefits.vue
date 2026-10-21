<script setup>
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container">
    <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
    <ul
      class="mt-10 grid gap-px border border-line bg-line sm:grid-cols-2"
      :class="section.items.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'"
    >
      <li v-for="item in section.items" :key="item.title" class="bg-ink p-6">
        <h3 class="text-lg font-semibold text-bone">{{ item.title }}</h3>
        <p class="mt-2 leading-relaxed text-ash">{{ item.text }}</p>
      </li>
    </ul>
  </div>
</template>
