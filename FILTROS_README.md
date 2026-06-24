# Documentación: Nuevos Filtros del Dashboard (Región y Rango de Fechas)

## 📋 Resumen de Cambios

Se han implementado **dos nuevos filtros** en el Dashboard BI:
1. **Filtro por Región** - Filtra datos por región geográfica
2. **Filtro por Rango de Fechas** - Filtra datos en un periodo específico (Desde-Hasta)

Estos filtros funcionan **independientemente** del filtro de mes existente y se pueden **combinar** entre sí.

---

## 🔧 Cambios en el Backend

### Archivo: `app/Http/Controllers/DashboardController.php`

#### 1. **Obtención de Parámetros de Entrada**
```php
$mesFiltro = $request->input('mes');
$regionFiltro = $request->input('region');
$fechaInicio = $request->input('fecha_inicio');
$fechaFin = $request->input('fecha_fin');
```
El controlador ahora recibe 4 parámetros en lugar de 1:
- `mes`: Número del mes (1-12)
- `region`: Nombre de la región
- `fecha_inicio`: Fecha inicial en formato YYYY-MM-DD
- `fecha_fin`: Fecha final en formato YYYY-MM-DD

#### 2. **Obtención de Regiones Disponibles**
```php
$regiones = DB::table('dim_clientes')
    ->select('region')
    ->distinct()
    ->orderBy('region')
    ->pluck('region')
    ->toArray();
```
Se consulta la tabla `dim_clientes` para obtener todas las regiones únicas disponibles.
Esto se pasa al frontend para poblar el dropdown de regiones.

#### 3. **Función Auxiliar de Filtros de Fecha**
```php
$aplicarFiltrosFecha = function ($query, $mesFiltro, $fechaInicio, $fechaFin) {
    if ($mesFiltro) {
        // Si hay filtro de mes, lo usa
        $inicio = 20240000 + ($mesFiltro * 100) + 1;
        $fin = 20240000 + ($mesFiltro * 100) + 31;
        return $query->whereBetween('tiempo_key', [$inicio, $fin]);
    } elseif ($fechaInicio && $fechaFin) {
        // Si hay rango de fechas, convierte y lo usa
        $inicio = intval(str_replace('-', '', $fechaInicio));
        $fin = intval(str_replace('-', '', $fechaFin));
        return $query->whereBetween('tiempo_key', [$inicio, $fin]);
    }
    return $query;
};
```

**¿Cómo funciona?**
- Si se selecciona un mes, **usa solo el mes** (ignora rango de fechas)
- Si NO hay mes pero hay rango de fechas, **usa el rango**
- Si no hay ninguno, **devuelve todos los datos del año**

**Conversión de Fechas:**
- Las fechas vienen como `YYYY-MM-DD` (ej: 2024-01-15)
- Se convierten a formato `YYYYMMDD` (ej: 20240115)
- Se usa `whereBetween` en la columna `tiempo_key` de las tablas de hechos

#### 4. **Aplicación de Filtros en Cada Query**

Cada query fue modificada de este formato:
```php
// ANTES
->when($mesFiltro, function ($query, $mesFiltro) {
    $inicio = 20240000 + ($mesFiltro * 100) + 1;
    $fin = 20240000 + ($mesFiltro * 100) + 31;
    return $query->whereBetween('tiempo_key', [$inicio, $fin]);
})
```

A este formato:
```php
// AHORA
if ($regionFiltro) {
    $query->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
        ->where('dim_clientes.region', $regionFiltro);
}
$query = $aplicarFiltrosFecha($query, $mesFiltro, $fechaInicio, $fechaFin);
```

**Las queries modificadas son:**
1. `kpis` - KPIs generales
2. `ventasPorRegion` - Ingresos por región
3. `metodosPago` - Distribución de métodos de pago
4. `estadoVentas` - Tasa de transacciones completadas vs canceladas
5. `topProductos` - Top 5 productos más vendidos
6. `tendenciaTemporal` - Tendencia de ventas en el tiempo

