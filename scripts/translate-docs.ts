/**
 * Documentation Translation Script
 * Automatically translates Chinese markdown documents to English and Japanese using OpenAI API
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Configuration
const DOCS_DIR = path.join(process.cwd(), 'content', 'docs');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gemini-2.5-flash';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '2', 10);
const RETRY_BACKOFF = parseFloat(process.env.RETRY_BACKOFF || '2.0');
const MAX_WORKERS = parseInt(process.env.MAX_WORKERS || '3', 10);
const FORCE_TRANSLATE = process.env.FORCE_TRANSLATE?.toLowerCase() === 'true';

// Language configuration
const LANGUAGES = {
  en: {
    name: 'English',
    nativeName: '英文',
    dir: 'en',
  },
  ja: {
    name: 'Japanese',
    nativeName: '日文',
    dir: 'ja',
  },
} as const;

type LanguageCode = keyof typeof LANGUAGES;

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Translation terminology glossary
const GLOSSARY = `
| 中文 | English | 说明 | Description |
|------|---------|------|-------------|
| 倍率 | Ratio | 用于计算价格的乘数因子 | Multiplier factor used for price calculation |
| 令牌 | Token | API访问凭证，也指模型处理的文本单元 | API access credentials or text units processed by models |
| 渠道 | Channel | API服务提供商的接入通道 | Access channel for API service providers |
| 分组 | Group | 用户或令牌的分类，影响价格倍率 | Classification of users or tokens, affecting price ratios |
| 额度 | Quota | 用户可用的服务额度 | Available service quota for users |
`;

// Check API key
if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

interface TranslationStats {
  total: number;
  translated: number;
  skipped: number;
  failed: number;
}

/**
 * Get translation prompt
 */
function getTranslationPrompt(
  targetLang: LanguageCode,
  content: string
): string {
  const langInfo = LANGUAGES[targetLang];

  return `你是一个专业的技术文档翻译专家。请将以下 Markdown 格式的技术文档从中文翻译为${langInfo.nativeName}。

翻译要求：
1. 保持 Markdown 格式完整，包括标题、列表、代码块、链接等
2. 代码块内容不要翻译
3. 专业术语使用行业标准翻译
4. 保持技术准确性和专业性
5. 图片路径、链接路径保持不变（如果路径中包含中文目录，保持原样）
6. Front matter (YAML 头部) 中的内容需要翻译
7. 保持原文的语气和风格
8. 对于特殊的专有名词（如产品名 "New API"、"Cherry Studio" 等），保持不变
9. 路径中的语言代码需要替换：将 /zh/ 替换为 /${langInfo.dir}/（例如：href="/zh/docs/guide" → href="/${langInfo.dir}/docs/guide"）

术语表（不要放在翻译内容中）：
${GLOSSARY}

请直接返回翻译后的内容，不要添加任何解释或说明。

原文：

${content}
`;
}

/**
 * Call OpenAI API to translate content
 */
async function translateContent(
  content: string,
  targetLang: LanguageCode
): Promise<string> {
  const langInfo = LANGUAGES[targetLang];
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        console.log(
          `   ⟳ Retry ${retryCount}/${MAX_RETRIES} for ${langInfo.nativeName}...`
        );
      }

      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a professional technical documentation translator. Translate accurately while preserving Markdown formatting, code blocks, and technical terms.`,
            },
            {
              role: 'user',
              content: getTranslationPrompt(targetLang, content),
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as OpenAIResponse;
      const translatedContent = data.choices[0].message.content.trim();

      return translatedContent;
    } catch (error) {
      lastError = error as Error;
      retryCount++;

      if (retryCount <= MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(RETRY_BACKOFF, retryCount - 1);
        console.log(
          `   ⚠ Translation failed: ${lastError.message}, retrying in ${delay.toFixed(1)}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      } else {
        console.error(
          `   ✗ Translation failed after ${MAX_RETRIES} retries: ${lastError.message}`
        );
        throw lastError;
      }
    }
  }

  throw lastError!;
}

