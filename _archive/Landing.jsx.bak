import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LangToggle from '../components/LangToggle.jsx';
import { useT, getLang } from '../lib/i18n.js';

const TR = {
  id: {
    nav_login: 'Masuk',
    nav_cta: 'Coba Gratis 7 Hari',

    hero_pill: 'Untuk SME, konsultan, lawyer & agency owner',
    hero_h1_1: 'Catatan rapat otomatis,',
    hero_h1_2: 'tanpa ribet.',
    hero_sub:
      'Rekam rapat di HP. AI buat transkrip, ringkasan, action items, dan mind map. Langsung masuk email Anda. Murah, cepat, dalam Bahasa Indonesia.',
    hero_cta_primary: 'Mulai 7 Hari Gratis',
    hero_cta_secondary: 'Lihat cara kerjanya ↓',
    hero_trust: 'Tanpa kartu kredit · 150 menit gratis · Setup 30 detik',

    pain_h2: 'Pernah ngalamin ini?',
    pain_1_title: 'Lupa siapa yang janji apa',
    pain_1_body:
      'Tiga hari setelah rapat, semua orang ingat hal yang berbeda. Action items menguap. Project mundur.',
    pain_2_title: 'Notulis itu mahal',
    pain_2_body:
      'Asisten Rp 6 juta+/bulan cuma buat catat rapat? Hire freelance Rp 200rb/rapat? Numpuk.',
    pain_3_title: 'Otter.ai mahal & gak ngerti Bahasa',
    pain_3_body:
      'Tools luar tagih $10–20 USD/bulan (Rp 160rb+) dan suka salah transkrip Bahasa Indonesia. Privacy juga di server luar.',

    how_h2: 'Cara kerjanya — 3 langkah',
    how_1_title: 'Rekam',
    how_1_body:
      'Buka mom.syntegra.co.id di HP, tap tombol merah. Rekam rapat di lokasi atau via Zoom — tanpa install app.',
    how_2_title: 'AI proses',
    how_2_body:
      'Selesai rapat, tap Stop. Dalam beberapa detik AI bikin transkrip, ringkasan, action items, dan mind map.',
    how_3_title: 'Masuk email',
    how_3_body:
      'Catatan lengkap langsung dikirim ke email Anda. Forward ke tim, simpan, atau kerjakan langsung.',

    feat_h2: 'Yang Anda dapatkan setiap rapat',
    feat_1_title: 'Transkrip 2 bahasa',
    feat_1_body: 'Bahasa Indonesia + English. AI deteksi otomatis. Akurat bahkan untuk istilah teknis & nama lokal.',
    feat_2_title: 'Action items + owner',
    feat_2_body: 'AI tahu siapa janji ngerjain apa. Deadline kelihatan jelas. Tidak ada lagi "wait, gue yg handle?"',
    feat_3_title: 'Mind map visual',
    feat_3_body: 'Topik rapat divisualisasikan. Bagus buat share ke stakeholder yang nggak ikut rapat.',
    feat_4_title: 'Tersimpan selamanya',
    feat_4_body: 'Cari catatan rapat 6 bulan lalu? Bisa. Audio disimpan 30 hari, transkrip dan ringkasan selamanya.',

    for_h2: 'Dibuat untuk profesional Indonesia',
    for_lead:
      'Apakah Anda owner SME, konsultan strategi, lawyer, agency creative, atau coach — rapat adalah pekerjaan Anda. Catatan rapat adalah aset.',
    for_q:
      '"Sebelumnya saya pakai voice note + ketik manual sambil rapat. Sekarang fokus diskusi aja, sisanya beres."',
    for_q_attr: '— Konsultan, Jakarta',

    price_h2: 'Harga jujur, tanpa surprise',
    price_pill: 'PALING POPULER',
    price_amount: 'Rp 59.000',
    price_period: '/bulan',
    price_quota: '750 menit rekaman/bulan (~12 jam)',
    price_bullets: [
      '7 hari trial gratis (150 menit)',
      '750 menit/bulan setelah subscribe',
      'Transkrip + ringkasan + mind map otomatis',
      'Catatan dikirim ke email setelah rapat',
      'Audio disimpan 30 hari',
      'Transkrip & ringkasan tersimpan selamanya',
      'Cancel kapan aja',
    ],
    price_cta: 'Mulai Trial Gratis',
    price_topup_label: 'Butuh lebih?',
    price_topup_body: 'Topup Rp 25.000 = 300 menit. Tidak ada expiry. Tanpa upgrade plan.',
    price_compare:
      'Bandingkan: Otter.ai Pro ~Rp 240rb/bulan · Fireflies ~Rp 290rb/bulan · Asisten part-time Rp 3jt+/bulan',

    faq_h2: 'Pertanyaan yang sering ditanya',
    faqs: [
      {
        q: 'Apakah suara saya aman?',
        a: 'Audio dikirim ke server kami yang terenkripsi, lalu di-transkrip pakai AI. Audio dihapus otomatis setelah 30 hari. Tidak ada manusia mendengar rekaman Anda.',
      },
      {
        q: 'Bisa dipakai untuk rapat Zoom/Google Meet?',
        a: 'Bisa. Buka mom.syntegra.co.id di HP/laptop terpisah dan rekam audio rapat. Atau pakai output suara langsung kalau punya setup.',
      },
      {
        q: 'Kalau saya melebihi 750 menit?',
        a: 'Beli topup Rp 25.000 untuk 300 menit tambahan. Topup tidak expire, jadi bisa dipakai bulan-bulan berikutnya juga.',
      },
      {
        q: 'Kalau trial habis sebelum 7 hari?',
        a: 'Kalau Anda pakai 150 menit dalam 3 hari, Anda bisa subscribe untuk lanjut rekam. Atau tunggu sampai trial period berakhir.',
      },
      {
        q: 'Bisa cancel?',
        a: 'Bisa kapan aja. Akses tetap aktif sampai akhir periode yang sudah dibayar. Kami tidak charge otomatis bulan berikutnya kecuali Anda renew.',
      },
      {
        q: 'Payment methodnya apa aja?',
        a: 'Lewat Midtrans: GoPay, OVO, ShopeePay, kartu kredit/debit, transfer bank (BCA, Mandiri, BNI, BRI), Indomaret, Alfamart.',
      },
    ],

    cta_h2: 'Mulai catat rapat dengan benar',
    cta_sub: '7 hari gratis. 150 menit. Tanpa kartu kredit. Setup 30 detik.',
    cta_btn: 'Coba Gratis Sekarang',

    foot_tagline: 'Catatan rapat otomatis untuk bisnis Indonesia',
    foot_copy: '© 2026 Syntegra. Semua hak dilindungi.',
  },
  en: {
    nav_login: 'Log in',
    nav_cta: 'Try Free for 7 Days',

    hero_pill: 'For SME owners, consultants, lawyers & agency owners',
    hero_h1_1: 'Automatic meeting notes,',
    hero_h1_2: 'no hassle.',
    hero_sub:
      'Record meetings on your phone. AI generates transcripts, summaries, action items, and a mind map. Delivered to your inbox. Cheap, fast, native in Bahasa Indonesia.',
    hero_cta_primary: 'Start 7-Day Free Trial',
    hero_cta_secondary: 'See how it works ↓',
    hero_trust: 'No credit card · 150 free minutes · 30-second setup',

    pain_h2: 'Sound familiar?',
    pain_1_title: 'Forgot who promised what',
    pain_1_body:
      'Three days later, everyone remembers something different. Action items evaporate. Projects slip.',
    pain_2_title: 'Note-takers are expensive',
    pain_2_body:
      'Hiring an assistant for Rp 6M+/month just to take notes? Freelance at Rp 200K/meeting? It adds up.',
    pain_3_title: 'Otter.ai is pricey & weak in Bahasa',
    pain_3_body:
      'International tools charge $10–20 USD/mo and often mistranscribe Indonesian. Plus your data sits overseas.',

    how_h2: 'How it works — 3 steps',
    how_1_title: 'Record',
    how_1_body:
      'Open mom.syntegra.co.id on your phone, tap the red button. Record in person or alongside Zoom — no app to install.',
    how_2_title: 'AI processes',
    how_2_body:
      'After the meeting, tap Stop. In seconds AI produces a transcript, summary, action items, and mind map.',
    how_3_title: 'Inbox delivery',
    how_3_body:
      'Full notes arrive in your email. Forward to the team, archive, or act on it immediately.',

    feat_h2: 'What you get from every meeting',
    feat_1_title: 'Bilingual transcripts',
    feat_1_body: 'Bahasa Indonesia + English. Auto-detected. Accurate even with technical terms & local names.',
    feat_2_title: 'Action items + owners',
    feat_2_body: 'AI knows who promised what. Deadlines visible. No more "wait, am I doing that?"',
    feat_3_title: 'Visual mind map',
    feat_3_body: 'Meeting topics visualised. Great for sharing with stakeholders who weren\'t in the room.',
    feat_4_title: 'Forever searchable',
    feat_4_body: 'Need notes from 6 months ago? Easy. Audio kept 30 days; transcript and summary kept forever.',

    for_h2: 'Built for Indonesian professionals',
    for_lead:
      'Whether you\'re an SME owner, strategy consultant, lawyer, creative agency, or coach — meetings are your work. Meeting notes are an asset.',
    for_q:
      '"Before, I\'d voice-record and type notes while talking. Now I just focus on the conversation — the rest takes care of itself."',
    for_q_attr: '— Consultant, Jakarta',

    price_h2: 'Honest pricing. No surprises.',
    price_pill: 'MOST POPULAR',
    price_amount: 'Rp 59,000',
    price_period: '/month',
    price_quota: '750 minutes of recording per month (~12 hours)',
    price_bullets: [
      '7-day free trial (150 minutes)',
      '750 minutes/month after subscribing',
      'Auto transcript + summary + mind map',
      'Notes emailed after every meeting',
      'Audio kept for 30 days',
      'Transcript & summary kept forever',
      'Cancel anytime',
    ],
    price_cta: 'Start Free Trial',
    price_topup_label: 'Need more?',
    price_topup_body: 'Top up Rp 25,000 = 300 minutes. No expiry. No plan upgrade.',
    price_compare:
      'Compare: Otter.ai Pro ~Rp 240K/mo · Fireflies ~Rp 290K/mo · Part-time assistant Rp 3M+/mo',

    faq_h2: 'Frequently asked',
    faqs: [
      {
        q: 'Is my audio safe?',
        a: 'Audio is sent over encrypted connections to our servers and transcribed by AI. Audio is auto-deleted after 30 days. No human ever listens to your recordings.',
      },
      {
        q: 'Can I use this for Zoom / Google Meet?',
        a: 'Yes. Open mom.syntegra.co.id on a separate phone/laptop and record the meeting audio. Or pipe in audio directly if you have a setup.',
      },
      {
        q: 'What if I exceed 750 minutes?',
        a: 'Buy a top-up of Rp 25,000 for 300 more minutes. Top-ups never expire and carry over to later months.',
      },
      {
        q: 'What if I burn through trial before 7 days?',
        a: 'If you use all 150 minutes in 3 days, you can subscribe immediately to keep recording. Otherwise just wait for the trial to expire.',
      },
      {
        q: 'Can I cancel?',
        a: 'Anytime. Your access stays active until the end of your paid period. We don\'t auto-charge the following month unless you renew.',
      },
      {
        q: 'What payment methods?',
        a: 'Via Midtrans: GoPay, OVO, ShopeePay, credit/debit cards, bank transfer (BCA, Mandiri, BNI, BRI), Indomaret, Alfamart.',
      },
    ],

    cta_h2: 'Start taking meeting notes the right way',
    cta_sub: '7 days free. 150 minutes. No credit card. 30-second setup.',
    cta_btn: 'Try It Free Now',

    foot_tagline: 'Automatic meeting notes for Indonesian business',
    foot_copy: '© 2026 Syntegra. All rights reserved.',
  },
};

