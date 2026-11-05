import numpy as np, wave, sys
SR=44100; BPM=120; B=60/BPM; NB=68; DUR=35.5
N=int(DUR*SR)
L=np.zeros(N); Rr=np.zeros(N)
rng=np.random.default_rng(7)
def tarr(d): return np.arange(int(d*SR))/SR
def put(sig,t0,pan=0.0,gain=1.0,bus=None):
    i=int(t0*SR)
    if i>=N: return
    s=sig[:N-i]
    l=gain*(1-max(0,pan)); r=gain*(1+min(0,pan))
    (bus if bus is not None else (L,Rr))[0][i:i+len(s)]+=s*l
    (bus if bus is not None else (L,Rr))[1][i:i+len(s)]+=s*r
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/SR); k=(1-a)*a**np.arange(int(8/(1-a)) if a<0.9999 else 2000)
    return np.convolve(x,k[:4000])[:len(x)]
def hp(x,fc): return x-lp(x,fc)
def kick(v=1):
    t=tarr(.45); f=45+120*np.exp(-t/0.035); ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*np.exp(-t/0.16)+0.35*np.sin(2*ph)*np.exp(-t/0.03)
    s[:60]+=np.linspace(0.6,0,60)
    return np.tanh(1.6*s)*v
def clap(v=1):
    t=tarr(.3); n=rng.standard_normal(len(t))
    env=np.exp(-t/0.09)+0.9*np.exp(-((t-0.012)%0.012)/0.004)*(t<0.04)
    return hp(lp(n,6500),900)*env*0.9*v
def hat(v=1,open_=False):
    t=tarr(.25 if open_ else .06); n=rng.standard_normal(len(t))
    return hp(n,7000)*np.exp(-t/(0.09 if open_ else 0.015))*0.5*v
def pluck(f,d=.35,v=1):
    t=tarr(d); s=sum(np.sin(2*np.pi*f*k*t)/k for k in (1,2,3,4,5))
    return lp(s,f*5)*np.exp(-t/0.12)*0.25*v
def bass(f,d=.45,v=1):
    t=tarr(d); s=sum(np.sin(2*np.pi*f*k*t+0.0)/k for k in range(1,9))
    s=lp(s,320+900*0)+np.sin(2*np.pi*f*t)*0.8
    return np.tanh(s*0.8)*np.minimum(1,t/0.005)*np.exp(-t/0.28)*v*0.7
def pad(freqs,d,v=1):
    t=tarr(d); s=0
    for f in freqs:
        for det in (-0.004,0,0.004):
            s=s+np.sin(2*np.pi*f*(1+det)*t+rng.random()*6)+0.4*np.sin(4*np.pi*f*(1+det)*t)
    a=np.minimum(1,t/0.4)*np.minimum(1,(d-t)/0.4)
    return lp(s,1800)*a*0.05*v
def riser(d,v=1):
    t=tarr(d); n=rng.standard_normal(len(t)); f=300+9000*(t/d)**2
    # swept noise via moving average windows ~ crude: modulate hp of noise
    s=hp(n,1500)*(t/d)**2.2
    sine=np.sin(2*np.pi*np.cumsum(200+1600*(t/d)**2)/SR)*(t/d)**2*0.3
    return (s*0.5+sine)*v*0.6
def downlift(d,v=1):
    t=tarr(d); n=rng.standard_normal(len(t)); return hp(n,2000)*np.exp(-t/(d*0.35))*0.5*v
def impact(v=1):
    t=tarr(2.2); n=rng.standard_normal(len(t))
    s=lp(n,2500)*np.exp(-t/0.5)*0.5+np.sin(2*np.pi*np.cumsum(70*np.exp(-t/0.4)+35)/SR)*np.exp(-t/0.9)
    return np.tanh(s*1.3)*v
def swoosh(d=.5,v=1):
    t=tarr(d); n=rng.standard_normal(len(t)); env=np.sin(np.pi*t/d)**2
    return hp(lp(n,5000),700)*env*0.5*v
def tick(v=1):
    t=tarr(.05); return np.sin(2*np.pi*1900*t)*np.exp(-t/0.01)*0.3*v

chords=[([220,261.63,329.63],55,[0,2,4]),([174.61,220,261.63],43.65,[0,2,4]),([261.63,329.63,392],65.41,[0,2,4]),([196,246.94,293.66],49,[0,2,4])]
dry=(np.zeros(N),np.zeros(N)); wet=(np.zeros(N),np.zeros(N)); side=np.ones(N)
def sc(t0,depth=.75):
    i=int(t0*SR); n=int(.22*SR); t=np.arange(min(n,N-i))/SR
    side[i:i+len(t)]*=1-depth*np.exp(-t/0.09)
