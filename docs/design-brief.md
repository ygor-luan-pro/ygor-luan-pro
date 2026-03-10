# Design Brief — Ygor Luan Pro

**Versão**: 1.0.0 | **Última atualização**: 2026-03-10

---

## 1. Identidade Visual

| Atributo     | Valor                                         |
|--------------|-----------------------------------------------|
| Nome         | Ygor Luan Pro                                 |
| Estética     | Barbearia premium / luxo                      |
| Tons         | Escuros quentes, cobre, creme                 |
| Vibe         | Masculinidade refinada, tipografia-driven     |
| Estilo       | Flat sem sombras — bordas no lugar de shadows |

---

## 2. Paleta de Cores

Todas as cores são expostas como CSS Custom Properties em `src/styles/global.css`.

| Token          | Valor                     | Uso                                         |
|----------------|---------------------------|---------------------------------------------|
| `--espresso`   | `#18130E`                 | Fundo principal (`html`, `body`)            |
| `--mahogany`   | `#221A12`                 | Cards, seções alternadas                    |
| `--tobacco`    | `#2E2015`                 | Inputs, fundos terciários                   |
| `--cream`      | `#F2E8DA`                 | Texto primário                              |
| `--parchment`  | `#C4B49A`                 | Texto secundário                            |
| `--fade`       | `#7A6B57`                 | Texto terciário, placeholders, desabilitado |
| `--copper`     | `#C9853A`                 | Acento principal — CTAs, hover, destaque    |
| `--copper-dim` | `rgba(201,133,58, 0.15)`  | Fundo sutil de destaque / badge             |
| `--ink`        | `rgba(201,133,58, 0.12)`  | Bordas padrão (rest state)                  |
| `--blade`      | `rgba(201,133,58, 0.30)`  | Bordas de foco / hover                      |

### Hierarquia de uso

```
Fundo:    espresso (base) → mahogany (card) → tobacco (input)
Texto:    cream (primário) → parchment (secundário) → fade (terciário)
Acento:   copper (solid) → blade (semi) → ink (sutil) → copper-dim (bg)
```

---

## 3. Tipografia

### Fontes

| Família              | Fallback      | Pesos                 | Estilo   | Uso                                     |
|----------------------|---------------|-----------------------|----------|-----------------------------------------|
| **Cormorant Garamond** | Georgia, serif | 300 / 400 / 600 / 700 | 400i     | Display: h1–h6, hero, títulos           |
| **DM Sans**          | system-ui     | 300 / 400 / 500 / 600 | —        | Corpo, botões, navegação, UI geral      |
| **DM Mono**          | monospace     | 400 / 500             | —        | Preços, números, badges, código         |

### Escala tipográfica

| Contexto       | Fonte              | Tamanho                          | Peso |
|----------------|--------------------|----------------------------------|------|
| Hero h1        | Cormorant Garamond | `clamp(3.5rem, 9vw, 7rem)`       | 300  |
| Títulos de seção | Cormorant Garamond | 2.5rem–3rem (responsive)       | 400  |
| Section eyebrow | DM Sans           | 12px, uppercase, ls: 0.2em      | 500  |
| Corpo / parágrafo | DM Sans         | 1rem (16px), line-height 1.7    | 300  |
| Botão          | DM Sans            | 14px                             | 600  |
| Preço          | DM Mono            | 2.5rem–3rem                      | 400  |
| Badge / label  | DM Mono            | 11px–13px                        | 400  |

---

## 4. Componentes

### Botões

**`.btn-primary`**
```css
background: var(--copper);
color: var(--espresso);
border-radius: 2px;
padding: 0.75rem 1.5rem;   /* py-3 px-6 */
font-family: DM Sans;
font-size: 14px;
font-weight: 600;
transition: all 0.2s ease;
/* hover: brightness(1.1) ou lighten copper */
```

**`.btn-ghost`**
```css
background: transparent;
border: 1px solid var(--blade);
color: var(--parchment);
border-radius: 2px;
padding: 0.75rem 1.5rem;
font-family: DM Sans;
font-size: 14px;
font-weight: 600;
transition: all 0.2s ease;
/* hover: border-color → copper; color → cream */
```

---

### Cards

```css
background: var(--mahogany);
border: 1px solid var(--ink);
border-radius: 2px;
padding: 1.5rem;
transition: border-color 0.2s ease;
/* hover: border-color → var(--copper) */
```

---

### Inputs / Formulários

