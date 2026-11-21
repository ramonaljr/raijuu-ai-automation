import { useId } from 'react';

// Decorative motion studies: no simulated customer data or product screenshots.
export default function SystemGraphic({ variant = 'network' }: { variant?: 'network' | 'knowledge' | 'response' | 'process' | 'orbit' }) {
  const id = useId().replace(/:/g, '');
  return <svg className={`system-graphic graphic-${variant}`} viewBox="0 0 600 350" fill="none" aria-hidden="true">
    <defs><radialGradient id={`${id}-glow`}><stop stopColor="#c2a468" stopOpacity=".3" /><stop offset="1" stopColor="#c2a468" stopOpacity="0" /></radialGradient><pattern id={`${id}-grid`} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" stroke="#c2a468" strokeOpacity=".08" /></pattern></defs>
    <path fill={`url(#${id}-grid)`} d="M0 0h600v350H0z" />
    <ellipse cx="300" cy="175" rx="220" ry="170" fill={`url(#${id}-glow)`} />
    {variant === 'network' || variant === 'process' ? <>
      <path className="graphic-track" d="M60 80H170Q200 80 200 110V145Q200 175 230 175H370Q400 175 400 145V110Q400 80 430 80H540M60 270H170Q200 270 200 240V205Q200 175 230 175M370 175Q400 175 400 205V240Q400 270 430 270H540M60 175H540" />
      <path className="graphic-signal" d="M60 80H170Q200 80 200 110V145Q200 175 230 175H370Q400 175 400 205V240Q400 270 430 270H540" />
      <path className="graphic-signal signal-second" d="M60 270H170Q200 270 200 240V205Q200 175 230 175H370Q400 175 400 145V110Q400 80 430 80H540" />
      {[80,175,270].map((y,i)=><g key={y}><rect x="44" y={y-19} width="38" height="38" rx="7" className="graphic-terminal"/><path d={`M54 ${y}h18M63 ${y-9}v18`} stroke="#c2a468" strokeOpacity=".7"/><rect x="518" y={y-19} width="38" height="38" rx="7" className="graphic-terminal"/><circle cx="537" cy={y} r={i===1?7:4} fill="#c2a468" fillOpacity=".7"/></g>)}
      <g className="graphic-core"><path d="m300 111 56 32v64l-56 32-56-32v-64l56-32Z" fill="#1b140e" stroke="#c2a468"/><path d="m300 128 41 24v46l-41 24-41-24v-46l41-24Z" stroke="#c2a468" strokeOpacity=".3"/><circle cx="300" cy="175" r="20" stroke="#fbf8ee" strokeOpacity=".6"/><circle cx="300" cy="175" r="5" fill="#fbf8ee"/></g>
      <circle className="graphic-pulse" cx="300" cy="175" r="83" stroke="#c2a468" strokeOpacity=".2" strokeDasharray="2 8" />
    </> : variant === 'knowledge' ? <>
      {[0,1,2].map(i=><g key={i} transform={`translate(${90+i*20} ${70+i*26})`}><rect width="122" height="156" rx="3" fill="#22180f" stroke="#c2a468" strokeOpacity={.2+i*.2}/><path d="M22 35h76M22 53h76M22 71h56M22 104h76M22 122h48" stroke="#c2a468" strokeOpacity=".4"/></g>)}
      <path className="graphic-track" d="M252 175H355M440 175H545M397 95V45M397 255V305"/><path className="graphic-signal" d="M252 175H355M440 175H545"/>
      <g className="graphic-orbit"><ellipse cx="397" cy="175" rx="77" ry="77" stroke="#c2a468" strokeOpacity=".5"/><ellipse cx="397" cy="175" rx="77" ry="28" stroke="#c2a468" strokeOpacity=".5"/><ellipse cx="397" cy="175" rx="28" ry="77" stroke="#c2a468" strokeOpacity=".5"/><circle cx="397" cy="98" r="5" fill="#c2a468"/></g>
      <circle className="graphic-pulse" cx="397" cy="175" r="105" stroke="#c2a468" strokeOpacity=".15" strokeDasharray="2 8"/><path d="m382 175 10 10 22-24" stroke="#fbf8ee" strokeWidth="2"/>
    </> : <>
      <g className="graphic-orbit"><ellipse cx="300" cy="175" rx="200" ry="75" stroke="#c2a468" strokeOpacity=".35" transform="rotate(-25 300 175)"/><ellipse cx="300" cy="175" rx="200" ry="75" stroke="#c2a468" strokeOpacity=".35" transform="rotate(25 300 175)"/><circle cx="300" cy="175" r="125" stroke="#c2a468" strokeOpacity=".2" strokeDasharray="3 10"/><circle cx="110" cy="175" r="6" fill="#c2a468"/><circle cx="490" cy="175" r="6" fill="#c2a468"/></g>
      <circle cx="300" cy="175" r="63" fill="#1b140e" stroke="#c2a468" strokeOpacity=".7"/><circle className="graphic-pulse" cx="300" cy="175" r="80" stroke="#c2a468" strokeOpacity=".3"/>
      {variant==='response'?<><path d="M272 153h56v33h-27l-14 12v-12h-15v-33Z" stroke="#c2a468"/>{[285,300,315].map((x,i)=><circle className={`message-dot dot-${i}`} key={x} cx={x} cy="169" r="3" fill="#c2a468"/>)}</>:<path d="M286 157c0-21 32-21 32-1 0 12-17 12-17 25m0 13v2" stroke="#c2a468" strokeWidth="3"/>}
    </>}
    <path d="M15 35V15h20M565 15h20v20M15 315v20h20M565 335h20v-20" stroke="#c2a468" strokeOpacity=".5" />
  </svg>;
}
