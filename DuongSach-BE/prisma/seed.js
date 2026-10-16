import { execSync } from 'child_process';

async function main() {
  console.log('🚀 Bắt đầu quá trình nạp dữ liệu Seed từ 16 file SQL (database/seed/)...');
  
  // 1. Chạy nạp 16 file SQL seed
  execSync('node scripts/applySeedSql.js', { stdio: 'inherit' });
  execSync('node scripts/syncLibraryStallIntegrity.js', { stdio: 'inherit' });

  console.log('🎉 QUÁ TRÌNH SEED DATABASE HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
}

main().catch(err => {
  console.error('❌ Lỗi khi seed:', err);
  process.exit(1);
});
