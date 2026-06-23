# 📊 Business Intelligence Dashboard - SaaS Data Mart

Plataforma analítica desarrollada para visualizar y auditar métricas de ventas a través de un modelo de estrella (Data Mart). El proyecto integra un proceso ETL completo y un frontend interactivo con componentes reactivos.

## 🛠️ Stack Tecnológico
* **Backend:** Laravel 11, PHP 8.3.29
* **Frontend:** React, Inertia.js, Recharts, Tailwind CSS
* **ETL:** Apache Hop
* **Base de Datos:** MySQL (Laragon)

## 📦 Estructura del Repositorio
* `/app/Http/Controllers`: Lógica de consultas y transformaciones (DashboardController).
* `/resources/js/Pages`: Vistas en React y componentes de gráficas.
* `/etl_docs`: Contiene los scripts SQL de la base de datos, archivos `.hpl` de Apache Hop y los datasets `.csv` originales.

## 🚀 Guía de Instalación (Para el Equipo)

1. **Clonar el repositorio:**
   \`\`\`bash
   git clone https://github.com/JEGG73/Dashboard-BI.git
   \`\`\`
2. **Instalar dependencias:**
   \`\`\`bash
   composer install
   npm install
   \`\`\`
3. **Configurar el Entorno:**
   * Duplica el archivo `.env.example` y renómbralo a `.env`.
   * Genera la llave de la aplicación: `php artisan key:generate`
   * Configura las credenciales de la base de datos en el `.env`.
4. **Base de Datos:**
   * Importa el archivo `datamart_kaggle.sql` ubicado en la carpeta `/etl_docs` dentro de tu gestor de MySQL.
5. **Ejecutar el proyecto:**
   Abre dos terminales y ejecuta:
   \`\`\`bash
   npm run dev
   php artisan serve
   \`\`\`

---

## 👥 Asignación de Tareas (Próximos Pasos)

Para finalizar la arquitectura del proyecto, las siguientes tareas están listas para ser tomadas:

* **[ ] Gobierno de Datos y Diccionario :** Revisar los archivos de Apache Hop en `/etl_docs` y documentar el linaje de datos. Describir la estructura del modelo de estrella, los tipos de datos en MySQL y las reglas de negocio aplicadas.
* **[ ] Plan de Adopción y Manual Técnico :** Documentar el funcionamiento de los filtros interactivos en React, justificar el valor de negocio de los KPIs (Ticket Promedio, Tasa de Cancelación) y redactar la guía de usuario final.
* **[ ] Feature: Exportación Gerencial :** Implementar la funcionalidad en `Dashboard.jsx` para exportar la vista actual (con filtros aplicados) a un formato PDF o Excel.

---
*Desarrollado y estructurado por el equipo 4.*