from pathlib import Path
from bs4 import BeautifulSoup, Comment
from urllib.parse import urlparse, urljoin, unquote
import json, re, shutil

source = Path('/tmp/rendered')
repo = Path('.')
(repo / 'app/[[...slug]]').mkdir(parents=True, exist_ok=True)
(repo / 'components').mkdir(exist_ok=True)
(repo / 'lib').mkdir(exist_ok=True)
(repo / 'public/assets').mkdir(parents=True, exist_ok=True)

manifest = json.loads((source / 'manifest.json').read_text())
resources = manifest['resources']
exact = {u: '/assets/' + v['file'] for u, v in resources.items()}
pathmap = {}
for u, v in resources.items():
    try:
        pathmap.setdefault(unquote(urlparse(u).path), '/assets/' + v['file'])
    except Exception:
        pass

missing = {
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/IMG_0788-1024x686.jpg': '/assets/home-clinic.jpg',
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/photo_2026-07-11_21-58-03-1024x768.jpg': '/assets/about-01.jpg',
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/Gemini_Generated_Image_614sr3614sr3614s-1-1024x627.png': '/assets/about-02.png',
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/photo_2026-07-11_21-58-02-1024x768.jpg': '/assets/about-03.jpg',
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/Gemini_Generated_Image_ic45uhic45uhic45-1-1024x842.png': '/assets/about-04.png',
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/Gemini_Generated_Image_9wrr3b9wrr3b9wrr-1-1024x877.png': '/assets/about-05.png',
    'http://127.0.0.1:8080/wp-content/uploads/2026/07/Gemini_Generated_Image_o802njo802njo802-1-1024x805.png': '/assets/about-06.png',
    'http://127.0.0.1:8080/wp-content/uploads/2026/08/IMG_9165-1024x683.jpg': '/assets/service-9165.jpg',
    'http://127.0.0.1:8080/wp-content/uploads/2026/08/IMG_9169-1024x683.jpg': '/assets/5c2582ec4b469516c8573507bb24e7000276a219.jpg',
    'http://127.0.0.1:8080/wp-content/uploads/2026/08/IMG_9170-1024x683.jpg': '/assets/d8a838585666dd64fb569324c6f45d632ec1b0db.jpg',
    'https://resetclinic.org/wp-content/uploads/2026/07/5-ДОДАТОК.pdf': '/assets/doctor-certificate.pdf',
}

def map_url(u, base=None):
    if not u:
        return u
    u = u.strip()
    if u in missing:
        return missing[u]
    if u.startswith(('data:', 'blob:', 'mailto:', 'tel:', '#')):
        return u
    if u in exact:
        return exact[u]
    absolute = urljoin(base, u) if base else u
    if absolute in missing:
        return missing[absolute]
    if absolute in exact:
        return exact[absolute]
    try:
        parsed = urlparse(absolute)
        key = unquote(parsed.path)
        if key in pathmap and (parsed.path.startswith('/wp-content/') or 'fonts.' in parsed.netloc):
            return pathmap[key]
        if parsed.netloc in ('127.0.0.1:8080', 'resetclinic.org', 'www.resetclinic.org'):
            if key in pathmap:
                return pathmap[key]
            if not parsed.path.startswith(('/wp-', '/wp-content/')):
                return (parsed.path or '/') + (('?' + parsed.query) if parsed.query else '') + (('#' + parsed.fragment) if parsed.fragment else '')
    except Exception:
        pass
    return u

# Rewrite CSS captured from the exact renderer. No WP server/runtime is retained.
for url, meta in resources.items():
    src = source / 'resources' / meta['file']
    dst = repo / 'public/assets' / meta['file']
    if meta.get('contentType') == 'text/css':
        text = src.read_text(encoding='utf-8', errors='ignore')
        def css_url(match):
            quote = match.group(1) or ''
            return f"url({quote}{map_url(match.group(2).strip(), url)}{quote})"
        text = re.sub(r"url\(\s*([\"']?)(.*?)\1\s*\)", css_url, text, flags=re.S)
        text = re.sub(r'body\.elementor-page-(\d+)', r'.legacy-page.elementor-page-\1', text)
        dst.write_text(text, encoding='utf-8')
    elif not dst.exists():
        shutil.copy2(src, dst)

