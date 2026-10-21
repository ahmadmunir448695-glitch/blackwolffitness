<script setup>
defineProps({ count: { type: Number, default: 4 } })
</script>

<template>
  <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
    <li v-for="n in count" :key="n" class="bg-coal">
      <div class="skeleton aspect-[4/5]" />
      <div class="space-y-3 p-5">
        <div class="skeleton h-3 w-1/2" />
        <div class="skeleton h-6 w-3/4" />
        <div class="skeleton h-3 w-2/3" />
      </div>
    </li>
  </ul>
</template>
