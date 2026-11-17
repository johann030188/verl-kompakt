"""Incremental, local DE→EN→RU translation. No text is sent to a translation service.

Models are public Argos packages; only CTranslate2 model data and SentencePiece
tokenizers are read, never pickle/Python model code. Reviewed text wins over MT.
"""
import argparse, collections, datetime, hashlib, json, os, pathlib, re, sys, tempfile, urllib.request, zipfile

MODELS = [
    ('translate-de_en-1_3', 'becc2b0011f8249fcb89be9ecb75ba0d876b1fab93c28ee6ff0420936897d637'),
    ('translate-en_ru-1_9', '591d743ae103752b88ffc38785c50421320f4eff93c8967e0d3d2e14d4e27811'),
]
TEXT_KEYS = {'title','summary','paragraphs','imageCaption','category','credit','label','day','weekday','note','notice','bookingNotice','membershipInfo','seasonLabel','programLabel','scheduleNotice','ageLabel','feeLabel','period','description','sport','name','location','source','type','notes','audience','assessment','caution'}
SKIP_KEYS = {'streets','stops','urls','team','home','away','teamURL','address','stationName','direction','provider','place','organizer'}
NAMES = {'Verl kompakt','Stadt Verl','TV Verl','SC Verl','Sportclub Verl','Droste-Haus','Radio Gütersloh','Schulministerium NRW','Polizei Gütersloh / Presseportal'}
def clean(s): return re.sub(r'\s+', ' ', str(s)).strip()
def load(path, default=None):
    try: return json.loads(path.read_text(encoding='utf-8'))
    except FileNotFoundError: return default
def collect(value, result, key='', parents=()):
    if key in SKIP_KEYS: return
    if isinstance(value, dict):
        for k,v in value.items(): collect(v, result, k, parents+(key,))
    elif isinstance(value,list):
        for v in value: collect(v,result,key,parents)
    elif isinstance(value,str) and key in TEXT_KEYS:
        s=clean(value)
        if len(s)>1 and re.search(r'[A-Za-zÄÖÜäöüß]',s) and not re.search(r'https?://|@|\[object Object\]',s) and s not in NAMES: result.add(s)
def prepare_models(root):
    root.mkdir(parents=True,exist_ok=True)
    for name, digest in MODELS:
        target=root/name
        if (target/'model/model.bin').exists() and (target/'sentencepiece.model').exists(): continue
        archive=root/(name+'.argosmodel')
        if not archive.exists():
            req=urllib.request.Request('https://data.argosopentech.com/argospm/v1/'+name+'.argosmodel',headers={'User-Agent':'VerlKompakt translation setup'})
            with urllib.request.urlopen(req,timeout=90) as response, archive.open('wb') as output:
                while chunk:=response.read(1024*1024): output.write(chunk)
        if hashlib.sha256(archive.read_bytes()).hexdigest()!=digest:
            archive.unlink(missing_ok=True); raise ValueError('Translation model checksum mismatch: '+name)
        with zipfile.ZipFile(archive) as z:
            for member in z.infolist():
                # Extract only inert inference files; skip Stanza .pt / pickle models.
                if member.filename.startswith(name+'/model/') or member.filename==name+'/sentencepiece.model':
                    if '..' in pathlib.PurePosixPath(member.filename).parts: raise ValueError('Unsafe model path')
                    z.extract(member,root)
        archive.unlink(missing_ok=True)
def pieces(text, limit=240):
    sentences=re.split(r'(?<=[.!?;])\s+(?=[A-ZÄÖÜ0-9„«(])',text)
    out=[]
    for s in sentences:
        while len(s)>limit:
            pos=s.rfind(' ',0,limit)
            if pos<limit//3: pos=limit
            out.append(s[:pos]);s=s[pos:].lstrip()
        if s:out.append(s)
    return out
def protect_numbers(text):
    originals=[]
    def sub(m):
        i=len(originals);originals.append(m.group(0));letters=''
        while True:
            letters=chr(65+i%26)+letters;i=i//26-1
            if i<0:break
        return ' __NUM_'+letters+'__ '
    return re.sub(r'\d+(?:[.,:/–-]\d+)*',sub,text),originals