kicks=[]
def K(b,v=1): kicks.append(b); put(kick(v),b*B,gain=.95)
sections=lambda b:('words' if b<4 else 'intro' if b<12 else 'about' if b<20 else 'themes' if b<36 else 'stage' if b<44 else 'awards' if b<50 else 'break' if b<56 else 'outro' if b<68 else 'tail')
pb=(np.zeros(N),np.zeros(N))  # music bus ducked
for b in range(0,68):
    s=sections(b); t=b*B
    bar=(b//4)%4; ch=chords[bar]
    if s=='words':
        K(b,1.0); put(clap(.9),t+0.0,gain=.7) if b>=1 else None
        put(impact(.5),t,gain=.5) if b==0 else None
        put(pluck(110*[1,1.19,1.33,1.5][b%4]*2,.3),t+B*.5,gain=.5)
        put(hat(.8),t+B*.5,gain=.5)
        put(swoosh(.25),t-.2 if t>0.2 else 0,gain=.4)
    elif s=='break':
        if b%2==0: put(tick(),t,gain=.5)
        put(hat(.6),t+B*.5,gain=.35)
    elif s in ('tail',): pass
    else:
        if s=='awards' and b%4==3: pass
        else: K(b)
        sc(t)
        if b%2==1: put(clap(),t,gain=.8 if s!='outro' else .9)
        put(hat(.9),t+B*.5,gain=.7)
        if s in('themes','stage','outro'):
            for q in (0.25,0.75): put(hat(.5),t+B*q,gain=.45)
        if s in ('themes','stage','awards','outro') and b%4==0: put(hat(1,True),t+B*.5,gain=.5)
        if b%4==0 and b>4: put(swoosh(.6),t-.45,gain=.5)
    # bass 8ths
    if s in ('intro','about','themes','stage','awards','outro'):
        root=ch[1]
        for q in range(2):
            o=1 if q==1 and b%2==1 else 1
            f=root*(2 if (q==1 and (b%4 in(1,3))) else 1)
            put(bass(f,.4),t+q*B*.5+0.0,gain=.9,bus=pb)
    # pad
    if b%4==0 and s not in('words','tail') or b==68:
        put(pad(ch[0],4*B+.5,1.0),t,gain=.9,bus=pb)
    if s=='break' and b==58-0: pass
    # arp 16ths
    if s in('intro','about','themes','stage','awards','break','outro'):
        notes=[f*2 for f in ch[0]]; pat=[0,1,2,1,2,1,0,2] if s!='break' else [0,2,1,2]
        for q in range(4):
            idx=pat[(b*4+q)%len(pat)]
            vel=.6 if s in('about','break') else .8
            put(pluck(notes[idx%3]*(2 if q%2 else 1),.3,vel),t+q*B*.25,pan=(-.4 if q%2 else .4),gain=.55,bus=wet if s=='break' else pb)
# lead during stage + outro: simple melody
mel=[(36,0,659.25),(36.5,0,587.33),(37,0,523.25),(38,0,587.33),(38.5,0,659.25),(39,0,783.99),(40,0,880),(41,0,783.99),(41.5,0,659.25),(42,0,587.33),(43,0,659.25),(60,0,880),(61,0,783.99),(62,0,659.25),(63,0,783.99),(64,0,880),(65,0,1046.5),(66,0,880),(67,0,1318.5)]
for b,_,f in mel: put(pluck(f,.6,1),b*B,pan=.2,gain=.5,bus=wet)
# risers / impacts
for b0,d in [(2.0,2.0),(10.0,2.0),(18.0,2.0),(34,2.0),(42,2.0),(54,2.0),(62.4,2.0)]: put(riser(d*B),b0*B,gain=.6)
for b in (4,12,20,24,28,32,36,44,50,56,60,64.4,68): put(impact(.8 if b in(4,20,60,64.4) else .45),b*B,gain=.7)
for b in (4,12,20,36,44,56,60,64.4): put(downlift(1.2),b*B,gain=.4)
# award hits / quote ticks
for b in (44,46,48,50,52): put(tick(1),b*B,gain=.4)
# mix
for ch_i,(bus,out) in enumerate(zip(pb,(L,Rr))): out+=bus*side
for ch_i,(bus,out) in enumerate(zip(wet,(L,Rr))): out+=bus*0.6
# ping-pong delay + reverb on wet bus
def conv(x,ir):
    n=len(x)+len(ir); return np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(ir,n),n)[:len(x)]
t=tarr(1.8); ir=rng.standard_normal(len(t))*np.exp(-t/0.45); ir=lp(ir,6000)
mix=(L+Rr)/2
rev=conv(mix*0.0+ (wet[0]+wet[1])*0.5 + 0.12*(L+Rr)/2, ir)
L+=rev*0.12; Rr+=np.roll(rev,int(0.013*SR))*0.12
for x in (L,Rr):
    x[:]=np.tanh(x*0.9)
m=max(abs(L).max(),abs(Rr).max()); L/=m;Rr/=m
fade=np.ones(N); i=int((DUR-1.4)*SR); fade[i:]=np.linspace(1,0,N-i); fade[:200]=np.linspace(0,1,200)
L*=fade*.89; Rr*=fade*.89
st=(np.stack([L,Rr],1)*32767).astype('<i2')
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok',DUR)
