# رفيق التاريخ الإسلامي — مشروع APK

`app/src/main/assets/index.html` ملف **واحد مستقل تماماً** (الـ CSS والأيقونات والصوت مدمجة داخله)، فالتطبيق يعمل بدون إنترنت ولا يحتاج أي خطوة تحميل قبل البناء.
الخط Cairo يُحمَّل تلقائياً عند وجود إنترنت، وبدونه يستخدم التطبيق خط النظام العربي.

## بناء الـ APK
**GitHub Actions (الأسهل):** ارفع المجلد على مستودع (فرع `main`) ← Actions ← Build APK ← Run workflow ← نزّل `app-debug.apk` من Artifacts.

**Android Studio:** افتح المجلد ← Build ▸ Build APK(s).

**سطر الأوامر** (JDK 17 + Android SDK 34 + Gradle 8.7): `gradle assembleDebug`
الناتج: `app/build/outputs/apk/debug/app-debug.apk`

## تعديل المحتوى أو التصميم
عدّل `src/index.src.html` ثم أعد توليد الملف المستقل بـ `node tools/build_html.js`
(يحتاج Node + حزمتي `tailwindcss@4` و`@fortawesome/fontawesome-free`؛ غيّر مسارهما بمتغير `NM`).
أو عدّل `app/src/main/assets/index.html` مباشرة إذا لم تُضف كلاسات Tailwind جديدة.
