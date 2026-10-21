<script setup>
defineProps({
  section: { type: Object, required: true },
  headingId: { type: String, required: true },
})
</script>

<template>
  <div class="site-container">
    <div class="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
      <div>
        <h2 :id="headingId" class="font-display text-title font-black uppercase">{{ section.heading }}</h2>
        <p v-if="section.intro" class="mt-4 max-w-md text-lg text-ash">{{ section.intro }}</p>
      </div>
      <dl class="grid gap-x-10 sm:grid-cols-2">
        <div v-for="item in section.items" :key="item.title" class="border-t border-line py-6">
          <dt class="font-display text-2xl font-bold uppercase leading-none text-ember">{{ item.title }}</dt>
          <dd class="mt-3 leading-relaxed text-ash">{{ item.text }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
