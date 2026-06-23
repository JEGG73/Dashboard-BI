<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $mesFiltro = $request->input('mes');

        // KPIs Generales
        $kpis = DB::table('hechos_ventas')
            ->selectRaw('
                SUM(monto_total) as ingreso_total,
                SUM(cantidad) as total_unidades,
                COUNT(venta_key) as total_transacciones,
                (SUM(monto_total) / COUNT(venta_key)) as ticket_promedio
            ')
            ->where('estado_venta', '!=', 'Cancelada')
            ->when($mesFiltro, function ($query, $mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('tiempo_key', [$inicio, $fin]);
            })
            ->first();

        // Ventas por Región
        $ventasPorRegion = DB::table('hechos_ventas')
            ->join('dim_clientes', 'hechos_ventas.cliente_key', '=', 'dim_clientes.cliente_key')
            ->select('dim_clientes.region', DB::raw('SUM(hechos_ventas.monto_total) as total'))
            ->where('hechos_ventas.estado_venta', '!=', 'Cancelada')
            ->when($mesFiltro, function ($query, $mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('hechos_ventas.tiempo_key', [$inicio, $fin]);
            })
            ->groupBy('dim_clientes.region')
            ->orderByDesc('total')
            ->get();

        // Distribución de Métodos de Pago
        $metodosPago = DB::table('hechos_ventas')
            ->join('dim_metodos_pago', 'hechos_ventas.metodo_key', '=', 'dim_metodos_pago.metodo_key')
            ->select('dim_metodos_pago.tipo_pago', DB::raw('COUNT(hechos_ventas.venta_key) as transacciones'))
            ->when($mesFiltro, function ($query, $mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('hechos_ventas.tiempo_key', [$inicio, $fin]);
            })
            ->groupBy('dim_metodos_pago.tipo_pago')
            ->get();

        // Tasa de Cancelación
        $estadoVentas = DB::table('hechos_ventas')
            ->select('estado_venta', DB::raw('COUNT(venta_key) as total'))
            ->when($mesFiltro, function ($query, $mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('tiempo_key', [$inicio, $fin]);
            })
            ->groupBy('estado_venta')
            ->get();

        // Top 5 Productos
        $topProductos = DB::table('hechos_ventas')
            ->join('dim_productos', 'hechos_ventas.producto_key', '=', 'dim_productos.producto_key')
            ->select('dim_productos.nombre_producto', DB::raw('SUM(hechos_ventas.monto_total) as total'))
            ->where('hechos_ventas.estado_venta', '!=', 'Cancelada')
            ->when($mesFiltro, function ($query, $mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('hechos_ventas.tiempo_key', [$inicio, $fin]);
            })
            ->groupBy('dim_productos.nombre_producto')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        // Tendencia Temporal
        $tendenciaTemporal = DB::table('hechos_ventas')
            ->join('dim_tiempo', 'hechos_ventas.tiempo_key', '=', 'dim_tiempo.tiempo_key')
            ->select('dim_tiempo.fecha', DB::raw('SUM(hechos_ventas.monto_total) as total'))
            ->where('hechos_ventas.estado_venta', '!=', 'Cancelada')
            ->when($mesFiltro, function ($query, $mesFiltro) {
                $inicio = 20240000 + ($mesFiltro * 100) + 1;
                $fin = 20240000 + ($mesFiltro * 100) + 31;
                return $query->whereBetween('hechos_ventas.tiempo_key', [$inicio, $fin]);
            })
            ->groupBy('dim_tiempo.fecha')
            ->orderBy('dim_tiempo.fecha', 'asc')
            ->get();

        return Inertia::render('Dashboard', [
            'kpis' => $kpis,
            'ventasPorRegion' => $ventasPorRegion,
            'metodosPago' => $metodosPago,
            'estadoVentas' => $estadoVentas,
            'topProductos' => $topProductos,
            'tendenciaTemporal' => $tendenciaTemporal,
            'filtroActual' => $mesFiltro
        ]);
    }
}