#### 5. **Datos Retornados a Inertia**
```php
return Inertia::render('Dashboard', [
    'kpis' => $kpis,
    'ventasPorRegion' => $ventasPorRegion,
    'metodosPago' => $metodosPago,
    'estadoVentas' => $estadoVentas,
    'topProductos' => $topProductos,
    'tendenciaTemporal' => $tendenciaTemporal,
    'filtroActual' => $mesFiltro,
    'regiones' => $regiones,              // ✨ NUEVO
    'regionActual' => $regionFiltro,      // ✨ NUEVO
    'fechaInicio' => $fechaInicio,        // ✨ NUEVO
    'fechaFin' => $fechaFin               // ✨ NUEVO
]);
```

---

## 🎨 Cambios en el Frontend

### Archivo: `resources/js/Pages/Dashboard.jsx`

#### 1. **Nueva Función de Cambio de Filtros**
```jsx
const cambiarFiltros = (mes = null, region = null, inicio = null, fin = null) => {
    const params = {};
    
    if (mes !== null) params.mes = mes;
    if (region !== null) params.region = region;
    if (inicio !== null) params.fecha_inicio = inicio;
    if (fin !== null) params.fecha_fin = fin;
    
    router.get('/dashboard', params, { preserveState: true, preserveScroll: true });
};
```

**Ventajas:**
- Solo envía los parámetros que cambian
- Permite cambiar un filtro sin afectar los otros
- Mantiene el estado y scroll de la página

#### 2. **Nuevos Props Recibidos**
```jsx
export default function Dashboard({ 
    auth, 
    kpis, 
    ventasPorRegion, 
    metodosPago, 
    estadoVentas, 
    topProductos, 
    tendenciaTemporal, 
    filtroActual, 
    regiones,           // ✨ NUEVO
    regionActual,       // ✨ NUEVO
    fechaInicio,        // ✨ NUEVO
    fechaFin            // ✨ NUEVO
})
```

#### 3. **Nuevo Select de Regiones**
```jsx
<div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200">
    <Filter className="w-4 h-4 text-gray-500" />
    <select
        className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
        value={regionActual || ''}
        onChange={(e) => cambiarFiltros(filtroActual || null, e.target.value || null, fechaInicio || null, fechaFin || null)}
    >
        <option value="">Todas las Regiones</option>
        {regiones && regiones.map((region) => (
            <option key={region} value={region}>
                {region}
            </option>
        ))}
    </select>
</div>
```

**Características:**
- Opción por defecto: "Todas las Regiones"
- Los valores se cargan dinámicamente desde el backend
- Al cambiar, mantiene los otros filtros activos

#### 4. **Nuevo Control de Rango de Fechas**
```jsx
<div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200">
    <Filter className="w-4 h-4 text-gray-500" />
    <input
        type="date"
        className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
        value={fechaInicio || ''}
        onChange={(e) => cambiarFiltros(null, regionActual || null, e.target.value || null, fechaFin || null)}
        placeholder="Desde"
    />
    <span className="text-gray-400">-</span>
    <input
        type="date"
        className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
        value={fechaFin || ''}
        onChange={(e) => cambiarFiltros(null, regionActual || null, fechaInicio || null, e.target.value || null)}
        placeholder="Hasta"
    />
</div>
```

**Características:**
- Dos campos: Desde y Hasta
- Usan `<input type="date">` para mejor UX
- El navegador valida el formato de fecha automáticamente
- Separados por un guión visual

#### 5. **Exportación Mejorada**
```jsx
const handleExportarExcel = () => {
    const datosExportar = { /* ... */ };
    let nombreArchivo = 'Resultados';
    if (filtroActual) nombreArchivo += `_mes_${filtroActual}`;
    if (regionActual) nombreArchivo += `_${regionActual}`;
    if (fechaInicio && fechaFin) nombreArchivo += `_${fechaInicio}_a_${fechaFin}`;
    exportarExcel(datosExportar, nombreArchivo);
};
```

