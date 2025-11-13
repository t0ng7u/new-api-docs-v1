/**
 * 预构建脚本
 * 在构建前生成 changelog 和 special-thanks
 */

import { generateChangelog } from './build-changelog';
import { generateSpecialThanks } from './build-special-thanks';

async function prebuild() {
  console.log('═══════════════════════════════════════════════');
  console.log('🚀 开始预构建处理...');
  console.log('═══════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    // 并行生成 changelog 和 special-thanks
    await Promise.all([generateChangelog(), generateSpecialThanks()]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════════════');
    console.log(`✅ 预构建完成！用时 ${duration}s`);
    console.log('═══════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ 预构建失败:', error);
    // 不退出进程，让构建继续进行
    console.log('⚠ 构建将继续，但可能使用旧的或缺失的数据\n');
  }
}

// 执行预构建
prebuild();
