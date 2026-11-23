// يبني app/src/main/assets/index.html كملف واحد مستقل (بدون أي اتصال بالإنترنت):
//   node tools/build_html.js   (يتطلب حزمتي tailwindcss v4 و @fortawesome/fontawesome-free)
const fs = require('fs'), path = require('path');
const NM = process.env.NM || '/opt/npm-tools/node_modules';
const ROOT = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'src/index.src.html'), 'utf8');

(async () => {
  // 1) حذف مراجع المكتبات الخارجية
  html = html.replace(/<script src="vendor\/tailwind\.js"><\/script>\s*/, '')
             .replace(/<link href="vendor\/cairo\/cairo\.css" rel="stylesheet">\s*/, '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">\n    ')
             .replace(/<link rel="stylesheet" href="vendor\/fa\/css\/all\.min\.css">\s*/, '')
             .replace(/<script src="vendor\/Tone\.js"><\/script>\s*/, '')
             .replace(/<script>\s*tailwind\.config = \{[\s\S]*?\n    <\/script>\s*/, '');
  if (/vendor\/|tailwind\.config|cdn\./.test(html.replace(/fonts\.g\w+\.com/g, ''))) throw new Error('بقيت مراجع خارجية');

  // 2) محرك الصوت: Web Audio بدل Tone.js
  const audio = fs.readFileSync(path.join(__dirname, 'audio.js'), 'utf8');
  html = html.replace(/function playSound\(type\) \{[\s\S]*?\n        \}\n\n        \/\/ --- إظهار إشعار/, audio + '\n        // --- إظهار إشعار');

  // 3) الوضع الافتراضي فاتح (كما في التصميم المرجعي)
  html = html.replace('<html lang="ar" dir="rtl" class="dark">', '<html lang="ar" dir="rtl">');
  html = html.replace(/function initDarkMode\(\) \{[\s\S]*?\n        \}\n        function toggleDarkMode/,
`function initDarkMode() {
            let saved = null;
            try { saved = localStorage.getItem('history_app_theme'); } catch (e) {}
            setDarkMode(saved === 'dark');
        }
        function toggleDarkMode`);
  html = html.replace(/localStorage\.setItem\('history_app_theme', '(dark|light)'\);/g, "try { localStorage.setItem('history_app_theme', '$1'); } catch (e) {}");

  // 4) Tailwind v4: ترجمة الكلاسات فعلياً
  const { compile } = await import(require('url').pathToFileURL(path.join(NM, 'tailwindcss/dist/lib.mjs')).href);
  const cands = new Set(html.match(/[^\s"'`<>=;{}()]+/g) || []);
  for (const c of ['emerald', 'amber', 'teal', 'blue', 'purple']) {
    ['bg-%-100', 'dark:bg-%-950/80', 'text-%-700', 'dark:text-%-300', 'border-%-200', 'dark:border-%-800'].forEach(t => cands.add(t.replace('%', c)));
  }
  const input = `
    @import "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));
    @theme {
      --font-sans: 'Cairo', 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Droid Arabic Naskh', sans-serif;
      --color-emerald-850: #064e3b;
      --color-amber-450: #f59e0b;
    }
    @layer base { *, ::after, ::before { border-color: var(--color-gray-200, currentColor); } button { cursor: pointer; } }
  `;
  const compiler = await compile(input, {
    base: NM,
    loadStylesheet: async (id, base) => {
      const f = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '') + (id.endsWith('.css') ? '' : '.css');
      return { path: f, base: path.join(NM, 'tailwindcss'), content: fs.readFileSync(path.join(NM, 'tailwindcss', f), 'utf8') };
    },
    loadModule: async () => { throw new Error('no plugins'); },
  });
  const twCss = compiler.build([...cands]);

  // 5) FontAwesome مدمج (solid + regular فقط) بصيغة base64
  const FA = path.join(NM, '@fortawesome/fontawesome-free');
  let fa = fs.readFileSync(path.join(FA, 'css/all.min.css'), 'utf8');
  fa = fa.replace(/@font-face\{[^}]*\}/g, (blk) => {
    const m = blk.match(/fa-(solid-900|regular-400)\.woff2/);
    if (!m) return '';
    const b64 = fs.readFileSync(path.join(FA, 'webfonts', `fa-${m[1]}.woff2`)).toString('base64');
    return blk.replace(/src:[^;}]*/, `src:url(data:font/woff2;base64,${b64}) format("woff2")`);
  });
  fa = fa.replace(/\/\*![\s\S]*?\*\//, '');

  // 6) إبقاء الأيقونات المستخدمة فقط
  const used = new Set((html.match(/\bfa-[a-z0-9-]+/g) || []));
  // قواعد الأيقونات قد تكون مجمّعة: .fa-a,.fa-b{--fa:"..."}
  const iconRe = /((?:\.fa-[a-z0-9-]+,)*\.fa-[a-z0-9-]+)\{--fa:"[^"]*"(?:;--fa--fa:"[^"]*")?\}/g;
  const defined = new Set();
  for (const m of fa.matchAll(iconRe)) m[1].split(',').forEach(x => defined.add(x.slice(1)));
  const missing = [...used].filter(c => /^fa-/.test(c) && !defined.has(c) && !fa.includes('.' + c + '{') && !fa.includes('.' + c + ','));
  if (missing.length) console.log('⚠ أيقونات غير موجودة:', missing.join(' '));
  fa = fa.replace(iconRe, (m, sel) => {
    const keep = sel.split(',').filter(x => used.has(x.slice(1)));
    return keep.length ? m.replace(sel, keep.join(',')) : '';
  });

  html = html.replace('</head>', `<style id="tw">${twCss}</style>\n<style id="fa">${fa}</style>\n</head>`);
  fs.writeFileSync(path.join(ROOT, 'app/src/main/assets/index.html'), html);
  console.log('تم:', (html.length / 1024).toFixed(0), 'KB — tailwind', (twCss.length / 1024).toFixed(0), 'KB');
})().catch(e => { console.error(e); process.exit(1); });
