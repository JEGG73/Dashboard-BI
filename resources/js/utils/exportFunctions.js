import * as XLSX from 'xlsx';

/**
 * Exportar datos a Excel
 * Convierte los datos del dashboard en múltiples hojas de Excel
 */
export const exportarExcel = (datos, nombreArchivo = 'Resultados') => {
    try {
        const workbook = XLSX.utils.book_new();

        // Hoja 1: Indicadores Clave de Rendimiento KPIs
        if (datos.kpis) {
            const kpisData = [
                ['Indicador', 'Valor'],
                ['Ingreso Total', datos.kpis.ingreso_total || 0],
                ['Ticket Promedio', datos.kpis.ticket_promedio || 0],
                ['Total Unidades Vendidas', datos.kpis.total_unidades || 0],
                ['Total Transacciones', datos.kpis.total_transacciones || 0],
            ];
            const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
            wsKPIs['!cols'] = [{ wch: 30 }, { wch: 15 }];
            
            // Formato para las celdas numéricas
            for (let i = 2; i <= 5; i++) {
                if (wsKPIs[`B${i}`]) {
                    wsKPIs[`B${i}`].z = '$#,##0.00';
                }
            }
            
            XLSX.utils.book_append_sheet(workbook, wsKPIs, 'KPIs');
        }

        // Hoja 2: Top Productos
        if (datos.topProductos && datos.topProductos.length > 0) {
            const productosData = [
                ['Ranking', 'Nombre Producto', 'Ingresos Totales', 'Cantidad Vendida'],
                ...datos.topProductos.map((p, idx) => [
                    idx + 1,
                    p.nombre_producto || '',
                    p.total || 0,
                    p.cantidad || 0
                ])
            ];
            const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
            wsProductos['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 18 }, { wch: 18 }];
            
            // Aplicar formato de moneda
            for (let i = 2; i <= productosData.length; i++) {
                if (wsProductos[`C${i}`]) wsProductos[`C${i}`].z = '$#,##0.00';
            }
            
            XLSX.utils.book_append_sheet(workbook, wsProductos, 'Top Productos');
        }

        // Hoja 3: Ventas por Región
        if (datos.ventasPorRegion && datos.ventasPorRegion.length > 0) {
            const regionesData = [
                ['Región', 'Ingresos Totales', 'Unidades Vendidas'],
                ...datos.ventasPorRegion.map(r => [
                    r.region || '',
                    r.total || 0,
                    r.cantidad || 0
                ])
            ];
            const wsRegiones = XLSX.utils.aoa_to_sheet(regionesData);
            wsRegiones['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }];
            
            // Aplicar formato de moneda
            for (let i = 2; i <= regionesData.length; i++) {
                if (wsRegiones[`B${i}`]) wsRegiones[`B${i}`].z = '$#,##0.00';
            }
            
            XLSX.utils.book_append_sheet(workbook, wsRegiones, 'Por Región');
        }

        // Hoja 4: Métodos de Pago
        if (datos.metodosPago && datos.metodosPago.length > 0) {
            const pagosData = [
                ['Método de Pago', 'Cantidad Transacciones', 'Porcentaje'],
                ...datos.metodosPago.map(p => {
                    const total = datos.metodosPago.reduce((sum, item) => sum + (item.transacciones || 0), 0);
                    const porcentaje = total > 0 ? ((p.transacciones / total) * 100).toFixed(2) : 0;
                    return [
                        p.tipo_pago || '',
                        p.transacciones || 0,
                        parseFloat(porcentaje)
                    ];
                })
            ];
            const wsPagos = XLSX.utils.aoa_to_sheet(pagosData);
            wsPagos['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 12 }];
            
            // Aplicar formato de porcentaje
            for (let i = 2; i <= pagosData.length; i++) {
                if (wsPagos[`C${i}`]) wsPagos[`C${i}`].z = '0.00%';
            }
            
            XLSX.utils.book_append_sheet(workbook, wsPagos, 'Métodos Pago');
        }

        // Hoja 5: Estado de Ventas
        if (datos.estadoVentas && datos.estadoVentas.length > 0) {
            const estadoData = [
                ['Estado Venta', 'Total Operaciones', 'Porcentaje'],
                ...datos.estadoVentas.map(e => {
                    const total = datos.estadoVentas.reduce((sum, item) => sum + (item.total || 0), 0);
                    const porcentaje = total > 0 ? ((e.total / total) * 100).toFixed(2) : 0;
                    return [
                        e.estado_venta || '',
                        e.total || 0,
                        parseFloat(porcentaje)
                    ];
                })
            ];
            const wsEstado = XLSX.utils.aoa_to_sheet(estadoData);
            wsEstado['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 12 }];
            
            // Aplicar formato de porcentaje
            for (let i = 2; i <= estadoData.length; i++) {
                if (wsEstado[`C${i}`]) wsEstado[`C${i}`].z = '0.00%';
            }
            
            XLSX.utils.book_append_sheet(workbook, wsEstado, 'Estado Ventas');
        }

        // Hoja 6: Tendencia Temporal
        if (datos.tendenciaTemporal && datos.tendenciaTemporal.length > 0) {
            const tendenciaData = [
                ['Fecha', 'Ingresos Totales'],
                ...datos.tendenciaTemporal.map(t => [
                    new Date(t.fecha).toLocaleDateString('es-MX'),
                    t.total || 0
                ])
            ];
            const wsTendencia = XLSX.utils.aoa_to_sheet(tendenciaData);
            wsTendencia['!cols'] = [{ wch: 18 }, { wch: 18 }];
            
            // Aplicar formato de moneda
            for (let i = 2; i <= tendenciaData.length; i++) {
                if (wsTendencia[`B${i}`]) wsTendencia[`B${i}`].z = '$#,##0.00';
            }
            
            XLSX.utils.book_append_sheet(workbook, wsTendencia, 'Tendencia');
        }

        // Hoja 7: Resumen Analítico
        const resumenData = [
            ['Resumen Analítico del Dashboard'],
            [],
            ['Generado:', new Date().toLocaleDateString('es-MX')],
            ['Hora:', new Date().toLocaleTimeString('es-MX')],
            [],
        ];
        
        if (datos.kpis) {
            resumenData.push(['Indicadores Clave (KPIs)']);
            resumenData.push(['Ingreso Total:', datos.kpis.ingreso_total || 0]);
            resumenData.push(['Ticket Promedio:', datos.kpis.ticket_promedio || 0]);
            resumenData.push(['Total Unidades:', datos.kpis.total_unidades || 0]);
            resumenData.push(['Total Transacciones:', datos.kpis.total_transacciones || 0]);
            resumenData.push([]);
        }

        if (datos.topProductos && datos.topProductos.length > 0) {
            resumenData.push(['Top 3 Productos Más Vendidos']);
            datos.topProductos.slice(0, 3).forEach((p, idx) => {
                resumenData.push([`${idx + 1}. ${p.nombre_producto}`, p.total || 0]);
            });
            resumenData.push([]);
        }

        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        wsResumen['!cols'] = [{ wch: 30 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

        // Descargar Excel
        const fecha = new Date().toLocaleDateString('es-MX').replace(/\//g, '-');
        XLSX.writeFile(workbook, `${nombreArchivo}_${fecha}.xlsx`);
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        alert('Error al exportar a Excel: ' + error.message);
    }
};