function trl(key) {
  const l = getLang();
  return TR[l]?.[key] ?? TR.id[key];
}

export default function Landing() {
  useT(); // re-render on lang change
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = trl('faqs');
  const bullets = trl('price_bullets');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = ''; };
  }, []);

  return (
    <div className="bg-white text-slate-900">
      {/* NAV */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="font-semibold tracking-tight">Syntegra MoM</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <LangToggle />
            <Link to="/login" className="text-sm text-slate-700 hover:text-slate-900 font-medium">
              {trl('nav_login')}
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-slate-900 text-white text-sm font-semibold px-4 py-2 hover:bg-slate-800 transition"
            >
              {trl('nav_cta')}
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-red-50/70 via-white to-white" />
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-red-700 bg-red-100 px-3 py-1 rounded-full">
              {trl('hero_pill')}
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              {trl('hero_h1_1')}<br />
              <span className="text-red-600">{trl('hero_h1_2')}</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
              {trl('hero_sub')}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup"
                className="rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold px-7 py-3.5 text-base shadow-lg shadow-red-600/20 transition active:scale-95 text-center"
              >
                {trl('hero_cta_primary')} →
              </Link>
              <a
                href="#how"
                className="rounded-full bg-white border border-slate-300 hover:border-slate-900 text-slate-900 font-semibold px-7 py-3.5 text-base transition text-center"
              >
                {trl('hero_cta_secondary')}
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">{trl('hero_trust')}</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-red-200/40 to-amber-200/40 blur-2xl -z-10 rounded-3xl" />
            <img
              src="/landing/hero.jpg"
              alt="Pengguna Syntegra MoM"
              className="rounded-3xl shadow-2xl shadow-slate-300/50 w-full aspect-[5/4] object-cover"
              loading="eager"
            />
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg border border-slate-200 p-3 hidden sm:flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-700">3 catatan dikirim hari ini</span>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">{trl('pain_h2')}</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤯', t: trl('pain_1_title'), b: trl('pain_1_body') },
              { icon: '💸', t: trl('pain_2_title'), b: trl('pain_2_body') },
              { icon: '🌏', t: trl('pain_3_title'), b: trl('pain_3_body') },
            ].map((p, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6">
                <div className="text-3xl">{p.icon}</div>
                <h3 className="mt-3 font-bold text-lg">{p.t}</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">{trl('how_h2')}</h2>
          <div className="mt-12 grid lg:grid-cols-3 gap-8 items-start">
            <Step
              num="1"
              title={trl('how_1_title')}
              body={trl('how_1_body')}
              image="/landing/phone-recording.jpg"
            />
            <Step
              num="2"
              title={trl('how_2_title')}
              body={trl('how_2_body')}
              image="/landing/notes-magic.jpg"
            />
            <Step
              num="3"
              title={trl('how_3_title')}
              body={trl('how_3_body')}
              icon="📧"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">{trl('feat_h2')}</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature icon="🌐" title={trl('feat_1_title')} body={trl('feat_1_body')} />
            <Feature icon="✅" title={trl('feat_2_title')} body={trl('feat_2_body')} />
            <Feature icon="🧠" title={trl('feat_3_title')} body={trl('feat_3_body')} />
            <Feature icon="🔒" title={trl('feat_4_title')} body={trl('feat_4_body')} />
          </div>
        </div>
      </section>

      {/* FOR */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img src="/landing/consultant.jpg" alt="" className="rounded-2xl shadow-lg aspect-[4/5] object-cover w-full" />
            <img src="/landing/meeting-cafe.jpg" alt="" className="rounded-2xl shadow-lg aspect-[4/5] object-cover w-full mt-8" />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{trl('for_h2')}</h2>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">{trl('for_lead')}</p>
            <blockquote className="mt-8 border-l-4 border-red-500 pl-5 py-2 text-slate-800 italic text-lg leading-relaxed">
              {trl('for_q')}
              <footer className="mt-2 not-italic text-sm text-slate-500">{trl('for_q_attr')}</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-slate-900 text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{trl('price_h2')}</h2>
          <p className="mt-4 text-slate-400 text-sm">{trl('price_compare')}</p>

          <div className="mt-12 rounded-3xl bg-white text-slate-900 p-8 sm:p-10 shadow-2xl text-left relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold tracking-wider px-3 py-1 rounded-full">
              {trl('price_pill')}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">{trl('price_amount')}</span>
              <span className="text-lg text-slate-500 font-medium">{trl('price_period')}</span>
            </div>
            <p className="mt-2 text-slate-600">{trl('price_quota')}</p>
            <ul className="mt-8 space-y-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 text-emerald-500 flex-shrink-0">✓</span>
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-8 block w-full rounded-full bg-red-600 hover:bg-red-500 text-white text-center font-semibold py-4 text-lg shadow-lg shadow-red-600/30 transition active:scale-95"
            >
              {trl('price_cta')} →
            </Link>
            <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
              <span className="text-xl">⚡</span>
              <div>
                <div className="font-semibold text-sm text-slate-900">{trl('price_topup_label')}</div>
                <div className="text-sm text-slate-600 mt-0.5">{trl('price_topup_body')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center">{trl('faq_h2')}</h2>
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((f, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-slate-900 pr-4">{f.q}</span>
                  <span className={`text-slate-400 text-xl flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="pb-5 text-slate-600 leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-red-500 via-red-600 to-rose-700" />
        <div className="max-w-3xl mx-auto px-6 py-24 text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{trl('cta_h2')}</h2>
          <p className="mt-5 text-lg text-red-100">{trl('cta_sub')}</p>
          <Link
            to="/signup"
            className="mt-10 inline-block rounded-full bg-white text-red-600 hover:text-red-700 font-bold px-8 py-4 text-lg shadow-2xl transition active:scale-95"
          >
            {trl('cta_btn')} →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
              Syntegra MoM
            </div>
            <p className="text-slate-500 mt-1">{trl('foot_tagline')}</p>
          </div>
          <div className="text-slate-500">{trl('foot_copy')}</div>
        </div>
      </footer>
    </div>
  );
}

function Step({ num, title, body, image, icon }) {
  return (
    <div className="relative">
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        {image ? (
          <img src={image} alt="" className="w-full aspect-[4/3] object-cover" />
        ) : (
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-red-50 to-amber-50 flex items-center justify-center text-7xl">
            {icon}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white text-sm font-bold">
              {num}
            </span>
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <p className="mt-3 text-slate-600 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
