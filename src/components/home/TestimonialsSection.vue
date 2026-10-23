<script setup>
import { computed } from 'vue'
import { testimonials } from '@/services/catalog.js'

/**
 * Member testimonials. Placeholder entries are only rendered during
 * development (labelled as placeholders). On the live site this section is
 * hidden until at least one real testimonial is added.
 */
const isDev = import.meta.env.DEV
const real = testimonials.filter((t) => !t.placeholder)
const items = computed(() => (real.length ? real : isDev ? testimonials : []))
const showingPlaceholders = computed(() => !real.length && isDev)
</script>

<template>
  <section v-if="items.length" class="border-t border-line py-20 lg:py-28" aria-labelledby="testimonials-title">
    <div class="site-container">
      <h2 id="testimonials-title" class="font-display text-title font-black uppercase">What members say</h2>
      <p v-if="showingPlaceholders" class="mt-4 inline-flex border border-dashed border-ember/60 px-3 py-1.5 text-sm text-ember">
        Placeholder layout. These are not real reviews and are hidden on the live site. Add real ones in src/data/mock/testimonials.js.
      </p>
      <ul class="mt-10 grid gap-3 lg:grid-cols-3">
        <li
          v-for="(item, i) in items"
          :key="i"
          class="fx-spot flex flex-col justify-between gap-8 bg-coal p-7"
          :class="item.placeholder ? 'border border-dashed border-line' : ''"
        >
          <blockquote>
            <p class="text-lg leading-relaxed" :class="item.placeholder ? 'text-smoke' : 'text-bone'">“{{ item.quote }}”</p>
          </blockquote>
          <p class="text-sm">
            <span class="font-semibold" :class="item.placeholder ? 'text-smoke' : 'text-bone'">{{ item.name }}</span>
            <span class="block text-smoke">{{ item.detail }}</span>
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>
