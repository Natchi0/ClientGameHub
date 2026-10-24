import type { Component, DefineComponent } from 'vue'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/vue'
import { describe, expect, it } from 'vitest'
import { DataTable } from '../index'
import type { DataTableColumn } from '../types'

interface Row {
  id: number
  name: string
}

const columns: DataTableColumn[] = [
  { id: 'id', header: 'ID' },
  { id: 'name', header: 'Nombre', sortKey: 'name' },
  { id: 'createdAt', header: 'Creada', sortKey: 'createdAt', defaultDesc: true },
]

const rows: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
]

// `DataTable` es genérico (`T`) y Vue Test Utils no lo infiere al montarlo,
// así que fijamos la forma de las props para tipar `rowKey` y los slots con `Row`.
const TestDataTable = DataTable as unknown as DefineComponent<{
  columns: DataTableColumn[]
  rows: Row[]
  sort?: string
  rowKey: (row: Row) => string | number
}>

/** Renderiza un icono lucide con el mismo aspecto que dentro del componente. */
function iconHtml(icon: Component): string {
  return mount({ render: () => h(icon, { size: 14, 'aria-hidden': 'true' }) }).html()
}

function mountTable(sort?: string) {
  return mount(TestDataTable, {
    props: { columns, rows, sort, rowKey: (row: Row) => row.id },
    slots: {
      id: ({ row }: { row: Row }) => `#${row.id}`,
      name: ({ row }: { row: Row }) => row.name,
      createdAt: () => 'hace poco',
    },
  })
}

type TableWrapper = ReturnType<typeof mountTable>

function headerCells(wrapper: TableWrapper) {
  return wrapper.findAll('thead th')
}

function lastSort(wrapper: TableWrapper): unknown[] | undefined {
  const calls = wrapper.emitted('update:sort')
  return calls?.[calls.length - 1]
}

describe('DataTable', () => {
  it('renderiza una fila por cada columna y sus celdas', () => {
    const wrapper = mountTable('-createdAt')

    expect(headerCells(wrapper)).toHaveLength(3)
    expect(wrapper.text()).toContain('#1')
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).toContain('hace poco')
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('muestra el icono de doble flecha en las columnas ordenables inactivas', () => {
    const wrapper = mountTable()
    const [idCell, nameCell, createdAtCell] = headerCells(wrapper)

    // La columna no ordenable no lleva icono.
    expect(idCell!.find('svg').exists()).toBe(false)
    expect(nameCell!.find('svg').html()).toBe(iconHtml(ArrowUpDown))
    expect(createdAtCell!.find('svg').html()).toBe(iconHtml(ArrowUpDown))
  })

  it('muestra la flecha de dirección en la columna que está ordenando', () => {
    const ascending = mountTable('name')
    expect(headerCells(ascending)[1]!.find('svg').html()).toBe(iconHtml(ArrowUp))

    const descending = mountTable('-name')
    expect(headerCells(descending)[1]!.find('svg').html()).toBe(iconHtml(ArrowDown))
  })

  it('refleja la dirección activa en aria-sort', () => {
    const wrapper = mountTable('-name')
    const [idCell, nameCell] = headerCells(wrapper)

    expect(nameCell!.attributes('aria-sort')).toBe('descending')
    expect(idCell!.attributes('aria-sort')).toBeUndefined()
  })

  it('al clickear una columna inactiva ordena en su dirección por defecto', async () => {
    // 'name' ordena ascendente por defecto.
    const ascending = mountTable('-createdAt')
    await headerCells(ascending)[1]!.find('button').trigger('click')
    expect(lastSort(ascending)).toEqual(['name'])

    // 'createdAt' ordena descendente por defecto.
    const descending = mountTable('name')
    await headerCells(descending)[2]!.find('button').trigger('click')
    expect(lastSort(descending)).toEqual(['-createdAt'])
  })

  it('al clickear la columna activa alterna la dirección', async () => {
    const ascending = mountTable('name')
    await headerCells(ascending)[1]!.find('button').trigger('click')
    expect(lastSort(ascending)).toEqual(['-name'])

    const descending = mountTable('-name')
    await headerCells(descending)[1]!.find('button').trigger('click')
    expect(lastSort(descending)).toEqual(['name'])
  })

  it('las columnas no ordenables no emiten orden', async () => {
    const wrapper = mountTable()

    expect(headerCells(wrapper)[0]!.find('button').exists()).toBe(false)
    expect(wrapper.emitted('update:sort')).toBeUndefined()
  })
})
