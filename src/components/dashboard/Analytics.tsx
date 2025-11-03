import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// ======================================
// 📊 COMPONENTE DE ANALYTICS Y ESTADÍSTICAS
// ======================================

interface Stats {
  totalSubmissions: number;
  totalTemplates: number;
  totalUsers: number;
  byStatus: { name: string; value: number; color: string }[];
  byMonth: { month: string; count: number }[];
  byTemplate: { template: string; count: number }[];
  recentActivity: {
    date: string;
    submissions: number;
    approvals: number;
  }[];
}

const COLORS = {
  pending: '#ca8a04',
  reviewed: '#2563eb',
  approved: '#16a34a',
  rejected: '#dc2626',
  signing: '#ea580c',
  signed: '#059669',
};

const STATUS_NAMES: Record<string, string> = {
  pending: 'Pendientes',
  reviewed: 'Revisados',
  approved: 'Aprobados',
  rejected: 'Rechazados',
  signing: 'En Firma',
  signed: 'Firmados',
};

export default function Analytics() {
  const [stats, setStats] = useState<Stats>({
    totalSubmissions: 0,
    totalTemplates: 0,
    totalUsers: 0,
    byStatus: [],
    byMonth: [],
    byTemplate: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setError(null);

      // Obtener estadísticas en paralelo
      const [
        submissionsData,
        templatesData,
        usersData,
        byStatusData,
        byMonthData,
        byTemplateData,
        recentActivityData,
      ] = await Promise.all([
        // Total de envíos
        supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true }),

        // Total de templates
        supabase.from('templates').select('*', { count: 'exact', head: true }),

        // Total de usuarios
        supabase.from('profiles').select('*', { count: 'exact', head: true }),

        // Envíos por estado
        supabase.from('submissions').select('status'),

        // Envíos por mes (últimos 6 meses)
        supabase
          .from('submissions')
          .select('created_at')
          .gte(
            'created_at',
            new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
          ),

        // Envíos por template
        supabase.from('submissions').select('template_id, templates(name)'),

        // Actividad reciente (últimos 30 días)
        supabase
          .from('submissions')
          .select('created_at, status')
          .gte(
            'created_at',
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order('created_at', { ascending: true }),
      ]);

      // Procesar datos

      // Por estado
      const statusCounts: Record<string, number> = {};
      byStatusData.data?.forEach((row) => {
        statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
      });

      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: STATUS_NAMES[status] || status,
        value: count,
        color: COLORS[status as keyof typeof COLORS] || '#6b7280',
      }));

      // Por mes
      const monthCounts: Record<string, number> = {};
      byMonthData.data?.forEach((row) => {
        const month = new Date(row.created_at).toLocaleDateString('es-UY', {
          month: 'short',
          year: 'numeric',
        });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const byMonth = Object.entries(monthCounts)
        .map(([month, count]) => ({
          month,
          count,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      // Por template
      const templateCounts: Record<string, number> = {};
      byTemplateData.data?.forEach((row: any) => {
        const templateName = row.templates?.name || 'Sin nombre';
        templateCounts[templateName] = (templateCounts[templateName] || 0) + 1;
      });

      const byTemplate = Object.entries(templateCounts)
        .map(([template, count]) => ({
          template,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5

      // Actividad reciente
      const activityByDay: Record<
        string,
        { submissions: number; approvals: number }
      > = {};

      recentActivityData.data?.forEach((row) => {
        const date = new Date(row.created_at).toLocaleDateString('es-UY', {
          day: '2-digit',
          month: 'short',
        });

        if (!activityByDay[date]) {
          activityByDay[date] = { submissions: 0, approvals: 0 };
        }

        activityByDay[date].submissions++;

        if (row.status === 'approved' || row.status === 'signed') {
          activityByDay[date].approvals++;
        }
      });

      const recentActivity = Object.entries(activityByDay).map(
        ([date, counts]) => ({
          date,
          submissions: counts.submissions,
          approvals: counts.approvals,
        })
      );

      // Actualizar estado
      setStats({
        totalSubmissions: submissionsData.count || 0,
        totalTemplates: templatesData.count || 0,
        totalUsers: usersData.count || 0,
        byStatus,
        byMonth,
        byTemplate,
        recentActivity,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
      setError(
        'Error al cargar las estadísticas. Por favor, intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">{error}</div>
        <button onClick={loadStats} className="mt-4 btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Título */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">
          📊 Analytics y Estadísticas
        </h2>
        <button
          onClick={loadStats}
          className="btn-secondary"
          title="Actualizar datos"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90">Total Envíos</h3>
              <p className="text-4xl font-bold mt-2">
                {stats.totalSubmissions}
              </p>
              <p className="text-sm opacity-75 mt-1">Formularios recibidos</p>
            </div>
            <div className="text-5xl opacity-20">📋</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90">Templates</h3>
              <p className="text-4xl font-bold mt-2">{stats.totalTemplates}</p>
              <p className="text-sm opacity-75 mt-1">Diseños creados</p>
            </div>
            <div className="text-5xl opacity-20">🎨</div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium opacity-90">Usuarios</h3>
              <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
              <p className="text-sm opacity-75 mt-1">Registrados</p>
            </div>
            <div className="text-5xl opacity-20">👥</div>
          </div>
        </div>
      </div>

      {/* Tarjetas de estado */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {stats.byStatus.map((status) => (
          <div
            key={status.name}
            className="card text-center"
            style={{ borderLeft: `4px solid ${status.color}` }}
          >
            <h4 className="text-sm font-medium text-gray-600">{status.name}</h4>
            <p
              className="text-2xl font-bold mt-2"
              style={{ color: status.color }}
            >
              {status.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de pastel: Por estado */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 text-gray-900">
            Distribución por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.byStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de barras: Por mes */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 text-gray-900">
            Envíos por Mes (Últimos 6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="count"
                fill="#0284c7"
                name="Envíos"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6 text-gray-900">
          Actividad Reciente (Últimos 30 días)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.recentActivity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="submissions"
              stroke="#0284c7"
              strokeWidth={2}
              name="Envíos"
              dot={{ fill: '#0284c7', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="approvals"
              stroke="#16a34a"
              strokeWidth={2}
              name="Aprobaciones"
              dot={{ fill: '#16a34a', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top templates */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6 text-gray-900">
          Top 5 Templates Más Utilizados
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.byTemplate} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis
              dataKey="template"
              type="category"
              width={200}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              fill="#7c3aed"
              name="Envíos"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen */}
      <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-900">📈 Resumen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Tasa de Aprobación</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {stats.totalSubmissions > 0
                ? Math.round(
                    ((stats.byStatus.find((s) => s.name === 'Aprobados')
                      ?.value || 0) /
                      stats.totalSubmissions) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pendientes de Revisión</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">
              {stats.byStatus.find((s) => s.name === 'Pendientes')?.value || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completados (Firmados)</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">
              {stats.byStatus.find((s) => s.name === 'Firmados')?.value || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