**Mejora:**
- El nombre del archivo incluye los filtros activos
- Ej: `Resultados_mes_6_Norte_2024-06-01_a_2024-06-30.xlsx`

---

## 🔄 Flujo de Funcionamiento

```
Usuario selecciona filtros
        ↓
cambiarFiltros() construye params
        ↓
router.get('/dashboard', params)
        ↓
DashboardController::index recibe params
        ↓
Se aplican los filtros en cada query
        ↓
Se retornan datos filtrados + metadatos (regiones, valores actuales)
        ↓
Frontend renderiza con nuevos datos
```

---

## 📱 Ejemplo de Uso

### Caso 1: Filtrar por Región "Norte"
```
URL: /dashboard?region=Norte
Backend: Filtra todas las queries por region='Norte'
Frontend: Muestra "Norte" seleccionado en el dropdown
```

### Caso 2: Filtrar por Rango de Fechas
```
URL: /dashboard?fecha_inicio=2024-06-01&fecha_fin=2024-06-30
Backend: Filtra con tiempo_key entre 20240601 y 20240630
Frontend: Muestra las fechas en los inputs
```

### Caso 3: Combinar Mes + Región
```
URL: /dashboard?mes=6&region=Centro
Backend: Filtra por mes 6 (ignora fecha_inicio/fin) Y por región Centro
Frontend: Muestra "Junio" en mes y "Centro" en región
```

### Caso 4: Combinar Rango de Fechas + Región
```
URL: /dashboard?fecha_inicio=2024-06-01&fecha_fin=2024-06-15&region=Sur
Backend: Filtra por rango de fechas Y por región Sur
Frontend: Muestra ambos filtros activos
```

---

## ⚙️ Notas Técnicas

### Formato de tiempo_key
- Se usa el formato `YYYYMMDD` en la tabla `dim_tiempo`
- Para convertir: `intval(str_replace('-', '', '2024-06-15'))` → `20240615`

### Prioridad de Filtros
- Si hay `mes` + `fecha_inicio/fecha_fin`, **el mes tiene prioridad**
- El filtro de región se aplica **siempre que esté presente**

### Rendimiento
- Se agregaron JOINs dinámicos solo cuando es necesario (region presente)
- Las queries siguen optimizadas con GROUP BY y ORDER BY

---

## 🧪 Testing

### Pruebas recomendadas:

1. **Filtro de Región**
   - [ ] Seleccionar cada región
   - [ ] Verificar que KPIs cambian
   - [ ] Verificar gráficos se actualizan

2. **Rango de Fechas**
   - [ ] Seleccionar fecha inicio
   - [ ] Seleccionar fecha fin
   - [ ] Verificar combinación Mes + Rango (debe ganar mes)

3. **Exportación**
   - [ ] Exportar sin filtros
   - [ ] Exportar con región
   - [ ] Exportar con fechas
   - [ ] Verificar nombres de archivo

4. **Combinaciones**
   - [ ] Mes + Región
   - [ ] Fechas + Región
   - [ ] Las tres (debe ignorar fechas)

---

## 📝 Sumario de Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `app/Http/Controllers/DashboardController.php` | Agregó parámetros de entrada, función auxiliar, filtros en 6 queries, datos nuevos en retorno |
| `resources/js/Pages/Dashboard.jsx` | Nueva función `cambiarFiltros()`, nuevos props, 2 nuevos controles de filtro, exportación mejorada |

---

## 🚀 Próximos Pasos Sugeridos

- [ ] Agregar filtro por **Método de Pago**
- [ ] Agregar filtro por **Estado de Venta**
- [ ] Implementar **filtros guardados** (favoritos)
- [ ] Agregar comparativa **período anterior**
- [ ] Reset de filtros con un botón

