# Javořinka – web chaty

Statický **jednostránkový web** chaty Javořinka (Rožmitál u Broumova). Veškerý
obsah, styly i skripty jsou v jediném souboru **`index.html`** (inline CSS + JS).
**Žádný build** – jde o čistě statický web.

```
index.html            celý web (HTML + CSS + JS)
images/               fotky a půdorysy (pudorys-1np.png, pudorys-2np.png, …)
data/zajimavosti.gpx  body zájmu pro mapu okolí (export z „moje mapy" Mapy.cz)
```

---

## Nasazení

| Prostředí | Větev | URL | Pozn. |
|---|---|---|---|
| **Produkce** | `main` | **https://javorinka.eu** | vlastní doména (Vercel), HTTPS auto |
| Produkce (mirror) | `main` | https://vdubr.github.io/javorinka-web/ | GitHub Pages |
| **Test / preview** | `develop` | `javorinka-web-git-develop-vdubrs-projects.vercel.app` | chráněné Vercel loginem |

- **Push do `main`** → automaticky nasadí **Vercel (javorinka.eu)** i **GitHub Pages**.
- **Push do `develop`** → Vercel postaví **preview** (jen když má develop nový commit oproti main).
- Vercel projekt: `vdubrs-projects/javorinka-web`, production branch = `main`.
- Doména `javorinka.eu`: apex `A` záznam → `76.76.21.21` (Vercel), DNS spravované u **Forpsi**.

### Workflow
1. Změny dělej na větvi **`develop`** → `git push` → otestuj na preview URL.
2. Až je vše OK → **merge `develop` → `main`** → nasadí se produkce.
3. Nejrychlejší test bez pushe: `vercel dev` nebo `python3 -m http.server` v kořeni.

---

## Mapy (čti, než budeš sahat na mapu!)

- Web používá **OpenLayers** + **rastrové dlaždice Mapy.cz** (REST API
  `https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}`). API klíč je přímo
  v `index.html` (konstanta `MAPY_API_KEY`).
- **Klíč je omezený na domény (HTTP referrer)** v účtu na **developer.mapy.com**.
  - Povolené: `javorinka.eu`, `vdubr.github.io`.
  - Nepovolené (web tam ukáže **OpenStreetMap**): `www.javorinka.eu`, `*.vercel.app`.
  - Přidáš-li doménu mezi povolené referrery, mapa se tam **sama přepne** na Mapy.cz.
- **Logika v kódu** (funkce `createMapyMap`):
  - na doménách v poli `startMapy` (`javorinka.eu`, `vdubr.github.io`) startuje **rovnou Mapy.cz** (bez probliknutí);
  - jinde začne **OSM** a přes `fetch` ověří, zda klíč na dané doméně projde → případně přepne na Mapy.cz.
  - Když nově povolíš doménu u klíče, můžeš ji doplnit do `startMapy`, ať na ní neblikne OSM.
- ⚠️ **Mapy.cz JS SDK (`loader.js`) je od konce 2025 mrtvý – nepoužívat.** Jediná
  cesta je renderer (OpenLayers / Leaflet / MapLibre) + REST dlaždice.
- **Mapa okolí (POI):** OpenLayers načítá `data/zajimavosti.gpx`. Vlastní body
  „moje mapy" nejdou stáhnout přes API → musí se **exportovat** (GPX/KML/GeoJSON)
  z Mapy.cz a uložit do `data/`. (Zdrojová mapa: `mid=68724277d5f58945524d64db`.)
- Ovládání map: **posun tažením** kdykoliv, **zoom kolečkem jen s Ctrl/⌘**
  (jinak scrolluje stránka + zobrazí se hláška). Povinné **logo Mapy.cz +
  atribuce** se zobrazují jen když se reálně používají dlaždice Mapy.cz.

---

## Kde co upravit (vše v `index.html`)

- **Pořadí sekcí:** Hero → O chatě (+ půdorysy) → Mapa → Termíny → Apartmány →
  Společné prostory → Zahrada → Okolí (POI mapa) → Stravování → patička.
  Musí sedět s navigací (`<ul class="nav-links">`) **i** s polem `navAnchors`
  v JS (zvýrazňování aktivní položky při scrollu).
- **Obsazenost kalendáře:** objekt `REZERVACE` v `<script>` (apt1/apt2/apt3,
  formát `{ od: "YYYY-MM-DD", do: "YYYY-MM-DD" }`). ⚠️ Zatím **mock data**.
- **Kontakty:** v patičce. ⚠️ Zatím **placeholdery** (`+420 123 456 789`, `info@javorinka.cz`).
- **Galerie (lightbox):** klik na fotku ji zvětší, šipky `←/→` projdou všechny
  fotky odshora dolů. Bere `<img>` ze selektorů `.big-ph, .apt-main-photo,
  .space-photo, .photo-strip, .plan-card`. Placeholdery (ikonky) se nepočítají –
  galerie roste sama s reálnými fotkami.
- **Baner „ve výstavbě":** fixní žlutý pruh dole, výška přes proměnnou `--banner-h`
  (logo/atribuce map jsou posunuté nad něj).

---

## Zbývá dodělat

- [ ] Reálné **kontakty** v patičce.
- [ ] Reálné **rezervace** v objektu `REZERVACE`.
- [ ] Doplnit chybějící **fotky** (placeholdery: koupelny, garáž, balkon, krb,
      sklep, okolí) – automaticky se zařadí do galerie.
- [ ] (Volitelně) povolit `www.javorinka.eu` a `*.vercel.app` u mapového klíče;
      nastavit `www` → redirect na apex.

---

## Poznámky

- `node_modules/`, `package.json`, `package-lock.json`, `.vercel` jsou v
  `.gitignore`. Vznikly omylem přes `npm install vercel`; web žádné npm závislosti
  nepotřebuje (je statický). Lokálně je můžeš smazat.