def restore_numbers(text,originals):
    result=text
    for i,value in enumerate(originals):
        n=i;letters=''
        while True:
            letters=chr(65+n%26)+letters;n=n//26-1
            if n<0:break
        marker='__NUM_'+letters+'__'
        if result.count(marker)!=1:raise ValueError('Number placeholder changed during translation: '+repr(text)+' expected '+marker)
        result=result.replace(marker,value)
    if '__NUM_' in result:raise ValueError('Unexpected number placeholder')
    return result
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default='.');ap.add_argument('--check',action='store_true');ap.add_argument('--model-dir',default=os.environ.get('VERL_TRANSLATION_MODELS',str(pathlib.Path.home()/'.cache/verl-translation-models')));a=ap.parse_args();root=pathlib.Path(a.root)
    reviewed=load(root/'ui-ru.json',{});old=load(root/'russian.json',{}); translations=dict(old.get('translations',{}));translations.update(reviewed)
    wanted=set();
    for file in ['live.json','articles.json','droste-program.json','opening-hours.json','event-tips.json']:
        value=load(root/file,{});collect(value,wanted)
    wanted.update(clean(s) for s in load(root/'translation-ui-strings.json',[]) if clean(s) and not re.search(r'Johann|hotmail|Diana|Lina',s,re.I))
    missing=sorted(s for s in wanted if s not in translations)
    if a.check:
        changed=any(old.get('translations',{}).get(k)!=v for k,v in reviewed.items())
        needed=bool(missing or changed)
        print(json.dumps({'missing':len(missing),'cached':len(translations),'needed':needed},ensure_ascii=False))
        if os.environ.get('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('needed='+str(needed).lower()+'\n')
        return
    errors=[]
    if missing:
        prepare_models(pathlib.Path(a.model_dir))
        import ctranslate2
        import sentencepiece
        engines=[]
        for name,_ in MODELS:
            p=pathlib.Path(a.model_dir)/name
            engines.append((sentencepiece.SentencePieceProcessor(model_file=str(p/'sentencepiece.model')),ctranslate2.Translator(str(p/'model'),device='cpu',compute_type='int8',inter_threads=1,intra_threads=min(4,os.cpu_count() or 2))))
        def infer(values):
            for tokenizer,engine in engines:
                tokens=[tokenizer.encode(v,out_type=str) for v in values]
                if any(len(v)>480 for v in tokens):raise ValueError('Translation input exceeded safe token length')
                output=engine.translate_batch(tokens,beam_size=4,max_decoding_length=512,max_input_length=512)
                values=[tokenizer.decode(v.hypotheses[0]) for v in output]
            return values
        entries=[(s,pieces(s)) for s in missing]
        for start in range(0,len(entries),24):
            batch=entries[start:start+24];chunks=[chunk for _,parts in batch for chunk in parts];protected=[protect_numbers(c) for c in chunks];values=[p[0] for p in protected]
            values=infer(values)
            for i,(value,protected_item) in enumerate(zip(values,protected)):
                try:values[i]=clean(restore_numbers(value,protected_item[1]))
                except ValueError:
                    # If a model altered a placeholder, keep every numeric value
                    # verbatim and translate only the surrounding text segments.
                    split=re.split(r'(\d+(?:[.,:/–-]\d+)*)',chunks[i]);plain=[x for j,x in enumerate(split) if j%2==0 and x.strip()];translated=iter(infer(plain))
                    values[i]=clean(' '.join(next(translated) if j%2==0 and x.strip() else x for j,x in enumerate(split)))
            offset=0
            for source,parts in batch:
                result=' '.join(values[offset:offset+len(parts)]);offset+=len(parts)
                # Never accept a blank/error response as a translation.
                if not result.strip(): errors.append(source);continue
                translations[source]=result
            print(json.dumps({'translated':min(start+24,len(entries)),'total':len(entries)}),flush=True)
    # A failed refresh never removes a previous translation. Keep MT status explicit.
    result={'version':1,'source':'de','target':'ru','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat().replace('+00:00','Z'),'engine':'Argos / CTranslate2 (de-en, en-ru), reviewed overrides','reviewedCount':len(reviewed),'translations':translations,'pending':errors,'contentHash':hashlib.sha256('\n'.join(sorted(wanted)).encode()).hexdigest()}
    target=root/'russian.json';temp=target.with_suffix('.json.tmp');temp.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8');temp.replace(target)
    print(json.dumps({'entries':len(translations),'missing':len(errors),'target':str(target)},ensure_ascii=False))
    if errors:raise RuntimeError('Some Russian translations could not be generated')
if __name__=='__main__':main()

