// Minimal i18n. Default: Bahasa Indonesia. Toggle to English via setLang('en').
import { useSyncExternalStore } from 'react';

const STORE_KEY = 'mom_lang';
let lang = localStorage.getItem(STORE_KEY) || 'id';
const listeners = new Set();

export function getLang() {
  return lang;
}
export function setLang(next) {
  lang = next;
  localStorage.setItem(STORE_KEY, next);
  listeners.forEach((fn) => fn());
}
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const dict = {
  id: {
    app_tagline: 'Catatan rapat otomatis untuk bisnis Indonesia',
    login: 'Masuk',
    signup: 'Daftar',
    logout: 'Keluar',
    email: 'Email',
    password: 'Kata sandi',
    full_name: 'Nama lengkap',
    company: 'Perusahaan',
    forgot_password: 'Lupa kata sandi?',
    reset_password: 'Atur ulang kata sandi',
    send_reset_link: 'Kirim link reset',
    new_password: 'Kata sandi baru',
    save: 'Simpan',
    have_account: 'Sudah punya akun?',
    no_account: 'Belum punya akun?',
    create_account: 'Buat akun',
    submitting: 'Memproses…',
    welcome: 'Selamat datang',
    trial_ends: 'Trial berakhir',
    err_email_taken: 'Email sudah terdaftar.',
    err_invalid_credentials: 'Email atau kata sandi salah.',
    err_password_too_short: 'Kata sandi minimal 8 karakter.',
    err_invalid_email: 'Format email tidak valid.',
    err_generic: 'Terjadi kesalahan. Coba lagi.',
    forgot_sent: 'Jika email terdaftar, link reset sudah dikirim. Cek inbox.',
    reset_done: 'Kata sandi berhasil diubah. Silakan masuk.',
    record_meeting: 'Rekam Rapat',
  },
  en: {
    app_tagline: 'Automatic meeting notes for Indonesian business',
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Log out',
    email: 'Email',
    password: 'Password',
    full_name: 'Full name',
    company: 'Company',
    forgot_password: 'Forgot password?',
    reset_password: 'Reset password',
    send_reset_link: 'Send reset link',
    new_password: 'New password',
    save: 'Save',
    have_account: 'Already have an account?',
    no_account: 'No account yet?',
    create_account: 'Create account',
    submitting: 'Submitting…',
    welcome: 'Welcome',
    trial_ends: 'Trial ends',
    err_email_taken: 'Email already registered.',
    err_invalid_credentials: 'Incorrect email or password.',
    err_password_too_short: 'Password must be at least 8 characters.',
    err_invalid_email: 'Invalid email format.',
    err_generic: 'Something went wrong. Try again.',
    forgot_sent: 'If the email is registered, a reset link has been sent. Check your inbox.',
    reset_done: 'Password updated. Please log in.',
    record_meeting: 'Record Meeting',
  },
};

export function t(key) {
  return dict[lang]?.[key] ?? dict.id[key] ?? key;
}

export function useT() {
  useSyncExternalStore(subscribe, getLang);
  return t;
}

export function errorToMessage(err) {
  const code = err?.message;
  const map = {
    email_taken: 'err_email_taken',
    invalid_credentials: 'err_invalid_credentials',
    password_too_short: 'err_password_too_short',
    invalid_email: 'err_invalid_email',
  };
  return t(map[code] || 'err_generic');
}