/**
 * Detect manually translated files from git
 */
function detectManualTranslations(): Set<string> {
  const manualTranslations = new Set<string>();

  try {
    const output = execSync('git diff --name-only HEAD~1 HEAD', {
      cwd: process.cwd(),
      encoding: 'utf-8',
    });

    const changedFiles = output.trim().split('\n');

    for (const filePath of changedFiles) {
      if (
        filePath &&
        (filePath.includes('/en/') || filePath.includes('/ja/'))
      ) {
        const fullPath = path.join(process.cwd(), filePath);
        manualTranslations.add(fullPath);
      }
    }

    if (manualTranslations.size > 0) {
      console.log(
        `\n📝 Detected ${manualTranslations.size} manually translated file(s)`
      );
    }
  } catch (error) {
    // Git command failed (maybe not in a git repo), continue without manual detection
    console.log('ℹ Could not detect manual translations (not in git repo?)');
  }

  return manualTranslations;
}

/**
 * Translate a single file
 */
async function translateFile(
  sourceFile: string,
  fileIndex: number,
  totalFiles: number,
  manualTranslations: Set<string>
): Promise<{ translated: number; skipped: number; failed: number }> {
  const prefix = `[${fileIndex}/${totalFiles}]`;
  console.log(
    `\n${prefix} 📄 Processing: ${path.relative(process.cwd(), sourceFile)}`
  );

  let result = { translated: 0, skipped: 0, failed: 0 };

  // Read source file
  let content: string;
  try {
    content = fs.readFileSync(sourceFile, 'utf-8');
  } catch (error) {
    console.error(
      `${prefix} ✗ Failed to read file: ${(error as Error).message}`
    );
    result.failed = Object.keys(LANGUAGES).length;
    return result;
  }

  // Calculate relative path from zh directory
  const zhDir = path.join(DOCS_DIR, 'zh');
  let relPath: string;

  try {
    relPath = path.relative(zhDir, sourceFile);
  } catch (error) {
    console.error(`${prefix} ✗ File is not in zh directory`);
    result.failed = Object.keys(LANGUAGES).length;
    return result;
  }

  // Translate to each target language
  for (const [langCode, langInfo] of Object.entries(LANGUAGES)) {
    const targetFile = path.join(DOCS_DIR, langInfo.dir, relPath);

    // Check if manually translated
    if (manualTranslations.has(targetFile)) {
      console.log(
        `${prefix} ⏭  Skipping ${langInfo.nativeName} (manual translation detected)`
      );
      result.skipped++;
      continue;
    }

    // Check if translation already exists
    if (fs.existsSync(targetFile) && !FORCE_TRANSLATE) {
      console.log(
        `${prefix} ⏭  Skipping ${langInfo.nativeName} (already exists)`
      );
      result.skipped++;
      continue;
    } else if (fs.existsSync(targetFile) && FORCE_TRANSLATE) {
      console.log(
        `${prefix} 🔄 Force re-translating ${langInfo.nativeName} (file exists)`
      );
    }

    // Translate content
    try {
      console.log(`${prefix} 🌐 Translating to ${langInfo.nativeName}...`);
      const translatedContent = await translateContent(
        content,
        langCode as LanguageCode
      );

      // Ensure target directory exists
      const targetDir = path.dirname(targetFile);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Write translated file
      fs.writeFileSync(targetFile, translatedContent, 'utf-8');
      console.log(`${prefix} ✓ Saved ${langInfo.nativeName} translation`);
      result.translated++;
    } catch (error) {
      console.error(
        `${prefix} ✗ Failed to translate ${langInfo.nativeName}: ${(error as Error).message}`
      );
      result.failed++;
    }
  }

  return result;
}

/**
 * Collect all markdown files from zh directory
 */
function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return files;
}

/**
 * Process files with concurrency control
 */
