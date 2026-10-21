<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  variant: { type: String, default: 'primary' }, // primary | outline | ghost | dark
  size: { type: String, default: 'md' }, // sm | md | lg
  icon: { type: String, default: '' },
  iconRight: { type: String, default: '' },
  type: { type: String, default: 'button' },
  external: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const classes = computed(() => [
  'group inline-flex items-center justify-center gap-2 font-sans font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-200 select-none active:scale-[0.98]',
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
  props.block ? 'w-full' : '',
  {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-[0.95rem]',
    lg: 'h-14 px-8 text-base',
  }[props.size],
  {
    primary: 'btn-sheen cut-corner bg-ember text-ink hover:bg-ember-hi active:bg-ember-lo',
    outline: 'border border-bone/35 bg-ink/20 text-bone backdrop-blur-sm hover:border-ember hover:bg-ember/10 hover:text-ember',
    dark: 'btn-sheen cut-corner bg-ink text-bone hover:bg-graphite',
    ghost: 'px-0 h-auto text-ember underline decoration-1 underline-offset-[6px] hover:text-ember-hi',
  }[props.variant],
])

const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) {
    return {
      href: props.href,
      ...(props.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
      ...(props.disabled ? { 'aria-disabled': 'true', tabindex: -1 } : {}),
    }
  }
  return { type: props.type, disabled: props.disabled }
})
</script>

<template>
  <component :is="tag" v-bind="attrs" :class="classes">
    <AppIcon v-if="icon" :name="icon" class="h-5 w-5 shrink-0" />
    <slot />
    <AppIcon
      v-if="iconRight"
      :name="iconRight"
      class="h-[1.1rem] w-[1.1rem] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
    />
    <span v-if="external" class="sr-only">(opens in a new tab)</span>
  </component>
</template>
