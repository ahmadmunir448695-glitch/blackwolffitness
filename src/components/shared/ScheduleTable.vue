<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { formatTime } from '@/utils/format.js'
import { programName } from '@/services/catalog.js'

/** Class timetable grouped by day. Expects classes already sorted. */
const props = defineProps({
  classes: { type: Array, required: true },
  showProgram: { type: Boolean, default: false },
})


const byDay = computed(() => {
  const groups = []
  props.classes.forEach((c) => {
    let group = groups.find((g) => g.day === c.day)
    if (!group) {
      group = { day: c.day, classes: [] }
      groups.push(group)
    }
    group.classes.push(c)
  })
  return groups
})
</script>

<template>
  <div class="overflow-x-auto border border-line">
    <table class="w-full min-w-[34rem] text-left">
      <caption class="sr-only">Class schedule</caption>
      <thead class="bg-coal text-sm text-ash">
        <tr>
          <th scope="col" class="px-5 py-3 font-semibold">Day</th>
          <th scope="col" class="px-5 py-3 font-semibold">Time</th>
          <th v-if="showProgram" scope="col" class="px-5 py-3 font-semibold">Program</th>
          <th scope="col" class="px-5 py-3 font-semibold">Level</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in byDay" :key="group.day">
          <tr v-for="(c, i) in group.classes" :key="`${group.day}-${c.start}-${c.program}`" class="border-t border-line">
            <th scope="row" class="px-5 py-3.5 font-semibold" :class="i ? 'text-transparent' : 'text-bone'">{{ group.day }}</th>
            <td class="px-5 py-3.5 tabular-nums">{{ formatTime(c.start) }} – {{ formatTime(c.end) }}</td>
            <td v-if="showProgram" class="px-5 py-3.5">
              <RouterLink :to="`/services/${c.program}`" class="hover:text-ember">{{ programName(c.program) }}</RouterLink>
            </td>
            <td class="px-5 py-3.5 text-ash">{{ c.level || 'All levels' }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