async function processFiles(
  files: string[],
  manualTranslations: Set<string>
): Promise<TranslationStats> {
  const stats: TranslationStats = {
    total: files.length,
    translated: 0,
    skipped: 0,
    failed: 0,
  };

  if (MAX_WORKERS === 1) {
    // Sequential mode
    console.log('\n🔄 Using sequential mode\n');

    for (let i = 0; i < files.length; i++) {
      const result = await translateFile(
        files[i],
        i + 1,
        files.length,
        manualTranslations
      );
      stats.translated += result.translated;
      stats.skipped += result.skipped;
      stats.failed += result.failed;
    }
  } else {
    // Concurrent mode
    console.log(`\n🚀 Using concurrent mode (${MAX_WORKERS} workers)\n`);

    const chunks: string[][] = [];
    for (let i = 0; i < files.length; i += MAX_WORKERS) {
      chunks.push(files.slice(i, i + MAX_WORKERS));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
      const promises = chunk.map((file, idx) =>
        translateFile(
          file,
          processedCount + idx + 1,
          files.length,
          manualTranslations
        )
      );

      const results = await Promise.all(promises);

      for (const result of results) {
        stats.translated += result.translated;
        stats.skipped += result.skipped;
        stats.failed += result.failed;
      }

      processedCount += chunk.length;
    }
  }

  return stats;
}

/**
 * Main function
 */
async function translateDocs(specificFiles?: string[]) {
  console.log('═══════════════════════════════════════════════');
  console.log('🌐 Starting document translation...');
  console.log('═══════════════════════════════════════════════\n');

  const startTime = Date.now();

  // Detect manual translations
  const manualTranslations = detectManualTranslations();

  let filesToTranslate: string[];

  if (specificFiles && specificFiles.length > 0) {
    // Translate specific files
    filesToTranslate = specificFiles
      .map((file) => path.resolve(file))
      .filter((file) => {
        // Skip translated files
        if (file.includes('/en/') || file.includes('/ja/')) {
          console.log(`⏭  Skipping translated file: ${file}`);
          return false;
        }

        if (!fs.existsSync(file)) {
          console.warn(`⚠ File not found: ${file}`);
          return false;
        }

        if (!/\.(md|mdx)$/i.test(file)) {
          console.warn(`⚠ Not a markdown file: ${file}`);
          return false;
        }

        return true;
      });
  } else {
    // Translate all files in zh directory
    const zhDir = path.join(DOCS_DIR, 'zh');
    filesToTranslate = collectMarkdownFiles(zhDir);
  }

  if (filesToTranslate.length === 0) {
    console.log('ℹ No files to translate');
    return;
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   Files: ${filesToTranslate.length}`);
  console.log(`   Model: ${OPENAI_MODEL}`);
  console.log(`   API: ${OPENAI_BASE_URL}`);
  console.log(
    `   Languages: ${Object.values(LANGUAGES)
      .map((l) => l.nativeName)
      .join(', ')}`
  );
  console.log(
    `   Retry: Max ${MAX_RETRIES} times, delay ${RETRY_DELAY}s, backoff ${RETRY_BACKOFF}x`
  );
  console.log(`   Concurrency: ${MAX_WORKERS} worker(s)`);
  console.log(`   Force translate: ${FORCE_TRANSLATE ? 'Yes' : 'No'}`);
  console.log(`   Manual translations: ${manualTranslations.size}`);

  // Process files
  const stats = await processFiles(filesToTranslate, manualTranslations);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 Translation Statistics:');
  console.log(`   Total files: ${stats.total}`);
  console.log(`   Translations: ${stats.translated}`);
  console.log(`   Skipped: ${stats.skipped}`);
  if (stats.failed > 0) {
    console.log(`   Failed: ${stats.failed}`);
  }
  console.log(`   Duration: ${duration}s`);
  console.log('═══════════════════════════════════════════════');
  console.log('✅ Translation completed!\n');
}

// Execute if run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  translateDocs(args.length > 0 ? args : undefined).catch((error) => {
    console.error('\n❌ Translation failed:', error);
    process.exit(1);
  });
}

export { translateDocs };
