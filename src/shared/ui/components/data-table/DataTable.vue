<script setup lang="ts" generic="T">
  import type { HTMLAttributes } from 'vue'
  import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/vue'
  import { cn } from 'cn'
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/shared/ui/components/table'
  import type { DataTableColumn } from './types'

  const props = defineProps<{
    /** Definición de las columnas, en orden. */
    columns: DataTableColumn[]
    /** Filas a renderizar. */
    rows: T[]
    /** Orden actual en formato `-campo` (descendente) o `campo` (ascendente). */
    sort?: string
    /** Devuelve una clave estable para cada fila. */
    rowKey: (row: T) => string | number
    /** Clases extra para el contenedor de la tabla. */
    class?: HTMLAttributes['class']
  }>()

  const emit = defineEmits<{
    (e: 'update:sort', value: string): void
  }>()

  defineSlots<{
    [columnId: string]: (props: { row: T; column: DataTableColumn }) => unknown
  }>()

  function activeSortKey(): string {
    return (props.sort ?? '').replace(/^-/, '')
  }

  function isActive(column: DataTableColumn): boolean {
    return Boolean(column.sortKey) && activeSortKey() === column.sortKey
  }

  function isDesc(column: DataTableColumn): boolean {
    return isActive(column) && (props.sort ?? '').startsWith('-')
  }

  function ariaSort(column: DataTableColumn): 'ascending' | 'descending' | 'none' | undefined {
    if (!column.sortKey) return undefined
    if (!isActive(column)) return 'none'
    return isDesc(column) ? 'descending' : 'ascending'
  }

  function toggleSort(column: DataTableColumn) {
    if (!column.sortKey) return
    if (isActive(column)) {
      emit('update:sort', isDesc(column) ? column.sortKey : `-${column.sortKey}`)
      return
    }
    emit('update:sort', column.defaultDesc ? `-${column.sortKey}` : column.sortKey)
  }
</script>

<template>
  <div :class="cn('overflow-hidden rounded-xl border border-border bg-card', props.class)">
    <Table>
      <TableHeader>
        <TableRow class="bg-surface/50 hover:bg-surface/50">
          <TableHead
            v-for="column in columns"
            :key="column.id"
            :class="
              cn(
                'p-4 text-xs font-semibold',
                column.align === 'right' ? 'text-right' : 'text-left',
                isActive(column) ? 'bg-muted text-foreground' : 'text-muted-foreground',
                column.headerClass,
              )
            "
            :aria-sort="ariaSort(column)"
          >
            <button
              v-if="column.sortKey"
              type="button"
              class="inline-flex cursor-pointer select-none items-center gap-1.5 transition-colors hover:text-foreground"
              @click="toggleSort(column)"
            >
              <span>{{ column.header }}</span>
              <ArrowUp
                v-if="isActive(column) && !isDesc(column)"
                :size="14"
                aria-hidden="true"
              />
              <ArrowDown v-else-if="isDesc(column)" :size="14" aria-hidden="true" />
              <ArrowUpDown v-else :size="14" aria-hidden="true" />
            </button>
            <span v-else>{{ column.header }}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="row in rows" :key="rowKey(row)" class="group hover:bg-muted/30">
          <TableCell
            v-for="column in columns"
            :key="column.id"
            :class="cn('p-4 whitespace-normal', column.cellClass)"
          >
            <slot :name="column.id" :row="row" :column="column" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
