// Auto-generated from id.json — do not edit manually.
// Run: pnpm i18n:generate

export interface DefaultLocaleMessages {
  readonly 'command.suggest': 'Perintah *{command}* tidak ditemukan.\n\nMungkin yang kamu maksud:\n{suggestions}';
  readonly 'command.help': '╭─── *Info Perintah* ───\n│ *Nama:* {name}\n│ *Deskripsi:* {description}\n│ *Penggunaan:* {usage}\n│ *Contoh:* {example}\n│ *Alias:* {aliases}\n│ *Cooldown:* {cooldown}\n│ *Premium:* {premium}\n╰──────────────────';
  readonly 'command.cooldown': 'Sabar kak, perintah *{command}* bisa digunakan lagi dalam *{remaining}* detik.';
  readonly 'command.limit_reached': 'Limit kamu sudah habis untuk hari ini. Coba lagi besok ya!';
  readonly 'command.error': 'Terjadi kesalahan saat menjalankan perintah *{command}*. Silakan coba lagi nanti.';
  readonly 'validation.require_owner': 'Perintah ini hanya bisa digunakan oleh owner.';
  readonly 'validation.require_group': 'Perintah *{command}* hanya bisa digunakan di dalam grup.';
  readonly 'validation.require_private': 'Perintah *{command}* hanya bisa digunakan di chat pribadi.';
  readonly 'validation.require_premium': 'Perintah *{command}* hanya untuk pengguna premium.';
  readonly 'validation.require_group_admin': 'Kamu harus menjadi admin grup untuk menggunakan perintah ini.';
  readonly 'validation.require_bot_admin': 'Bot harus menjadi admin grup untuk menjalankan perintah ini.';
  readonly 'general.welcome': 'Halo {name}! Selamat datang di *{botName}*.';
  readonly 'general.error': 'Terjadi kesalahan. Silakan coba lagi nanti.';
  readonly 'general.not_registered': 'Kamu belum terdaftar. Ketik *{prefix}register* untuk mendaftar.';
  readonly 'general.maintenance': 'Bot sedang dalam maintenance. Silakan coba lagi nanti.';
  readonly 'general.private_only': 'Perintah ini hanya bisa digunakan di chat pribadi.';
}
