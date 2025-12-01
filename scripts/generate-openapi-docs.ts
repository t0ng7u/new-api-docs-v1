import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { OPENAPI_URLS } from '../src/lib/openapi';

async function generate() {
  // Generate AI Model API docs
  await generateFiles({
    input: createOpenAPI({ input: [OPENAPI_URLS.aiModel] }),
    output: './content/docs/zh/api/ai-model',
    per: 'operation',
    groupBy: 'tag',
    includeDescription: true,
    addGeneratedComment: true,
  });
  console.log('✅ AI Model API docs generated!');

  // Generate Management API docs
  // api.json doesn't have operationId, so we need to simplify file names
  await generateFiles({
    input: createOpenAPI({ input: [OPENAPI_URLS.management] }),
    output: './content/docs/zh/api/management',
    per: 'operation',
    groupBy: 'tag',
    includeDescription: true,
    addGeneratedComment: true,
    // Simplify file names since api.json doesn't have operationId
    name(output) {
      if (output.type !== 'operation') return output.path;
      // Convert route path to simple file name
      // e.g., /api/about -> about, /api/user/login -> user-login
      const path = output.item.path
        .replace(/^\/api\//, '') // Remove /api/ prefix
        .replace(/\/+$/, '') // Remove trailing slashes to avoid double dashes
        .replace(/\//g, '-') // Replace remaining slashes with dashes
        .replace(/[{}]/g, ''); // Remove path parameter brackets
      return `${path}-${output.item.method}`;
    },
  });
  console.log('✅ Management API docs generated!');
}

generate()
  .then(() => console.log('✅ All done!'))
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });
