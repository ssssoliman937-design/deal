---
name: gsap-motion
description: حركات GSAP لصفحات الهبوط والمواقع. استخدمها لـ web-dev/designer عند طلب أنيميشن، scroll effects، أو صفحة هبوط "حية".
---

# GSAP Motion

## CDN (لصفحة هبوط بسيطة)
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js"></script>
```

## الأنماط الأساسية (استخدمها، متخترعش من الصفر)
- Hero fade-in: `gsap.from(".hero", {opacity:0, y:30, duration:0.8})`
- Scroll reveal: `gsap.from(el, {scrollTrigger: el, opacity:0, y:40})`
- Stagger لقائمة مميزات: `gsap.from(".feature", {opacity:0, y:20, stagger:0.15})`

## قواعد أداء (يربط مع perf-check)
- GSAP نفسها خفيفة (~50KB) — المشكلة دايمًا في عدد الـ ScrollTrigger instances، مش المكتبة
- `will-change: transform` بس على العناصر المتحركة فعليًا
- موبايل: قلل الحركة أو امنعها لو `prefers-reduced-motion`

## متى تستخدمها
صفحة هبوط لأداة عايزة تبان احترافية. مش لازم في كل صفحة — CSS transitions كافية لحاجات بسيطة.
