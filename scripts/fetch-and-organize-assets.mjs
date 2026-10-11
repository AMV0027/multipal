import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.resolve(ROOT_DIR, '.asset_cache');
const EXTRACT_DIR = path.resolve(CACHE_DIR, 'extracted');
const ASSETS_DIR = path.resolve(ROOT_DIR, 'assets');
const PLATFORM_PUBLIC_ASSETS = path.resolve(ROOT_DIR, 'apps/platform-web/public/assets');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(EXTRACT_DIR)) fs.mkdirSync(EXTRACT_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(PLATFORM_PUBLIC_ASSETS)) fs.mkdirSync(PLATFORM_PUBLIC_ASSETS, { recursive: true });

const PACKS = [
  {
    name: 'top-down-shooter',
    url: 'https://kenney.nl/media/pages/assets/top-down-shooter/230204340a-1677694684/kenney_top-down-shooter.zip',
  },
  {
    name: 'pixel-platformer',
    url: 'https://kenney.nl/media/pages/assets/pixel-platformer/33bb4921eb-1696667883/kenney_pixel-platformer.zip',
  },
  {
    name: 'platformer-characters',
    url: 'https://kenney.nl/media/pages/assets/platformer-characters/b85f388c42-1677693768/kenney_platformer-characters.zip',
  },
  {
    name: 'pixel-vehicle-pack',
    url: 'https://kenney.nl/media/pages/assets/pixel-vehicle-pack/570a4c9051-1677578609/kenney_pixel-vehicle-pack.zip',
  },
  {
    name: 'racing-pack',
    url: 'https://kenney.nl/media/pages/assets/racing-pack/c4cd68480a-1677662443/kenney_racing-pack.zip',
  },
  {
    name: 'ui-pack-pixel-adventure',
    url: 'https://kenney.nl/media/pages/assets/ui-pack-pixel-adventure/405ba5278a-1729196257/kenney_ui-pack-pixel-adventure.zip',
  },
  {
    name: 'impact-sounds',
    url: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip',
  },
  {
    name: 'interface-sounds',
    url: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip',
  },
  {
    name: 'sci-fi-sounds',
    url: 'https://kenney.nl/media/pages/assets/sci-fi-sounds/6b296f9ecf-1677589334/kenney_sci-fi-sounds.zip',
  },
  {
    name: 'voiceover-pack-fighter',
    url: 'https://kenney.nl/media/pages/assets/voiceover-pack-fighter/6ceb77c6f1-1677589837/kenney_voiceover-pack-fighter.zip',
  },
  {
    name: 'music-jingles',
    url: 'https://kenney.nl/media/pages/assets/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip',
  },
];

async function downloadPack(pack) {
  const zipPath = path.resolve(CACHE_DIR, `${pack.name}.zip`);
  const outDir = path.resolve(EXTRACT_DIR, pack.name);

  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length > 0) {
    console.log(`[Cache] Pack ${pack.name} already extracted.`);
    return outDir;
  }

  if (!fs.existsSync(zipPath)) {
    console.log(`[Download] Downloading ${pack.name} from ${pack.url}...`);
    const res = await fetch(pack.url, { headers: { 'User-Agent': 'MultiPal-AssetFetcher/1.0' } });
    if (!res.ok) throw new Error(`Failed to download ${pack.name}: ${res.status} ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(buffer));
    console.log(`[Download] Saved ${pack.name}.zip (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  console.log(`[Extract] Extracting ${pack.name}.zip to ${outDir}...`);
  try {
    execSync(`tar -xf "${zipPath}" -C "${outDir}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`[Extract Error] tar failed for ${pack.name}:`, err.message);
  }

  return outDir;
}

async function main() {
  console.log('--- MultiPal Asset Pipeline Fetcher ---');
  for (const pack of PACKS) {
    try {
      await downloadPack(pack);
    } catch (e) {
      console.error(`Error processing ${pack.name}:`, e.message);
    }
  }
  console.log('--- All asset packs downloaded and extracted ---');
}

main().catch(console.error);