```css
background: var(--tobacco);
border: 1px solid var(--ink);
border-radius: 2px;
color: var(--cream);
padding: 0.625rem 1rem;
font-family: DM Sans;
font-size: 14px;
/* placeholder: color → var(--fade) */
/* focus: border-color → var(--blade); outline: none */
```

---

### Section Eyebrow (`.section-eyebrow`)

```css
font-family: DM Sans;
font-size: 12px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.2em;
color: var(--copper);
```

---

### Divisores

| Classe          | Estilo                                             |
|-----------------|----------------------------------------------------|
| `.blade`        | `height: 1px; background: var(--blade)`            |
| `.page-divider` | `height: 1px; background: var(--blade); max-width: 20rem; margin: auto` |

---

### Timeline de Aulas

```css
/* Container */
.lesson-timeline {
  border-left: 2px solid rgba(201, 133, 58, 0.20);
}

/* Aula concluída */
.lesson-timeline--completed {
  border-left-color: rgba(201, 133, 58, 0.50);
}
```

---

### Avatar

```css
width: 4rem;      /* 64px */
height: 4rem;
border: 1px solid var(--blade);
background: var(--copper-dim);
border-radius: 2px;
/* avatares circulares (testimonials): border-radius: 9999px */
```

---

## 5. Border-radius

| Uso                      | Valor         |
|--------------------------|---------------|
| Padrão (cards, botões, inputs) | `2px` — quase reto, minimalista |
| Avatares circulares      | `9999px` (`rounded-full`) |

> Ausência de arredondamento acentuado é intencional — reforça a estética de precisão e barbearia premium.

---

## 6. Breakpoints (Tailwind padrão)

| Token | Largura mínima | Uso principal |
|-------|---------------|---------------|
| `sm`  | 640px         | Ajustes menores de layout |
| `md`  | 768px         | Principal — shifts de layout significativos |
| `lg`  | 1024px        | Grids multi-coluna |
| `xl`  | 1280px        | Containers de largura máxima |

---

## 7. Espaçamentos Comuns

| Uso                  | Classe Tailwind    | Valor CSS |
|----------------------|--------------------|-----------|
| Seções (vertical)    | `py-24`            | 6rem      |
| Cards (padding)      | `p-8`              | 2rem      |
| Cards menores        | `p-6`              | 1.5rem    |
| Gaps entre elementos | `gap-4` – `gap-8`  | 1–2rem    |
| Container estreito   | `max-w-2xl`        | 42rem     |
| Container médio      | `max-w-4xl`        | 56rem     |
| Container largo      | `max-w-6xl`        | 72rem     |

---

## 8. Padrões de Interação

| Padrão                     | Valor / Comportamento                              |
|----------------------------|----------------------------------------------------|
| Transição padrão           | `0.2s ease` (0.3s para transições de layout)      |
| Hover de texto             | `fade` → `parchment` → `cream` (escala crescente) |
| Elemento desabilitado      | `opacity: 0.4`; `cursor: not-allowed`              |
| Sombras                    | **Proibido** — bordas substituem shadows           |
| Nav item ativo (sidebar)   | `border-left: 2px solid var(--copper)`             |
| Focus ring                 | `border-color: var(--blade)` + `outline: none`    |
| Hover de card              | `border-color` transition para `var(--copper)`     |

---

## 9. Assets Existentes

| Arquivo                                   | Dimensões | Uso                         |
|-------------------------------------------|-----------|-----------------------------|
| `/public/images/ygor-luan-hero.jpg`       | 320×480   | Hero section, aspect-ratio 2/3 |
| `/public/images/ygor-luan-cta.jpg`        | —         | CTA section                 |
| `/public/images/testimonials/*.jpg`       | 40×40     | Avatares de depoimentos (circular) |
| `/public/images/og-cover.jpg`             | **1200×630** | OG Image — **pendente criação** |

> A imagem `og-cover.jpg` ainda não existe. Deve ser criada antes do go-live para garantir que o compartilhamento social exiba preview correto. Formato: JPG, 1200×630px, fundo `#18130E`, logotipo + tagline centralizada.

---

## 10. Tokens de Referência Rápida

```css
/* Copie e cole onde necessário */
:root {
  --espresso:   #18130E;
  --mahogany:   #221A12;
  --tobacco:    #2E2015;
  --cream:      #F2E8DA;
  --parchment:  #C4B49A;
  --fade:       #7A6B57;
  --copper:     #C9853A;
  --copper-dim: rgba(201,133,58,0.15);
  --ink:        rgba(201,133,58,0.12);
  --blade:      rgba(201,133,58,0.30);
}
```
