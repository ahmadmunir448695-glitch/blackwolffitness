<script setup>
/**
 * Sortable data table. Cells render `row[col.key]` unless a `#cell-<key>`
 * slot is given. Sorting is reported via `sort` so the server can sort.
 *
 *   <DataTable :columns="cols" :rows="items" :sort="sort" @sort="setSort" @row-click="open">
 *     <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
 *   </DataTable>
 */
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  columns: { type: Array, required: true }, // { key, label, sortable?, class?, align? }
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  sort: { type: Object, default: () => ({ key: '', dir: 'desc' }) },
  loading: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  caption: { type: String, default: '' },
})
const emit = defineEmits(['sort', 'row-click', 'update:selected'])

function toggleSort(col) {
  if (!col.sortable) return
  const dir = props.sort.key === col.key && props.sort.dir === 'asc' ? 'desc' : 'asc'
  emit('sort', { key: col.key, dir })
}

function ariaSort(col) {
  if (props.sort.key !== col.key) return 'none'
  return props.sort.dir === 'asc' ? 'ascending' : 'descending'
}

function toggleRow(id) {
  const set = new Set(props.selected)
  set.has(id) ? set.delete(id) : set.add(id)
  emit('update:selected', [...set])
}
function toggleAll(e) {
  emit('update:selected', e.target.checked ? props.rows.map((r) => r[props.rowKey]) : [])
}
</script>

<template>
  <div class="p-card relative overflow-hidden">
    <div class="overflow-x-auto">
      <table class="p-table min-w-[44rem]">
        <caption v-if="caption" class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="selectable" class="w-10">
              <input
                type="checkbox"
                class="p-check"
                :checked="rows.length > 0 && selected.length === rows.length"
                aria-label="Select all rows"
                @change="toggleAll"
              />
            </th>
            <th v-for="col in columns" :key="col.key" :class="[col.class, col.align === 'right' ? 'text-right' : '']" :aria-sort="col.sortable ? ariaSort(col) : undefined" scope="col">
              <button
                v-if="col.sortable"
                type="button"
                class="inline-flex items-center gap-1 uppercase tracking-[inherit] transition-colors hover:text-bone"
                :class="sort.key === col.key ? 'text-bone' : ''"
                @click="toggleSort(col)"
              >
                {{ col.label }}
                <AppIcon
                  name="chevronDown"
                  class="h-3.5 w-3.5 transition-transform"
                  :class="[sort.key === col.key ? 'opacity-100' : 'opacity-30', sort.key === col.key && sort.dir === 'asc' ? 'rotate-180' : '']"
                />
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody :class="loading ? 'opacity-50 transition-opacity' : ''">
          <tr
            v-for="row in rows"
            :key="row[rowKey]"
            :class="clickable ? 'is-clickable' : ''"
            @click="clickable && emit('row-click', row)"
          >
            <td v-if="selectable" @click.stop>
              <input type="checkbox" class="p-check" :checked="selected.includes(row[rowKey])" :aria-label="`Select row ${row[rowKey]}`" @change="toggleRow(row[rowKey])" />
            </td>
            <td v-for="col in columns" :key="col.key" :class="[col.class, col.align === 'right' ? 'text-right' : '']">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ row[col.key] ?? '—' }}</slot>
            </td>
          </tr>
          <tr v-if="!rows.length && loading">
            <td :colspan="columns.length + (selectable ? 1 : 0)">
              <div class="space-y-2 py-2">
                <div v-for="n in 4" :key="n" class="skeleton h-8" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!rows.length && !loading" class="border-t border-line">
      <slot name="empty">
        <p class="px-6 py-10 text-center text-sm text-smoke">Nothing to show.</p>
      </slot>
    </div>
  </div>
</template>
