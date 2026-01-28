import { renderToStaticMarkup } from 'react-dom/server';
import { renderTemplateComponent } from '../features/invitations/components/invitationTemplates';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Renders an invitation template to HTML string
 */
export function renderInvitationTemplate(templateId: string, formData: Record<string, any>): string {
  // Use centralized template renderer
  const templateComponent = renderTemplateComponent(templateId, formData, formatDate);

  // Render React component to static HTML
  const bodyContent = renderToStaticMarkup(templateComponent);

  // Wrap in full HTML document with Tailwind CSS
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formData.title || 'Invitación'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div class="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
    ${bodyContent}
  </div>
</body>
</html>
  `.trim();
}
