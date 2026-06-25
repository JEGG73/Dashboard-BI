import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, Activity, TrendingUp, Filter, Download, FileText } from 'lucide-react';
import { exportarExcel } from '@/utils/exportFunctions';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const formatoMoneda = (valor) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
const formatoNumero = (valor) => new Intl.NumberFormat('es-MX').format(valor);

const cambiarFiltros = (mes = null, region = null, inicio = null, fin = null) => {
    const params = {};

    if (mes !== null) params.mes = mes;
    if (region !== null) params.region = region;
    if (inicio !== null) params.fecha_inicio = inicio;
    if (fin !== null) params.fecha_fin = fin;

    router.get('/dashboard', params, { preserveState: true, preserveScroll: true });
};

export default function Dashboard({ auth, kpis, ventasPorRegion, metodosPago, estadoVentas, topProductos, tendenciaTemporal, filtroActual, regiones, regionActual, fechaInicio, fechaFin, alertas }) {

    const COLORS = ['#10b981', '#1e293b', '#3b82f6', '#f59e0b'];
    const reportRef = useRef(null);

    // Exportación a Excel
    const handleExportarExcel = () => {
        const datosExportar = { kpis, ventasPorRegion, metodosPago, estadoVentas, topProductos, tendenciaTemporal };
        let nombreArchivo = 'RADAR_Resultados';
        if (filtroActual) nombreArchivo += `_mes_${filtroActual}`;
        if (regionActual) nombreArchivo += `_${regionActual}`;
        if (fechaInicio && fechaFin) nombreArchivo += `_${fechaInicio}_a_${fechaFin}`;
        exportarExcel(datosExportar, nombreArchivo);
    };

    // Exportación a PDF
    const handleExportarPDF = () => {
        const input = reportRef.current;
        html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`RADAR_Reporte_Gerencial_${new Date().getTime()}.pdf`);
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center gap-4">
                    {/* INYECCIÓN DEL LOGO Y MARCA */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo RADAR" className="h-9 w-auto object-contain" />
                        <h2 className="font-bold text-xl text-slate-800 leading-tight tracking-tight">
                            RADAR <span className="font-normal text-slate-400">| Intelligence</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filtro por mes */}
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-slate-200">
                            <Filter className="w-4 h-4 text-emerald-600" />
                            <select
                                className="border-0 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
                                value={filtroActual || ''}
                                onChange={(e) => cambiarFiltros(e.target.value || null, regionActual || null, fechaInicio || null, fechaFin || null)}
                            >
                                <option value="">Todo el Año</option>
                                <option value="1">Enero</option>
                                <option value="2">Febrero</option>
                                <option value="3">Marzo</option>
                                <option value="4">Abril</option>
                                <option value="5">Mayo</option>
                                <option value="6">Junio</option>
                                <option value="7">Julio</option>
                                <option value="8">Agosto</option>
                                <option value="9">Septiembre</option>
                                <option value="10">Octubre</option>
                                <option value="11">Noviembre</option>
                                <option value="12">Diciembre</option>
                            </select>
                        </div>

                        {/* Filtro por región (solo para admin) */}
                        {auth.user.role === 'admin' && (
                            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-slate-200">
                                <Filter className="w-4 h-4 text-emerald-600" />
                                <select
                                    className="border-0 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
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
                        )}

                        {/* Filtro de rango de fechas */}
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-slate-200">
                            <Filter className="w-4 h-4 text-emerald-600" />
                            <input
                                type="date"
                                className="border-0 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
                                value={fechaInicio || ''}
                                onChange={(e) => cambiarFiltros(null, regionActual || null, e.target.value || null, fechaFin || null)}
                                placeholder="Desde"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                className="border-0 bg-transparent text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
                                value={fechaFin || ''}
                                onChange={(e) => cambiarFiltros(null, regionActual || null, fechaInicio || null, e.target.value || null)}
                                placeholder="Hasta"
                            />
                        </div>

                        {/* Botones de exportación estilizados */}
                        <div className="flex space-x-2">
                            <button
                                onClick={handleExportarExcel}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-200"
                                title="Exportar a Excel"
                            >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">Excel</span>
                            </button>

                            <button
                                onClick={handleExportarPDF}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-md shadow-sm transition duration-200"
                                title="Exportar a PDF"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="RADAR Dashboard" />

            <div className="py-12">
                <div ref={reportRef} className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6 bg-slate-50 p-6 rounded-lg">

                    {/* Cabecera del Reporte para el PDF */}
                    <div className="mb-4 border-b border-slate-200 pb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Reporte Analítico de Alto Rendimiento</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Filtros aplicados: <span className="font-medium">{regionActual || 'Todas las Regiones'}</span> | Mes: <span className="font-medium">{filtroActual ? filtroActual : 'Anual'}</span>
                            </p>
                        </div>
                        <img src="/logo.png" alt="Logo RADAR" className="h-10 w-auto opacity-90" />
                    </div>

                    {/* Alertas */}
                    {alertas && alertas.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {alertas.map((alerta, index) => (
                                <div key={index} className={`p-4 rounded-lg flex items-center shadow-sm border ${alerta.tipo === 'danger' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                    <div className="font-semibold text-sm">{alerta.mensaje}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Aviso de Rol */}
                    {auth.user.role !== 'admin' && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm flex justify-between items-center">
                            <span>Estás visualizando el dashboard en modo <b>Vendedor</b>. Solo tienes acceso a los datos de la región: <b>{auth.user.zona_asignada || 'Centro'}</b>.</span>
                        </div>
                    )}

                    {/* Nivel Ejecutivo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
                            <div className="flex items-center space-x-2 mb-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ingreso Total</div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">
                                {kpis ? formatoMoneda(kpis.ingreso_total) : '$0.00'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-slate-800">
                            <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-slate-700" />
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ticket Promedio</div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">
                                {kpis ? formatoMoneda(kpis.ticket_promedio) : '$0.00'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
                            <div className="flex items-center space-x-2 mb-2">
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Unidades</div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">
                                {kpis ? formatoNumero(kpis.total_unidades) : '0'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
                            <div className="flex items-center space-x-2 mb-2">
                                <Activity className="w-5 h-5 text-amber-600" />
                                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transacciones</div>
                            </div>
                            <div className="text-3xl font-bold text-slate-800">
                                {kpis ? formatoNumero(kpis.total_transacciones) : '0'}
                            </div>
                        </div>
                    </div>

                    {/* Nivel Táctico */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100 mb-6">
                        <h3 className="text-lg font-bold mb-4 text-slate-800">Tendencia de Ventas (2024)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={tendenciaTemporal}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(date) => new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip formatter={(value) => formatoMoneda(value)} labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: '#1e293b' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Nivel Operativo */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Top 5 Productos Más Vendidos</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={topProductos} margin={{ left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <YAxis dataKey="nombre_producto" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13 }} width={100} />
                                        <Tooltip formatter={(value) => formatoMoneda(value)} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="total" fill="#1e293b" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Ingresos por Región</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ventasPorRegion}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fill: '#475569' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <Tooltip formatter={(value) => formatoMoneda(value)} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Nivel Operativo 2: Métodos de Pago y Estados */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Uso de Métodos de Pago</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={metodosPago} margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                        <YAxis dataKey="tipo_pago" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569' }} width={90} />
                                        <Tooltip formatter={(value) => [formatoNumero(value) + ' transacciones', 'Uso']} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="transacciones" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Estado de Operaciones</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={estadoVentas}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="total"
                                            nameKey="estado_venta"
                                            stroke="none"
                                        >
                                            {estadoVentas.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatoNumero(value) + ' operaciones'} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Tablas de Datos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Tabla: Desglose por Producto</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ingreso Generado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {topProductos && topProductos.map((prod, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{prod.nombre_producto}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 text-right font-bold">{formatoMoneda(prod.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-slate-100">
                            <h3 className="text-lg font-bold mb-4 text-slate-800">Tabla: Desglose por Región</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Región</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ingreso Generado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {ventasPorRegion && ventasPorRegion.map((reg, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{reg.region}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 text-right font-bold">{formatoMoneda(reg.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}