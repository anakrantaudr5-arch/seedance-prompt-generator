import React, { useMemo, useState } from 'react'
import { Copy, Film, Plus, Trash2, WandSparkles, Clapperboard, MessageSquareText } from 'lucide-react'

async function compressCharacterImage(file) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 3_800_000 && quality > 0.45) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > 3_800_000) throw new Error('Foto terlalu besar setelah dikompres. Coba foto lain.');
  return dataUrl;
}

const blankScene = () => ({ title: 'Scene baru', duration: '5 detik', visual: '', camera: 'Slow dolly in', action: '' })
const blankCharacter = () => ({ name: 'Karakter 1', look: '', photo: '', voice: 'Suara sedang, natural', language: 'Bahasa Indonesia', accent: 'Netral', emotion: 'Tenang', delivery: 'Natural, jelas', pace: 'Sedang', dialogue: '', start: '00:00', end: '00:05' })

export default function App() {
  const [project, setProject] = useState('Film pendek')
  const [style, setStyle] = useState('Cinematic realism')
  const [ratio, setRatio] = useState('16:9')
  const [genre, setGenre] = useState('Drama')
  const [scenes, setScenes] = useState([{...blankScene(), title:'Scene 1', visual:'Sebuah jalan kota saat hujan malam hari', action:'Karakter berjalan perlahan melewati lampu jalan.'}])
  const [characters, setCharacters] = useState([{...blankCharacter(), name:'Alya', look:'Perempuan muda, rambut hitam sebahu, jaket krem.'}])
  const [negative, setNegative] = useState('low quality, blurry, distorted face, extra fingers, inconsistent character, subtitles, watermark')
  const [extra, setExtra] = useState('Natural motion, realistic physics, consistent lighting, detailed environment')
  const [copied, setCopied] = useState(false)
  const [analyzingIndex, setAnalyzingIndex] = useState(null)
  const [analysisErrors, setAnalysisErrors] = useState({})

  async function analyzeCharacter(i) {
    const character = characters[i];
    if (!character?.photo) {
      setAnalysisErrors(old => ({...old, [i]: 'Unggah foto karakter terlebih dahulu.'}));
      return;
    }
    setAnalyzingIndex(i);
    setAnalysisErrors(old => ({...old, [i]: ''}));
    try {
      const response = await fetch('/api/analyze-character', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({image: character.photo})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analisis gagal. Coba lagi.');
      updateCharacter(i, 'look', data.description);
    } catch (error) {
      setAnalysisErrors(old => ({...old, [i]: error.message || 'Terjadi kesalahan saat menganalisis foto.'}));
    } finally {
      setAnalyzingIndex(null);
    }
  }

  const updateScene = (i, key, value) => setScenes(old => old.map((s,n) => n===i ? {...s,[key]:value} : s))
  const updateCharacter = (i, key, value) => setCharacters(old => old.map((c,n) => n===i ? {...c,[key]:value} : c))

  const prompt = useMemo(() => {
    const characterText = characters.map(c =>
      `CHARACTER: ${c.name}
Appearance/continuity: ${c.look}
Visual reference: ${c.photo ? 'A reference photo is selected in the app. Use it as the primary visual guide for this character; preserve face, hair, clothing, and distinctive features consistently across every scene.' : 'No reference photo selected; follow the written appearance description.'}
Voice: ${c.voice}; language: ${c.language}; accent: ${c.accent}
Emotion: ${c.emotion}; delivery: ${c.delivery}; pace: ${c.pace}
Dialogue (${c.start}–${c.end}): "${c.dialogue || '[dialogue not set]'}"`
    ).join('\n\n')
    const sceneText = scenes.map((s,i) =>
      `SCENE ${i+1} — ${s.title} (${s.duration})
Visual: ${s.visual}
Action: ${s.action}
Camera: ${s.camera}`
    ).join('

')
    return `${project.toUpperCase()}
Format: ${ratio} | Genre: ${genre} | Visual style: ${style}

CHARACTER CONTINUITY
${characterText}

STORYBOARD
${sceneText}

DIALOGUE & LIP-SYNC DIRECTION
Each character speaks only during their assigned time window. Match mouth movement to the exact spoken words. Preserve natural facial expressions and speaking rhythm. Do not overlap dialogue unless explicitly requested. Keep each character's voice description and appearance consistent across scenes.

GLOBAL VISUAL DIRECTION
${extra}

NEGATIVE PROMPT
${negative}`
  }, [project, style, ratio, genre, scenes, characters, negative, extra])

  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(()=>setCopied(false), 1800) }
    catch { window.prompt('Salin prompt berikut:', prompt) }
  }

  return <main className="shell">
    <header className="topbar"><div className="brand"><div className="brandIcon"><Clapperboard size={21}/></div><div><strong>Seedance Prompt Studio</strong><small>Creative workspace · V1.0</small></div></div><span className="pill">PROMPT BUILDER</span></header>
    <section className="hero"><div><div className="eyebrow">AI VIDEO PRE-PRODUCTION</div><h1>Ubah ide menjadi <em>prompt sinematik.</em></h1><p>Rancang adegan, karakter, kamera, dan dialog dalam satu workspace.</p></div><div className="heroMark"><Film size={42}/><span>STUDIO</span></div></section>
    <div className="layout">
      <section className="editor">
        <div className="sectionHead"><div><span className="step">01</span><h2>Pengaturan proyek</h2></div></div>
        <div className="fields two">
          <label>Nama proyek<input value={project} onChange={e=>setProject(e.target.value)}/></label>
          <label>Genre<select value={genre} onChange={e=>setGenre(e.target.value)}>{['Drama','Action','Sci-fi','Fantasy','Horror','Comedy','Documentary','Commercial'].map(x=><option>{x}</option>)}</select></label>
          <label>Gaya visual<select value={style} onChange={e=>setStyle(e.target.value)}>{['Cinematic realism','Anime','3D animation','Photorealistic','Stop motion','Noir','Dreamlike'].map(x=><option>{x}</option>)}</select></label>
          <label>Aspect ratio<select value={ratio} onChange={e=>setRatio(e.target.value)}>{['16:9','9:16','1:1','4:3','21:9'].map(x=><option>{x}</option>)}</select></label>
        </div>

        <div className="sectionHead"><div><span className="step">02</span><h2>Karakter & dialog</h2></div><button className="subtle" onClick={()=>setCharacters([...characters,blankCharacter()])}><Plus size={15}/> Tambah karakter</button></div>
        {characters.map((c,i)=><div className="panel" key={i}>
          <div className="panelTitle"><strong>{c.name || `Karakter ${i+1}`}</strong>{characters.length>1&&<button className="iconBtn" onClick={()=>setCharacters(characters.filter((_,n)=>n!==i))}><Trash2 size={15}/></button>}</div>
          <div className="fields two">
            <label>Nama karakter<input value={c.name} onChange={e=>updateCharacter(i,'name',e.target.value)}/></label>
            <label>Deskripsi penampilan<input value={c.look} placeholder="Ciri fisik, pakaian, aksesori..." onChange={e=>updateCharacter(i,'look',e.target.value)}/></label>
            <label className="photoUpload">Foto referensi karakter
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){alert('Gunakan foto JPG, PNG, atau WEBP.');e.target.value='';return;}if(file.size>8*1024*1024){alert('Ukuran foto maksimal 8 MB.');e.target.value='';return;}try{const dataUrl=await compressCharacterImage(file);updateCharacter(i,'photo',dataUrl);setAnalysisErrors(old=>({...old,[i]:''}));}catch(error){alert(error.message);e.target.value='';}}}/>
              <small>JPG, PNG, atau WEBP · Maksimal 8 MB</small>
              {c.photo&&<span className="photoPreview"><img src={c.photo} alt={`Referensi ${c.name}`}/><button type="button" className="iconBtn" onClick={()=>updateCharacter(i,'photo','')}>Hapus foto</button></span>}
              {c.photo&&<button type="button" className="analyzeBtn" disabled={analyzingIndex===i} onClick={()=>analyzeCharacter(i)}>{analyzingIndex===i?'Menganalisis foto...':'✦ Analisis Karakter'}</button>}
              {analysisErrors[i]&&<small className="analysisError">{analysisErrors[i]}</small>}
            </label>
            <label>Karakter suara<input value={c.voice} onChange={e=>updateCharacter(i,'voice',e.target.value)}/></label>
            <label>Bahasa<select value={c.language} onChange={e=>updateCharacter(i,'language',e.target.value)}>{['Bahasa Indonesia','English','日本語','한국어','中文','Español','Other'].map(x=><option>{x}</option>)}</select></label>
            <label>Aksen<input value={c.accent} onChange={e=>updateCharacter(i,'accent',e.target.value)}/></label>
            <label>Emosi<select value={c.emotion} onChange={e=>updateCharacter(i,'emotion',e.target.value)}>{['Tenang','Senang','Sedih','Marah','Takut','Terkejut','Gugup','Meyakinkan','Sarkastik'].map(x=><option>{x}</option>)}</select></label>
            <label>Gaya penyampaian<input value={c.delivery} onChange={e=>updateCharacter(i,'delivery',e.target.value)}/></label>
            <label>Kecepatan bicara<select value={c.pace} onChange={e=>updateCharacter(i,'pace',e.target.value)}>{['Lambat','Sedang','Cepat','Bervariasi'].map(x=><option>{x}</option>)}</select></label>
          </div>
          <label className="fullLabel">Dialog<textarea rows="2" value={c.dialogue} placeholder="Tulis kalimat yang diucapkan karakter..." onChange={e=>updateCharacter(i,'dialogue',e.target.value)}/></label>
          <div className="fields two timing"><label>Mulai (mm:ss)<input value={c.start} onChange={e=>updateCharacter(i,'start',e.target.value)}/></label><label>Selesai (mm:ss)<input value={c.end} onChange={e=>updateCharacter(i,'end',e.target.value)}/></label></div>
        </div>)}

        <div className="sectionHead"><div><span className="step">03</span><h2>Storyboard multi-scene</h2></div><button className="subtle" onClick={()=>setScenes([...scenes,blankScene()])}><Plus size={15}/> Tambah scene</button></div>
        {scenes.map((s,i)=><div className="panel" key={i}>
          <div className="panelTitle"><strong>Scene {i+1}</strong><button className="iconBtn" disabled={scenes.length===1} onClick={()=>setScenes(scenes.filter((_,n)=>n!==i))}><Trash2 size={15}/></button></div>
          <div className="fields two">
            <label>Judul scene<input value={s.title} onChange={e=>updateScene(i,'title',e.target.value)}/></label>
            <label>Durasi<select value={s.duration} onChange={e=>updateScene(i,'duration',e.target.value)}>{['3 detik','5 detik','8 detik','10 detik','15 detik'].map(x=><option>{x}</option>)}</select></label>
          </div>
          <label className="fullLabel">Visual / lokasi<textarea rows="2" value={s.visual} placeholder="Jelaskan lingkungan, pencahayaan, waktu..." onChange={e=>updateScene(i,'visual',e.target.value)}/></label>
          <label className="fullLabel">Aksi karakter<textarea rows="2" value={s.action} placeholder="Apa yang terjadi dalam scene ini?" onChange={e=>updateScene(i,'action',e.target.value)}/></label>
          <label className="fullLabel">Gerakan kamera<select value={s.camera} onChange={e=>updateScene(i,'camera',e.target.value)}>{['Static shot','Slow dolly in','Dolly out','Pan left','Pan right','Tilt up','Tilt down','Tracking shot','Handheld','Crane shot','Orbit shot','Close-up push-in'].map(x=><option>{x}</option>)}</select></label>
        </div>)}

        <div className="sectionHead"><div><span className="step">04</span><h2>Arahan visual & negative prompt</h2></div></div>
        <label className="fullLabel">Arahan visual tambahan<textarea rows="2" value={extra} onChange={e=>setExtra(e.target.value)}/></label>
        <label className="fullLabel">Negative prompt<textarea rows="2" value={negative} onChange={e=>setNegative(e.target.value)}/></label>
      </section>

      <aside className="preview">
        <div className="previewHead"><div><span className="eyebrow">LIVE OUTPUT</span><h2><WandSparkles size={18}/> Prompt hasil</h2></div><span className="live"><i/> LIVE</span></div>
        <div className="previewMeta"><span>{scenes.length} scene</span><span>{characters.length} karakter</span><span>{ratio}</span></div>
        <pre>{prompt}</pre>
        <button className="copyBtn" onClick={copyPrompt}><Copy size={17}/>{copied?'Prompt tersalin!':'Salin prompt lengkap'}</button>
        <div className="tip"><MessageSquareText size={17}/><p><strong>Catatan dialog</strong><br/>Prompt memberi arahan dialog dan lip-sync. Hasil suara dan sinkronisasi tetap bergantung pada kemampuan model video yang digunakan.</p></div>
      </aside>
    </div>
    <footer>SEEDANCE PROMPT STUDIO <span>Open-source starter · MIT License</span></footer>
  </main>
}
