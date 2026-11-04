# Pașaportul Runcului — PWA Mobil (Lider European 2026)

> Aplicație web progresivă (PWA) de tip **mobile-first**, ultra-ușoară și fără server, creată pentru vizitatorii și comunitatea comunei **Runcu, județul Gorj** în cadrul proiectului **„Lider European 2026”**.
> Vizitatorii explorează obiectivele fizice pe teren, scanează codurile QR de pe panouri și adună ștampile digitale unice în pașaportul lor, primind la final **Certificatul Oficial de Explorator**.

---

## 🌟 Principii & Caracteristici Cheie

- **100% Client-Side & Fără Conturi:** Toate datele și ștampilele sunt stocate exclusiv pe telefonul utilizatorului (`localStorage` versionat cu fallback în memorie). Fără baze de date, fără colectare de date personale, fără cookie-uri de urmărire.
- **Ultra-ușor & Rapid pe Teren:** Fără biblioteci grele 3D/MapLibre. Pachetul de producție are sub **55 KB gzipped**, permițând încărcarea instantanee chiar și în zonele montane cu semnal 3G slab.
- **Armonizare vizuală cu Harta Runcului:** Păstrează identitatea vizuală a proiectului: tema *Obsidian Carpathian* (`#0A0E0D`), accentele aurii de patrimoniu (`#E5A93C`), fonturile *Cormorant Garamond*, *Plus Jakarta Sans* și *JetBrains Mono*, precum și culorile categoriilor A–D.
- **Ștampilare Grafică Autentică:** Ștampile SVG generate dinamic cu dublu cerc, text curbat, unghi de rotație unic stabil per obiectiv, efect de cerneală, animație GSAP de impact, vibrație tactilă (`navigator.vibrate`) și sunet procedural opțional (Web Audio API).
- **Fallback Manual:** Dacă telefonul nu poate scana codul QR cu camera, vizitatorul introduce pur și simplu codul scurt de 6 caractere afișat sub codul QR.
- **PWA & Offline:** Manifest web, iconițe optimizate (192, 512, maskable), Service Worker pentru cache offline al aplicației, datelor și imaginilor, ghid iOS („Adaugă pe ecranul principal”) și prompt discret de instalare pe Android.
- **Certificat de Explorator:** La colectarea tuturor ștampilelor se deblochează certificatul oficial cu diplomă de înaltă rezoluție pe Canvas, export PNG și partajare directă prin Web Share API.
- **Kit de Tipărire A4 Inclus:** Script automat care generează afișe A4 gata de tipar pentru fiecare punct, cu coduri QR de înaltă corecție (nivel H), instrucțiuni clare și cod scurt lizibil.
- **Mod Demo (`?demo=1`):** Permite testarea rapidă și deblocarea directă a oricărei ștampile într-un mediu complet izolat de pașaportul real.

---

## 🧭 Cele 4 Obiective Inițiale cu Ștampilă

1. **Categoria A (Obiective turistice – `#10B981`):**  
   *Rezervația Naturală Cheile Sohodolului* — `a-chei-rau` (`[23.1365, 45.1625]`)
2. **Categoria B (Tradiții și obiceiuri – `#F97316`):**  
   *Portul popular gorjenesc și tinerii păstrători de tradiții din Runcu* — `b-port-popular-ansamblu` (`[23.1423, 45.1192]`)
3. **Categoria C (Personalități locale – `#EAB308`):**  
   *Maria Apostol (1954–1993) — „Privighetoarea Gorjului”* — `c-personalitate-locala` (`[23.1415, 45.1198]`)
4. **Categoria D (Poveștile comunității – `#A855F7`):**  
   *Satul Răchiți — Poarta de intrare în comună și troițele sculptate* — `d-rachiti-troite-lemn` (`[23.1517, 45.0975]`)

---

## 🚀 Instalare și Rulare Locală

### Cerințe preliminare
- Node.js >= 18 (recomandat Node 20 sau 22)
- npm >= 9

