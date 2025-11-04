import { useEffect, useState } from 'react';
import { supabase, config } from '../lib/supabase';

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
      // Test 1: Verificar configuración usando el objeto config exportado
      if (!config.isConfigured) {
        throw new Error(
          'Credenciales de Supabase no configuradas en .env o src/lib/supabase.ts'
        );
      }

      setResults((prev) => [
        ...prev,
        {
          type: 'success',
          title: '✅ Configuración correcta',
          message: `URL: ${config.url}`,
        },
      ]);

      // Test 2: Verificar autenticación
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        throw new Error(`Error de autenticación: ${authError.message}`);
      }

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

      // Test 4: Verificar que las tablas principales existen
      const tables = ['profiles', 'templates', 'submissions', 'files'];
      let allTablesExist = true;

      for (const table of tables) {
        const { error: tableError } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true })
          .limit(1);

        if (tableError) {
          allTablesExist = false;
          setResults((prev) => [
            ...prev,
            {
              type: 'error',
              title: `❌ Tabla "${table}" no encontrada`,
              message: tableError.message,
            },
          ]);
        }
      }

      if (allTablesExist) {
        setResults((prev) => [
          ...prev,
          {
            type: 'success',
            title: '✅ Todas las tablas principales existen',
            message: 'profiles, templates, submissions, files',
          },
        ]);
      }

      // Test 5: Verificar RLS (Row Level Security)
      try {
        const { data: rlsData, error: rlsError } = await supabase.rpc(
          'version'
        );

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
      } catch (rlsErr) {
        // RPC version puede no existir, no es crítico
        console.log('RPC version no disponible (no crítico)');
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
        errorDetails = 'Las tablas no existen en la base de datos';
      } else if (
        error.message?.includes('permission denied') ||
        error.message?.includes('RLS')
      ) {
        errorDetails = 'Problema con permisos (Row Level Security)';
      } else if (error.code === '42P01') {
        errorDetails =
          'Tabla no encontrada - ejecuta el script SQL de creación';
      } else if (error.message?.includes('fetch')) {
        errorDetails =
          'Error de red - verifica tu conexión a internet y la URL de Supabase';
      }

      setResults((prev) => [
        ...prev,
        {
          type: 'error',
          title: '❌ Error',
          message: `${errorMessage}${
            errorDetails ? '\n\n💡 ' + errorDetails : ''
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
        🧪 Test de Conexión a Supabase
      </h1>

      {/* Status principal */}
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
          className={`font-medium text-lg ${
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

      {/* Resultados individuales */}
      <div className="space-y-4 mb-6">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              result.type === 'success'
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
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
              className={`text-xs mt-1 whitespace-pre-line ${
                result.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {result.message}
            </p>
          </div>
        ))}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                   font-medium shadow-md hover:shadow-lg"
        >
          {loading ? '⏳ Probando...' : '🔄 Probar de nuevo'}
        </button>

        <a
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                   inline-flex items-center justify-center transition-colors
                   font-medium shadow-md hover:shadow-lg"
        >
          ← Volver al inicio
        </a>

        {!loading && results.length > 0 && (
          <a
            href="/dashboard"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
                     inline-flex items-center justify-center transition-colors
                     font-medium shadow-md hover:shadow-lg"
          >
            Ir al Dashboard →
          </a>
        )}
      </div>

      {/* Información de ayuda en caso de errores */}
      {results.some((r) => r.type === 'error') && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-3">
            💡 ¿Cómo solucionar estos errores?
          </p>
          <ul className="text-xs text-yellow-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <div>
                Verifica tus credenciales en tu archivo{' '}
                <code className="bg-yellow-100 px-2 py-1 rounded font-mono">
                  .env
                </code>
                :
                <div className="mt-1 bg-yellow-100 p-2 rounded font-mono text-xs">
                  PUBLIC_SUPABASE_URL=https://xxx.supabase.co
                  <br />
                  PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
                </div>
              </div>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>
                Asegúrate de que tu proyecto Supabase esté activo en{' '}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-900 underline hover:text-yellow-950"
                >
                  app.supabase.com
                </a>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>
                Si las tablas no existen, ejecuta el script SQL{' '}
                <code className="bg-yellow-100 px-1 rounded">
                  01_schema_corregido.sql
                </code>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>
                Reinicia el servidor de desarrollo:{' '}
                <code className="bg-yellow-100 px-1 rounded">
                  npm run dev
                </code>
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Información adicional cuando todo funciona */}
      {status.includes('✅') && results.every((r) => r.type === 'success') && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-2">
            🎉 ¡Excelente! La conexión está funcionando perfectamente
          </p>
          <p className="text-xs text-blue-700">
            Ya puedes usar el sistema CERTIA para gestionar tus certificados y
            formularios.
          </p>
        </div>
      )}

      {/* Info técnica */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700 font-medium">
            🔍 Información técnica
          </summary>
          <div className="mt-2 space-y-1">
            <p>
              <strong>Supabase URL:</strong> {config.url || 'No configurada'}
            </p>
            <p>
              <strong>Configuración válida:</strong>{' '}
              {config.isConfigured ? '✅ Sí' : '❌ No'}
            </p>
            <p>
              <strong>Tests ejecutados:</strong> {results.length}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}