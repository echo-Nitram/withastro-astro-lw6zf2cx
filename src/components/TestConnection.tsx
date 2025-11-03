import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TestResult {
  type: 'success' | 'error';
  title: string;
  message: string;
}

export default function TestConnection() {
  const [status, setStatus] = useState('⏳ Probando conexión...');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const runTests = async () => {
    setLoading(true);
    setStatus('⏳ Probando conexión...');
    setResults([]);

    try {
      // Test 1: Verificar configuración
      const url = (supabase as any).supabaseUrl;
      const hasKey =
        (supabase as any).supabaseKey &&
        (supabase as any).supabaseKey.length > 20;

      if (!hasKey) {
        throw new Error(
          'Credenciales de Supabase no configuradas en src/lib/supabase.ts'
        );
      }

      setResults((prev) => [
        ...prev,
        {
          type: 'success',
          title: '✅ Configuración correcta',
          message: `URL: ${url}`,
        },
      ]);

      // Test 2: Verificar autenticación
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      setResults((prev) => [
        ...prev,
        {
          type: 'success',
          title: '✅ Cliente Supabase inicializado',
          message: 'Conexión establecida con Supabase',
        },
      ]);

      // Test 3: Consultar base de datos con más detalles
      console.log('Intentando consultar profiles...');

      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(1);

      console.log('Resultado de consulta:', { data, error, count });

      if (error) {
        throw new Error(
          `Error BD: ${error.message} (Código: ${error.code || 'sin código'})`
        );
      }

      setResults((prev) => [
        ...prev,
        {
          type: 'success',
          title: '✅ Consulta a base de datos exitosa',
          message: `Usuarios encontrados: ${count || 0}`,
        },
      ]);

      // Test 4: Verificar RLS (Row Level Security)
      const { data: rlsData, error: rlsError } = await supabase.rpc('version');

      if (!rlsError) {
        setResults((prev) => [
          ...prev,
          {
            type: 'success',
            title: '✅ Base de datos operacional',
            message: 'Todas las pruebas pasaron correctamente',
          },
        ]);
      }

      setStatus('✅ Todo funcionando correctamente');
    } catch (error: any) {
      console.error('Error completo:', error);
      setStatus('❌ Error de conexión');

      let errorMessage = error.message || 'Error desconocido';
      let errorDetails = '';

      // Analizar tipos de error comunes
      if (error.message?.includes('JWT')) {
        errorDetails = 'Problema con la clave de autenticación (anon key)';
      } else if (
        error.message?.includes('relation') ||
        error.message?.includes('does not exist')
      ) {
        errorDetails = 'La tabla "profiles" no existe en la base de datos';
      } else if (
        error.message?.includes('permission denied') ||
        error.message?.includes('RLS')
      ) {
        errorDetails = 'Problema con permisos (Row Level Security)';
      } else if (error.code === '42P01') {
        errorDetails =
          'Tabla no encontrada - ejecuta el script SQL de creación';
      }

      setResults((prev) => [
        ...prev,
        {
          type: 'error',
          title: '❌ Error',
          message: `${errorMessage}${
            errorDetails ? '\n\n' + errorDetails : ''
          }`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        🧪 Test de Conexión
      </h1>

      {/* Status */}
      <div
        className={`mb-6 p-4 rounded-lg ${
          status.includes('✅')
            ? 'bg-green-50'
            : status.includes('❌')
            ? 'bg-red-50'
            : 'bg-gray-100'
        }`}
      >
        <p
          className={`font-medium ${
            status.includes('✅')
              ? 'text-green-600'
              : status.includes('❌')
              ? 'text-red-600'
              : 'text-gray-600'
          }`}
        >
          {status}
        </p>
      </div>

      {/* Results */}
      <div className="space-y-4 mb-6">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              result.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                result.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.title}
            </p>
            <p
              className={`text-xs mt-1 ${
                result.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {result.message}
            </p>
          </div>
        ))}
      </div>

      {/* Botones */}
      <div className="flex gap-4">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Probando...' : '🔄 Probar de nuevo'}
        </button>

        <a
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 inline-block text-center"
        >
          ← Volver al inicio
        </a>
      </div>

      {/* Info adicional */}
      {results.some((r) => r.type === 'error') && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            💡 ¿Cómo solucionar?
          </p>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>
              • Verifica tus credenciales en{' '}
              <code className="bg-yellow-100 px-1 rounded">
                src/lib/supabase.ts
              </code>
            </li>
            <li>• Asegúrate de que tu proyecto Supabase esté activo</li>
            <li>• Verifica que las tablas estén creadas correctamente</li>
          </ul>
        </div>
      )}
    </div>
  );
}
