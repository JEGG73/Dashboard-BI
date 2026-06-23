import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingCart, Activity, TrendingUp, Filter, Download } from 'lucide-react';
import { exportarExcel } from '@/utils/exportFunctions';

const formatoMoneda = (valor) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
const formatoNumero = (valor) => new Intl.NumberFormat('es-MX').format(valor);

const cambiarMes = (e) => {
    const mesSeleccionado = e.target.value;
    router.get('/dashboard', { mes: mesSeleccionado }, { preserveState: true, preserveScroll: true });
};

export default function Dashboard({ auth, kpis, ventasPorRegion, metodosPago, estadoVentas, topProductos, tendenciaTemporal, filtroActual }) {

    const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

    // Funciones para exportación
    const handleExportarExcel = () => {
        const datosExportar = {
            kpis,
            ventasPorRegion,
            metodosPago,
            estadoVentas,
            topProductos,
            tendenciaTemporal
        };
        const mesTexto = filtroActual && filtroActual !== '' ? `_mes_${filtroActual}` : '';
        exportarExcel(datosExportar, `Resultados${mesTexto}`);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center gap-4">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Business Intelligence Dashboard</h2>

                    <div className="flex items-center gap-3">
                        {/* Filtro por mes */}
                        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                                value={filtroActual || ''}
                                onChange={cambiarMes}
                            >
                                <option value="">Todo el Año (2024)</option>
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

                        {/* Botón de exportación */}
                        <button
                            onClick={handleExportarExcel}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm transition duration-200"
                            title="Exportar a Excel"
                        >
                            <Download className="w-4 h-4" />
                            <span className="text-sm font-medium">Descargar Excel</span>
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Nivel Ejecutivo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                                <DollarSign className="w-5 h-5 text-blue-500" />
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ingreso Total</div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800 text-blue-600">
                                {kpis ? formatoMoneda(kpis.ingreso_total) : '$0.00'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Ticket Promedio</div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800 text-indigo-600">
                                {kpis ? formatoMoneda(kpis.ticket_promedio) : '$0.00'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                                <ShoppingCart className="w-5 h-5 text-emerald-500" />
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unidades</div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800 text-emerald-600">
                                {kpis ? formatoNumero(kpis.total_unidades) : '0'}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-center space-x-2 mb-2">
                                <Activity className="w-5 h-5 text-purple-500" />
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Transacciones</div>
                            </div>
                            <div className="text-3xl font-bold text-gray-800 text-purple-600">
                                {kpis ? formatoNumero(kpis.total_transacciones) : '0'}
                            </div>
                        </div>
                    </div>

                    {/* Nivel Táctico */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-gray-100 mb-6">
                        <h3 className="text-lg font-medium mb-4 text-gray-700">Tendencia de Ventas (2024)</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={tendenciaTemporal}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="fecha"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(date) => new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip
                                        formatter={(value) => formatoMoneda(value)}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    />
                                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Nivel Operativo */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-4 text-gray-700">Top 5 Productos Más Vendidos</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={topProductos} margin={{ left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <YAxis dataKey="nombre_producto" type="category" axisLine={false} tickLine={false} width={100} />
                                        <Tooltip formatter={(value) => formatoMoneda(value)} cursor={{ fill: '#f3f4f6' }} />
                                        <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-4 text-gray-700">Ingresos por Región</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ventasPorRegion}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="region" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <Tooltip formatter={(value) => formatoMoneda(value)} cursor={{ fill: '#f3f4f6' }} />
                                        <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Nivel Operativo: Métodos de Pago y Estados */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-4 text-gray-700">Uso de Métodos de Pago</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={metodosPago} margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" axisLine={false} tickLine={false} />
                                        <YAxis dataKey="tipo_pago" type="category" axisLine={false} tickLine={false} width={90} />
                                        <Tooltip formatter={(value) => [formatoNumero(value) + ' transacciones', 'Uso']} cursor={{ fill: '#f3f4f6' }} />
                                        <Bar dataKey="transacciones" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-medium mb-4 text-gray-700">Tasa de Transacciones (Completadas vs Canceladas)</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={estadoVentas}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="total"
                                            nameKey="estado_venta"
                                        >
                                            {estadoVentas.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatoNumero(value) + ' operaciones'} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}