pages = {}
for page_file in sorted((source / 'pages').glob('*.html')):
    soup = BeautifulSoup(page_file.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
    title = soup.title.get_text(strip=True) if soup.title else 'Reset Clinic'
    body = soup.body
    body_class = ' '.join(body.get('class', [])) if body else ''

    stylesheets = []
    for link in soup.find_all('link'):
        if 'stylesheet' in (link.get('rel') or []):
            mapped = map_url(link.get('href'))
            if mapped and mapped.startswith('/assets/'):
                stylesheets.append(mapped)

    inline_styles = []
    for style in soup.find_all('style'):
        text = style.string if style.string is not None else style.get_text()
        if not text:
            continue
        text = re.sub(r'body\.elementor-page-(\d+)', r'.legacy-page.elementor-page-\1', text)
        for old, new in exact.items():
            text = text.replace(old, new)
        for old, new in missing.items():
            text = text.replace(old, new)
        def inline_url(match):
            quote = match.group(1) or ''
            return f"url({quote}{map_url(match.group(2).strip())}{quote})"
        text = re.sub(r"url\(\s*([\"']?)(.*?)\1\s*\)", inline_url, text, flags=re.S)
        inline_styles.append(text)

    if body:
        for tag in body.find_all(['script', 'noscript', 'style']):
            tag.decompose()
        for comment in body.find_all(string=lambda t: isinstance(t, Comment)):
            comment.extract()
        for tag in body.find_all(True):
            if tag.name in ('img', 'source'):
                candidates = []
                if tag.get('src'):
                    candidates.append(tag['src'])
                if tag.get('srcset'):
                    candidates.extend(item.strip().split()[0] for item in tag['srcset'].split(',') if item.strip())
                mapped = [map_url(item) for item in candidates]
                local = next((item for item in mapped if item and item.startswith('/assets/')), None)
                if local and tag.name == 'img':
                    tag['src'] = local
                for attr in ('srcset', 'sizes', 'data-src', 'data-lazy-src', 'data-srcset', 'data-sizes'):
                    tag.attrs.pop(attr, None)
            for attr in ('src', 'poster', 'data-bg'):
                if tag.has_attr(attr):
                    tag[attr] = map_url(tag.get(attr))
            if tag.has_attr('href'):
                href = tag.get('href')
                if href and 'elementor-action' in href:
                    tag['href'] = '#reset-menu'
                    tag['class'] = list(dict.fromkeys(list(tag.get('class', [])) + ['reset-menu-trigger']))
                else:
                    tag['href'] = map_url(href)
            if tag.has_attr('action'):
                tag['action'] = '/thank-you/'
            if tag.has_attr('style'):
                def style_url(match):
                    quote = match.group(1) or ''
                    return f"url({quote}{map_url(match.group(2).strip())}{quote})"
                tag['style'] = re.sub(r"url\(\s*([\"']?)(.*?)\1\s*\)", style_url, tag['style'], flags=re.S)
            for attr in list(tag.attrs):
                if attr.startswith('data-wp-'):
                    del tag.attrs[attr]
        html = ''.join(str(item) for item in body.contents)
    else:
        html = ''

    for old, new in missing.items():
        html = html.replace(old, new)
    route = '/' if page_file.name.startswith('01-home') else '/' + page_file.name.split('-', 1)[1].split('.')[0] + '/'
    pages[route] = {
        'title': title,
        'bodyClass': body_class,
        'stylesheets': list(dict.fromkeys(stylesheets)),
        'inlineStyles': inline_styles,
        'html': html,
    }

serialized = json.dumps(pages, ensure_ascii=False)
if '127.0.0.1:8080' in serialized or 'resetclinic.org/wp-content' in serialized:
    bad = sorted(set(re.findall(r'https?://[^\"\\\s<>]+', serialized)))
    print('\n'.join(x for x in bad if '127.0.0.1:8080' in x or 'resetclinic.org/wp-content' in x))
    raise SystemExit('WordPress asset URL remained after migration')
(repo / 'lib/pages.json').write_text(serialized, encoding='utf-8')

(repo / 'package.json').write_text('''{
  "name":"reset-clinic-next","version":"1.0.0","private":true,
  "scripts":{"dev":"next dev","build":"next build","start":"next start"},
  "dependencies":{"next":"15.5.2","react":"19.1.1","react-dom":"19.1.1"},
  "devDependencies":{"@types/node":"^22","@types/react":"^19","@types/react-dom":"^19","typescript":"^5.9.2"}
}\n''')
(repo / 'tsconfig.json').write_text('''{"compilerOptions":{"target":"ES2017","lib":["dom","dom.iterable","esnext"],"allowJs":false,"skipLibCheck":true,"strict":true,"noEmit":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","incremental":true,"plugins":[{"name":"next"}]},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}\n''')
(repo / 'next-env.d.ts').write_text('''/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n// Auto-generated by Next.js.\n''')
(repo / 'next.config.ts').write_text('''import type { NextConfig } from "next";\nconst nextConfig: NextConfig={poweredByHeader:false,compress:true};\nexport default nextConfig;\n''')
(repo / '.gitignore').write_text('''node_modules\n.next\n.env*\n!.env.example\nnpm-debug.log*\n.DS_Store\n''')
(repo / '.env.example').write_text('''CLINIC_BOOKING_API_BASE=\nCLINIC_BOOKING_API_KEY=\n''')
(repo / 'app/globals.css').write_text('''html,body{margin:0;padding:0;min-height:100%}body{overflow-x:hidden}*{box-sizing:border-box}.legacy-page{width:100%;min-height:100vh}.reset-menu-overlay{position:fixed;inset:0;background:#f5f4ed;z-index:999999;display:none;padding:24px}.reset-menu-overlay.is-open{display:flex}.reset-menu-card{margin:auto;width:min(720px,100%);display:grid;gap:18px;text-align:center}.reset-menu-card a{font-family:"Cormorant Garamond",serif;font-size:clamp(30px,5vw,54px);color:#29201b;text-decoration:none}.reset-menu-close{position:absolute;top:24px;right:24px;border:0;background:none;font-size:34px;cursor:pointer;color:#29201b}.reset-menu-book{display:inline-flex!important;justify-content:center;align-items:center;border:1px solid #29201b;border-radius:999px;padding:15px 28px!important;font-family:Manrope,sans-serif!important;font-size:14px!important}.legacy-page .e-n-tabs-content>[role="tabpanel"]{display:none}.legacy-page .e-n-tabs-content>[role="tabpanel"].e-active{display:flex}\n''')
(repo / 'app/layout.tsx').write_text('''import type {Metadata} from "next";import "./globals.css";export const metadata:Metadata={title:"Reset Clinic",description:"Клініка естетичної медицини"};export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="uk"><body>{children}</body></html>}\n''')
(repo / 'components/LegacyPage.tsx').write_text('''import LegacyEnhancer from "./LegacyEnhancer";export type LegacyPageData={title:string;bodyClass:string;stylesheets:string[];inlineStyles:string[];html:string};export default function LegacyPage({data}:{data:LegacyPageData}){return <>{data.stylesheets.map((href,i)=><link key={i} rel="stylesheet" href={href}/>)}{data.inlineStyles.map((css,i)=><style key={i} dangerouslySetInnerHTML={{__html:css}}/>)}<div className={`legacy-page ${data.bodyClass}`} dangerouslySetInnerHTML={{__html:data.html}}/><div id="reset-menu-overlay" className="reset-menu-overlay"><button id="reset-menu-close" className="reset-menu-close" aria-label="Закрити">×</button><nav className="reset-menu-card"><a href="/">Головна</a><a href="/about/">Про клініку</a><a href="/services/">Послуги</a><a href="/doctors/">Лікарі</a><a href="/price/">Прайс</a><a href="/contacts/">Контакти</a><a className="reset-menu-book" href="/booking/">Записатись на прийом</a></nav></div><LegacyEnhancer/></>}\n''')
(repo / 'components/LegacyEnhancer.tsx').write_text('''"use client";import{useEffect}from"react";export default function LegacyEnhancer(){useEffect(()=>{const clean:(()=>void)[]=[];document.querySelectorAll<HTMLFormElement>(".legacy-page form").forEach(form=>{const fn=(e:Event)=>{e.preventDefault();window.location.href="/thank-you/"};form.addEventListener("submit",fn);clean.push(()=>form.removeEventListener("submit",fn))});document.querySelectorAll<HTMLElement>(".e-n-tabs").forEach(root=>{const tabs=[...root.querySelectorAll<HTMLElement>("[role=tab]")];tabs.forEach(tab=>{const fn=()=>{tabs.forEach(t=>{const active=t===tab;t.setAttribute("aria-selected",active?"true":"false");t.classList.toggle("e-active",active);const id=t.getAttribute("aria-controls");if(id)root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.classList.toggle("e-active",active)})};tab.addEventListener("click",fn);clean.push(()=>tab.removeEventListener("click",fn))})});const overlay=document.getElementById("reset-menu-overlay");const open=(e:Event)=>{e.preventDefault();overlay?.classList.add("is-open")};const close=()=>overlay?.classList.remove("is-open");document.querySelectorAll<HTMLElement>(".reset-menu-trigger").forEach(x=>{x.addEventListener("click",open);clean.push(()=>x.removeEventListener("click",open))});const btn=document.getElementById("reset-menu-close");btn?.addEventListener("click",close);clean.push(()=>btn?.removeEventListener("click",close));const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};window.addEventListener("keydown",key);clean.push(()=>window.removeEventListener("keydown",key));return()=>clean.forEach(x=>x())},[]);return null}\n''')
(repo / 'app/[[...slug]]/page.tsx').write_text('''import{notFound}from"next/navigation";import type{Metadata}from"next";import LegacyPage,{type LegacyPageData}from"../../components/LegacyPage";import pages from"../../lib/pages.json";export const dynamic="force-dynamic";type Props={params:Promise<{slug?:string[]}>};const route=(s?:string[])=>s?.length?`/${s.join("/")}/`:"/";export async function generateMetadata({params}:Props):Promise<Metadata>{const{slug}=await params;const d=(pages as Record<string,LegacyPageData>)[route(slug)];return d?{title:d.title}:{title:"Reset Clinic"}}export default async function Page({params}:Props){const{slug}=await params;const d=(pages as Record<string,LegacyPageData>)[route(slug)];if(!d)notFound();return <LegacyPage data={d}/>}\n''')
(repo / 'app/not-found.tsx').write_text('''export default function NotFound(){return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",fontFamily:"Manrope,sans-serif",background:"#f5f4ed",color:"#29201b"}}><div style={{textAlign:"center"}}><h1 style={{fontFamily:"Cormorant Garamond,serif",fontSize:72,margin:0}}>404</h1><p>Сторінку не знайдено</p><a href="/" style={{color:"inherit"}}>На головну</a></div></main>}\n''')
(repo / 'README.md').write_text('''# RESET Clinic — Next.js SSR\n\nClean Next.js App Router migration of RESET Clinic. Production contains no PHP runtime, WordPress server, WordPress database, or CMS dependency. All eight public routes are server-rendered and visual assets are local.\n\n## Development\n```bash\nnpm install\nnpm run dev\n```\n\nThe historical booking backend credential is intentionally not committed. Reconnect it server-side through the variables in `.env.example`.\n''')
