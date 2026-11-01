from pathlib import Path
import subprocess,json
p=Path(__file__).resolve().parent.parent
shots=[('01-nave',5),('02-modulos',5),('03-mundos',5),('04-expedicao',6),('05-mercado',5),('06-historia',5)]
def run(a): subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y']+a,check=True)
for name,secs in shots:
 raw=p/'footage'/f'{name}.webm'
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(raw)]))
 run(['-loop','1','-i',str(p/'source'/f'{name}-background.png'),'-ss',str(max(0,duration-secs-.05)),'-i',str(raw),'-filter_complex_threads','1','-filter_complex','[1:v]crop=360:640:0:0,scale=940:1670:flags=lanczos,fps=30[v];[0:v][v]overlay=70:220:shortest=1,format=yuv420p[out]','-map','[out]','-t',str(secs),'-r','30','-c:v','libx264','-preset','fast','-crf','19','-threads','2',str(p/'source'/f'{name}.mp4')])
 print(name,'rendered',flush=True)
args=[]
for name,_ in shots:args+=['-i',str(p/'source'/f'{name}.mp4')]
args+=['-i',str(p/'source'/'trilha-original.wav')]
filters=[]
for i,offset in enumerate([4.8,9.6,14.4,20.2,25.0]):
 prev='0:v' if i==0 else 'x'+str(i)
 filters.append(f'[{prev}][{i+1}:v]xfade=transition=fade:duration=0.2:offset={offset}[x{i+1}]')
filters.append('[6:a]loudnorm=I=-18:TP=-1.5:LRA=9[a]')
run(args+['-filter_complex_threads','1','-filter_complex',';'.join(filters),'-map','[x5]','-map','[a]','-t','30','-r','30','-c:v','libx264','-preset','fast','-crf','20','-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(p/'orbita-teaser-30s-1080x1920.mp4')])
print('Video complete',flush=True)