### Comenzi rapide

```bash
# 1. Instalare dependențe
npm install

# 2. Pornire server de dezvoltare
npm run dev

# 3. Export & actualizare date din harta Runcu (păstrează token-urile existente)
npm run export-stamps

# 4. Generare Kit de Tipărire A4 (afișe QR printabile)
npm run print-kit

# Sau generare kit cu un URL personalizat de producție:
npm run print-kit -- https://adresa-ta-finala.ro

# 5. Build pentru producție
npm run build

# 6. Previzualizare build de producție
npm run preview
```

---

## ⚙️ Configurare (`src/config.js`)

Fișierul `src/config.js` concentrează toate setările aplicației:

```javascript
export const APP_CONFIG = {
  appName: 'Pașaportul Runcului',
  appSubtitle: 'Lider European 2026 • Comuna Runcu, Jud. Gorj',
  
  // Linkul aplicației unde vor duce codurile QR fizice
  PASSPORT_URL: 'https://pasaport-runcu.web.app',
  
  // Linkul către harta interactivă Runcu (pentru butonul „Vezi pe hartă”)
  MAP_URL: 'https://mapa-runcu.web.app',
  
  // Verificare geolocație (opțională, dezactivată implicit conform specificațiilor)
  verifyLocation: false,
  
  // Feedback tactil & sunet la ștampilare
  vibrationEnabled: true,
  soundEnabled: false,
  
  // Recompensă/partener (rămâne dezactivat/gol până la stabilirea unui partener)
  reward: {
    enabled: false,
    text: '',
    partner: ''
  }
};
```

---

## 📄 Kitul de Tipărire A4 (`print-kit/`)

Rulând comanda:
```bash
npm run print-kit
```
Se generează fișierul `print-kit/runcu-kit-tiparire.html` și fișierele vectoriale SVG din `print-kit/qr/`:
- Deschide `print-kit/runcu-kit-tiparire.html` în orice browser (Chrome, Edge, Firefox, Safari) și apasă **Ctrl+P / Cmd+P** (Print to PDF sau Print direct pe imprimantă).
- Formatul este calibrat exact pentru **A4 Portrait**, generând automat 1 afiș per pagină.
- Codurile QR au nivel de corecție a erorilor **H** (rezistă la zgârieturi, uzură sau murdărie pe panouri exterioare).
- Fiecare afiș conține: Antetul oficial, Stema comunei, Categoria, Titlul obiectivului, Codul QR de mari dimensiuni, Codul scurt manual de 6 caractere și instrucțiuni în 2 pași.

---

## 🌐 Ghid de Publicare (Deploy)

Aplicația este 100% statică și folosește **hash routing** (`#/`, `#/pasaport`, `#/stampila/<id>/<token>`, `#/certificat`), ceea ce garantează compatibilitatea pe orice serviciu de găzduire fără configurări de server.

### 1. Netlify
- Fișierul `netlify.toml` este gata inclus în rădăcină.
- Conectează depozitul Git sau trage folderul `dist/` în Netlify Drop.
- Build command: `npm run build`
- Publish directory: `dist`

### 2. GitHub Pages
- Fișierul de automatizare `.github/workflows/deploy.yml` este deja configurat.
- În setările depozitului GitHub: **Settings -> Pages -> Source: GitHub Actions**.
- La fiecare `git push` în branch-ul `main`, aplicația se publică automat.
- Datorită setării `base: './'` din `vite.config.js`, aplicația funcționează perfect indiferent de subdirectorul alocat (ex. `https://utilizator.github.io/pasaport/`).

---

## 🔒 Confidențialitate

- Aplicația respectă cu strictețe intimitatea utilizatorilor: nu colectează date personale, adrese IP, identificatori de dispozitiv sau coordonate GPS.
- Numele introdus pentru diplomă și ștampilele obținute rămân exclusiv în browserul vizitatorului.
