/** Definición de una columna de un `DataTable`. */
export interface DataTableColumn {
  /** Identificador único; también nombra el slot de celda de la columna. */
  id: string
  /** Texto visible en el encabezado. */
  header: string
  /** Campo de ordenamiento; si está presente, la columna es ordenable. */
  sortKey?: string
  /** Dirección aplicada la primera vez que la columna se activa (por defecto ascendente). */
  defaultDesc?: boolean
  /** Alineación del encabezado y las celdas (por defecto izquierda). */
  align?: 'left' | 'right'
  /** Clases extra para la celda del encabezado. */
  headerClass?: string
  /** Clases extra para las celdas del cuerpo. */
  cellClass?: string
}
