<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $mesFiltro = $request->input('mes');
        $fechaInicio = $request->input('fecha_inicio');
        $fechaFin = $request->input('fecha_fin');

        if ($user->role !== 'admin') {
            $regionFiltro = $user->zona_asignada ?? 'Centro';
        } else {
            $regionFiltro = $request->input('region');
        }

        $regiones = DB::table('dim_clientes')
            ->select('region')
            ->distinct()
            ->orderBy('region')
            ->pluck('region')
            ->toArray();

        $aplicarFiltrosFecha = function ($query, $mesFiltro, $fechaInicio, $fechaFin) {
            if ($mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('hechos_ventas.tiempo_key', [$inicio, $fin]);
            } elseif ($fechaInicio && $fechaFin) {
                $inicio = intval(str_replace('-', '', $fechaInicio));
                $fin = intval(str_replace('-', '', $fechaFin));
                return $query->whereBetween('hechos_ventas.tiempo_key', [$inicio, $fin]);
            }
            return $query;
        };

        // KPIs Generales
        $kpis = DB::table('hechos_ventas')
            ->selectRaw('
                SUM(monto_total) as ingreso_total,
                SUM(cantidad) as total_unidades,
                COUNT(venta_key) as total_transacciones,
                (SUM(monto_total) / COUNT(venta_key)) as ticket_promedio
            ')
            ->where('estado_venta', '!=', 'Cancelada');

        if ($regionFiltro) {
            $kpis->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
                ->where('dim_clientes.region', $regionFiltro);
        }

        $kpis = $aplicarFiltrosFecha($kpis, $mesFiltro, $fechaInicio, $fechaFin)
            ->first();

        // Ventas por Región
        $ventasPorRegion = DB::table('hechos_ventas')
            ->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
            ->select('dim_clientes.region', DB::raw('SUM(hechos_ventas.monto_total) as total'))
            ->where('hechos_ventas.estado_venta', '!=', 'Cancelada');

        if ($regionFiltro) {
            $ventasPorRegion->where('dim_clientes.region', $regionFiltro);
        }

        $ventasPorRegion = $aplicarFiltrosFecha($ventasPorRegion, $mesFiltro, $fechaInicio, $fechaFin)
            ->groupBy('dim_clientes.region')
            ->orderByDesc('total')
            ->get();

        // Distribución de Métodos de Pago
        $metodosPago = DB::table('hechos_ventas')
            ->join('dim_metodos_pago', 'hechos_ventas.metodo_key', '=', 'dim_metodos_pago.metodo_key')
            ->select('dim_metodos_pago.tipo_pago', DB::raw('COUNT(hechos_ventas.venta_key) as transacciones'));

        if ($regionFiltro) {
            $metodosPago->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
                ->where('dim_clientes.region', $regionFiltro);
        }

        $metodosPago = $aplicarFiltrosFecha($metodosPago, $mesFiltro, $fechaInicio, $fechaFin)
            ->groupBy('dim_metodos_pago.tipo_pago')
            ->get();

        // Tasa de Cancelación
        $estadoVentas = DB::table('hechos_ventas')
            ->select('estado_venta', DB::raw('COUNT(venta_key) as total'));

        if ($regionFiltro) {
            $estadoVentas->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
                ->where('dim_clientes.region', $regionFiltro);
        }

        $estadoVentas = $aplicarFiltrosFecha($estadoVentas, $mesFiltro, $fechaInicio, $fechaFin)
            ->groupBy('estado_venta')
            ->get();

        // Top 5 Productos
        $topProductos = DB::table('hechos_ventas')
            ->join('dim_productos', 'hechos_ventas.producto_key', '=', 'dim_productos.producto_key')
            ->select('dim_productos.nombre_producto', DB::raw('SUM(hechos_ventas.monto_total) as total'))
            ->where('hechos_ventas.estado_venta', '!=', 'Cancelada');

        if ($regionFiltro) {
            $topProductos->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
                ->where('dim_clientes.region', $regionFiltro);
        }

        $topProductos = $aplicarFiltrosFecha($topProductos, $mesFiltro, $fechaInicio, $fechaFin)
            ->groupBy('dim_productos.nombre_producto')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Tendencia Temporal
        $tendenciaTemporal = DB::table('hechos_ventas')
            ->join('dim_tiempo', 'hechos_ventas.tiempo_key', '=', 'dim_tiempo.tiempo_key')
            ->select('dim_tiempo.fecha', DB::raw('SUM(hechos_ventas.monto_total) as total'))
            ->where('hechos_ventas.estado_venta', '!=', 'Cancelada');

        if ($regionFiltro) {
            $tendenciaTemporal->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
                ->where('dim_clientes.region', $regionFiltro);
        }

        $tendenciaTemporal = $aplicarFiltrosFecha($tendenciaTemporal, $mesFiltro, $fechaInicio, $fechaFin)
            ->groupBy('dim_tiempo.fecha')
            ->orderBy('dim_tiempo.fecha', 'asc')
            ->get();

        // Alertas automatizadas basadas en KPIs y métricas clave
        $alertas = [];

        if ($kpis && $kpis->ingreso_total < 6000) {
            $alertas[] = [
                'tipo' => 'danger',
                'mensaje' => 'Alerta Crítica: Los ingresos bajo el filtro actual ($' . number_format($kpis->ingreso_total, 2) . ') están por debajo del umbral mínimo de rentabilidad.'
            ];
        }

        $canceladas = $estadoVentas->firstWhere('estado_venta', 'Cancelada');
        if ($canceladas && $canceladas->total > 50) {
            $alertas[] = [
                'tipo' => 'warning',
                'mensaje' => 'Advertencia Operativa: Se ha detectado un volumen alto (' . $canceladas->total . ') de transacciones canceladas. Se requiere revisión inmediata.'
            ];
        }

        return Inertia::render('Dashboard', [
            'kpis' => $kpis,
            'ventasPorRegion' => $ventasPorRegion,
            'metodosPago' => $metodosPago,
            'estadoVentas' => $estadoVentas,
            'topProductos' => $topProductos,
            'tendenciaTemporal' => $tendenciaTemporal,
            'filtroActual' => $mesFiltro,
            'regiones' => $regiones,
            'regionActual' => $regionFiltro,
            'fechaInicio' => $fechaInicio,
            'fechaFin' => $fechaFin,
            'alertas' => $alertas,
            'rolUsuario' => $user->role
        ]);
    }
}
