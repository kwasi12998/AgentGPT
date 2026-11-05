const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{
const [out,wav,from,to]=[process.argv[2],process.argv[3],+process.argv[4]||0,+process.argv[5]||1065];
const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-c:v','mjpeg','-framerate','30','-i','-','-i',wav,'-t',String(35.5),'-c:v','libx264','-preset','medium','-crf','21','-maxrate','9M','-bufsize','18M','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',out],{stdio:['pipe','inherit','inherit']});
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1920,height:1080}});
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:8765/reel.html?render=1');await pg.waitForFunction('window.__ready');
const t0=Date.now();
for(let f=from;f<to;f++){const d=await pg.evaluate(t=>renderAt(t),f/30);const buf=Buffer.from(d,'base64');if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));
 if(f%60===0)console.log('frame',f,((Date.now()-t0)/1000).toFixed(0)+'s')}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await br.close();console.log('DONE',(Date.now()-t0)/1000)})();
