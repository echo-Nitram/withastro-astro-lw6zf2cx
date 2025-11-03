import { useState, useEffect } from 'react';
import { getSystemStats } from '../../lib/admin';

interface Stats {
  totalUsers: number;
  admins: number;
  companies: number;
  clients: number;
  totalTemplates: number;
  totalSubmissions: number;
}

export default function SystemStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getSystemStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Usuarios',
      value: stats.totalUsers,
      icon: '👥',
      color: 'from-gray-500 to-gray-600',
    },
    {
      label: 'Administradores',
      value: stats.admins,
      icon: '👑',
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Empresas',
      value: stats.companies,
      icon: '🏢',
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Clientes',
      value: stats.clients,
      icon: '👤',
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Templates',
      value: stats.totalTemplates,
      icon: '📋',
      color: 'from-orange-500 to-orange-600',
    },
    {
      label: 'Envíos',
      value: stats.totalSubmissions,
      icon: '📬',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}
        >
          <div className="text-4xl mb-2">{card.icon}</div>
          <p className="text-sm opacity-90 mb-1">{card.label}</p>
          <p className="text-3xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
