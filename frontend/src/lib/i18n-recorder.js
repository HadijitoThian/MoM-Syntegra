// Additional i18n strings for recorder. Imported by recorder pages — keeps
// the main i18n dict from getting noisy until we ship more views.
export const recorderStrings = {
  id: {
    rec_title: 'Judul rapat',
    rec_title_placeholder: 'Rapat — {date}',
    rec_start: 'Mulai Rekam',
    rec_pause: 'Jeda',
    rec_resume: 'Lanjut',
    rec_stop: 'Selesai',
    rec_flag: 'Tandai momen',
    rec_phone: 'Telepon masuk',
    rec_status_wake_on: 'Layar tetap menyala',
    rec_status_wake_off: 'Wake Lock tidak tersedia — pakai Chrome',
    rec_status_recording: 'Sedang merekam',
    rec_status_paused: 'Dijeda',
    rec_flag_default: 'Penting',
    rec_phone_default: 'Telepon',
    rec_uploading: 'Mengunggah audio…',
    rec_transcribing: 'Membuat transkrip…',
    rec_done: 'Selesai!',
    rec_unsupported: 'Browser ini tidak mendukung perekaman. Pakai Chrome di Android atau Safari di iOS.',
    rec_mic_denied: 'Akses mikrofon ditolak. Aktifkan izin mikrofon di pengaturan browser.',
    rec_flagged_moments: 'Momen yang ditandai',
    rec_no_flags: 'Belum ada momen yang ditandai.',
    rec_error: 'Gagal: ',
    rec_back: '← Kembali',
  },
  en: {
    rec_title: 'Meeting title',
    rec_title_placeholder: 'Meeting — {date}',
    rec_start: 'Start Recording',
    rec_pause: 'Pause',
    rec_resume: 'Resume',
    rec_stop: 'Stop',
    rec_flag: 'Flag moment',
    rec_phone: 'Phone interruption',
    rec_status_wake_on: 'Screen stays on',
    rec_status_wake_off: 'Wake Lock unsupported — use Chrome',
    rec_status_recording: 'Recording',
    rec_status_paused: 'Paused',
    rec_flag_default: 'Important',
    rec_phone_default: 'Phone',
    rec_uploading: 'Uploading audio…',
    rec_transcribing: 'Transcribing…',
    rec_done: 'Done!',
    rec_unsupported: 'This browser does not support recording. Use Chrome on Android or Safari on iOS.',
    rec_mic_denied: 'Microphone access denied. Enable mic permission in browser settings.',
    rec_flagged_moments: 'Flagged moments',
    rec_no_flags: 'No flagged moments yet.',
    rec_error: 'Failed: ',
    rec_back: '← Back',
  },
};

import { getLang } from './i18n.js';
export function tr(key) {
  const lang = getLang();
  return recorderStrings[lang]?.[key] ?? recorderStrings.id[key] ?? key;
}
