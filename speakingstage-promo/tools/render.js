const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const [out,from,to]=[process.argv[2],+process.argv[3],+process.argv[4]];
const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-c:v','mjpeg','-framerate','30','-i','-','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
const br=await chromium.launch();const pg=await br.newPage({viewport:{width:1920,height:1080}});
pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('http://localhost:8766/promo.html?render=1');await pg.waitForFunction('window.__ready',null,{timeout:60000});
const t0=Date.now();
for(let f=from;f<to;f++){await pg.evaluate(t=>renderAt(t),f/30);const buf=await pg.screenshot({type:'jpeg',quality:93});if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));
 if(f%150===0)console.log(out.slice(-12),'frame',f,((Date.now()-t0)/1000).toFixed(0)+'s')}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await br.close();console.log('DONE',out,(Date.now()-t0)/1000)})();
