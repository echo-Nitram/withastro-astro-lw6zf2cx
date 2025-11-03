import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  // Validar y sanitizar inputs
  if (!data.template_id || typeof data.template_id !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid template_id' }), {
      status: 400,
    });
  }

  // ... más validaciones

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
};
