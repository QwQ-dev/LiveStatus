import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLanguage, LanguageProvider } from './contexts/LanguageContext';
import { Sparkles, Monitor, Globe } from 'lucide-react';
import { FadeText } from './components/FadeText';

interface StatusData {
  app_name: string;
  title: string;
  os_name?: string;
  force_status_type?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'star' | 'heart' | 'sparkle' | 'dot';
}

type StatusType = 'online' | 'offline' | 'wayland_limited' | 'unknown';

const getStatusType = (data: StatusData | null, isConnected: boolean): StatusType => {
  if (!isConnected || !data) return 'offline';

  const appName = data.app_name?.toLowerCase() || '';
  const title = data.title?.toLowerCase() || '';

  if (appName === 'offline' || title.includes('offline')) {
    return 'offline';
  }

  if ((appName === 'n/a' && title === 'n/a') ||
      (appName === 'n/a' && !title) ||
      (!appName && title === 'n/a')) {
    return 'wayland_limited';
  }

  if (!appName || appName === 'unknown') {
    return 'unknown';
  }

  return 'online';
};

const getActivityType = (appName: string, title: string, osName: string = ''): string => {
  const combined = `${appName} ${title}`.toLowerCase();

  if (appName === 'Screen Off') return 'screen_off';

  if (combined.includes('code') || combined.includes('vscode') || combined.includes('idea') ||
      combined.includes('vim') || combined.includes('neovim') || combined.includes('sublime') ||
      combined.includes('jetbrains') || combined.includes('intellij') || combined.includes('webstorm') ||
      combined.includes('pycharm') || combined.includes('terminal') || combined.includes('iterm') ||
      combined.includes('cursor') || combined.includes('zed') || combined.includes('rustrover') ||
      combined.includes('clion') || combined.includes('goland') || combined.includes('rider')) {
    return 'coding';
  }

  if (combined.includes('discord') || combined.includes('qq') || combined.includes('wechat') ||
      combined.includes('weixin') || combined.includes('telegram') || combined.includes('whatsapp') ||
      combined.includes('slack') || combined.includes('dingtalk') || combined.includes('lark') ||
      combined.includes('feishu') || combined.includes('element') || combined.includes('thunderbird')) {
    return 'social';
  }

  if (combined.includes('全民k歌') || combined.includes('wesing') || combined.includes('karaoke') ||
      combined.includes('changba') || combined.includes('sing')) {
    return 'karaoke';
  }

  if (combined.includes('bilibili') || combined.includes('哔哩哔哩') || combined.includes('danmaku')) {
    return 'bilibili';
  }

  if (combined.includes('spotify') || combined.includes('music') || combined.includes('netease') ||
      combined.includes('qqmusic') || combined.includes('apple music') || combined.includes('youtube music')) {
    return 'music';
  }
  if (combined.includes('game') || combined.includes('minecraft') || combined.includes('steam') ||
      combined.includes('discord') || combined.includes('league') || combined.includes('valorant') ||
      combined.includes('genshin') || combined.includes('原神')) {
    return 'gaming';
  }
  if (combined.includes('chrome') || combined.includes('firefox') || combined.includes('safari') ||
      combined.includes('edge') || combined.includes('browser') || combined.includes('arc') ||
      combined.includes('zen')) {
    return 'browsing';
  }
  if (combined.includes('sleep') || combined.includes('idle') || combined.includes('away') ||
      combined.includes('lock') || combined.includes('screen saver')) {
    return 'idle';
  }

  if (osName.toLowerCase().includes('android')) return 'android';
  if (osName.toLowerCase().includes('windows')) return 'windows';
  if (osName.toLowerCase().includes('mac') || osName.toLowerCase().includes('darwin')) return 'macos';
  
  return 'working';
};

const getActivityContent = (activity: string, _lang: 'en' | 'zh') => {
  const content: Record<string, { emoji: string; verb: { en: string; zh: string }; color: string; bgGlow: string }> = {
    coding: {
      emoji: '💻',
      verb: { en: 'Crafting Code', zh: '编织代码中' },
      color: 'from-teal-400 to-cyan-300',
      bgGlow: 'bg-teal-500/15'
    },
    music: {
      emoji: '🎵',
      verb: { en: 'Vibing to Music', zh: '沉浸音乐中' },
      color: 'from-fuchsia-400 to-pink-300',
      bgGlow: 'bg-fuchsia-500/15'
    },
    gaming: {
      emoji: '🎮',
      verb: { en: 'In Gaming Mode', zh: '游戏时间' },
      color: 'from-rose-400 to-orange-300',
      bgGlow: 'bg-rose-500/15'
    },
    bilibili: {
      emoji: '📺',
      verb: { en: 'Watching Bilibili', zh: '刷 B 站中' },
      color: 'from-pink-400 to-sky-400',
      bgGlow: 'bg-pink-500/15'
    },
    social: {
      emoji: '💬',
      verb: { en: 'Socializing', zh: '正在社交中' },
      color: 'from-indigo-400 to-cyan-400',
      bgGlow: 'bg-indigo-500/15'
    },
    karaoke: {
      emoji: '🎤',
      verb: { en: 'Singing Karaoke', zh: '全民 K 歌中' },
      color: 'from-rose-500 to-violet-600',
      bgGlow: 'bg-rose-500/15'
    },
    browsing: {
      emoji: '🌐',
      verb: { en: 'Exploring the Web', zh: '探索互联网' },
      color: 'from-blue-400 to-indigo-300',
      bgGlow: 'bg-blue-500/15'
    },
    idle: {
      emoji: '💤',
      verb: { en: 'Taking a Break', zh: '休息中' },
      color: 'from-purple-300 to-slate-400',
      bgGlow: 'bg-purple-400/10'
    },
    working: {
      emoji: '⚡',
      verb: { en: 'Doing Something', zh: '忙碌中' },
      color: 'from-violet-400 to-fuchsia-400',
      bgGlow: 'bg-violet-500/15'
    },
    wayland: {
      emoji: '🐧',
      verb: { en: 'Active on Linux', zh: '活跃在 Linux 上' },
      color: 'from-amber-400 to-orange-300',
      bgGlow: 'bg-amber-500/15'
    },
    windows: {
      emoji: '🪟',
      verb: { en: 'Active on Windows', zh: '活跃在 Windows 上' },
      color: 'from-sky-400 to-blue-300',
      bgGlow: 'bg-sky-500/15'
    },
    macos: {
      emoji: '🍎',
      verb: { en: 'Active on macOS', zh: '活跃在 macOS 上' },
      color: 'from-slate-300 to-blue-200',
      bgGlow: 'bg-blue-400/15'
    },
    android: {
      emoji: '🤖',
      verb: { en: 'Active on Android', zh: '活跃在 Android 上' },
      color: 'from-emerald-400 to-green-300',
      bgGlow: 'bg-emerald-500/15'
    },
    screen_off: {
      emoji: '🌙',
      verb: { en: 'Screen Off', zh: '屏幕已关闭' },
      color: 'from-slate-500 to-zinc-400',
      bgGlow: 'bg-slate-500/10'
    }
  };
  return content[activity] || content.working;
};

const generateParticles = (count: number): Particle[] => {
  const types: Particle['type'][] = ['star', 'heart', 'sparkle', 'dot'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
    type: types[Math.floor(Math.random() * types.length)] || 'dot'
  }));
};

const ParticleField = ({ particles }: { particles: Particle[] }) => {
  const renderParticle = (particle: Particle) => {
    const baseClass = "absolute opacity-40";
    const style = {
      left: `${particle.x}%`,
      top: `${particle.y}%`,
      animationDuration: `${particle.duration}s`,
      animationDelay: `${particle.delay}s`,
    };

    switch (particle.type) {
      case 'star':
        return (
          <div key={particle.id} className={`${baseClass} text-yellow-300 animate-pulse`} style={style}>
            ✦
          </div>
        );
      case 'heart':
        return (
          <div key={particle.id} className={`${baseClass} text-pink-400 animate-float`} style={style}>
            ♥
          </div>
        );
      case 'sparkle':
        return (
          <Sparkles
            key={particle.id}
            className={`${baseClass} text-primary animate-spin-slow`}
            style={{ ...style, width: particle.size, height: particle.size }}
          />
        );
      case 'dot':
        return (
          <div
            key={particle.id}
            className={`${baseClass} rounded-full bg-white animate-pulse`}
            style={{ ...style, width: particle.size / 2, height: particle.size / 2 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(renderParticle)}
    </div>
  );
};

const DetectionLimitNotice = ({ language, osName: _osName, displayedActivity }: { language: 'en' | 'zh'; osName?: string; displayedActivity: string }) => {
  return (
    <div className="flex flex-col items-center gap-2 text-white/40">
      <div className="flex items-center gap-2 border-b border-white/5 pb-1">
        <Monitor className="w-3 h-3 md:w-4 md:h-4" />
        <span className="text-xs md:text-sm font-light tracking-widest uppercase">
          {language === 'zh' ? '隐私模式' : 'PRIVACY MODE'}
        </span>
      </div>
      <span className="text-[10px] md:text-xs font-mono opacity-70">
        {displayedActivity === 'wayland'
          ? (language === 'zh' ? 'Wayland 安全限制 · 无法获取应用' : 'Wayland Security Limit · App Hidden')
          : (language === 'zh' ? '系统隐私设置 · 无法获取应用' : 'System Privacy Settings · App Hidden')
        }
      </span>
      {displayedActivity === 'wayland' && (
        <span className="text-[9px] italic opacity-30 mt-1">i use arch btw</span>
      )}
    </div>
  );
};

const ConnectionStatus = ({ isOnline, lastUpdate, language }: { isOnline: boolean; lastUpdate: Date | null; language: 'en' | 'zh' }) => {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
       <div className="pt-1">
          <span className={`block w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-400'} transition-colors duration-500`} />
       </div>
       
       <div className="flex flex-col gap-1">
          <span className="text-xs font-bold tracking-widest uppercase text-white/40 leading-none">
            {language === 'zh' ? '此刻' : 'RIGHT NOW'}
          </span>
          <span className="text-[10px] text-white/20 font-mono leading-none">
            {lastUpdate ? lastUpdate.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour12: false }) : '--:--:--'}
          </span>
       </div>
    </div>
  );
};

const KAOMOJI = {
  coding: [
    "(づ￣ ³￣)づ", "༼つ ◕_◕ ༽つ", "(ง •_•)ง", "( ˘▽˘)っ♨",
    "(｡･ω･｡)", "( ´_ゝ`)旦", "【≡≡】ᕕ( ᐛ )ᕗ", "(ᵔᴥᵔ)",
    "ʕ•ᴥ•ʔ", "( ͡° ͜ʖ ͡°)", "(☞ﾟヮﾟ)☞", "(•_•)",
    "(╯°□°)╯︵ ┻━┻", "┬─┬ノ( º _ ºノ)", "(ノಠ益ಠ)ノ彡┻━┻",
    "ε(´סּ︵סּ`)з", "(¬_¬)", "┌( ಠ_ಠ)┘", "(ᗒᗣᗕ)՞",
    "( •_•)>⌐■-■", "(⌐■_■)", "༼ つ ◕_◕ ༽つ", "(҂◡_◡)",
    "ᕦ(ツ)ᕤ", "(｀・ω・´)", "( ˶ˆᗜˆ˵ )", "(/≧▽≦)/",
    "(・・?)", "(˘･_･˘)", "( ´ー`)", "φ(゜▽゜*)♪",
    "( ._.)", "¯\_(ツ)_/¯", "(´-ω-`)", "(`ε´)"
  ],
  music: [
    "♪(´ε` )", "～(￣▽￣～)", "(～￣▽￣)～", "♪～(´ε｀ )",
    "ヾ(⌐■_■)ノ♪", "♬♫♪◖(● o ●)◗♪♫♬", "(￣▽￣)/♫",
    "d(￣◇￣)b", "♪♪♪ ヽ(ˇ∀ˇ )ゞ", "(☆▽☆)", "(*≧▽≦)",
    "ヽ(>∀<☆)☆", "＼(￣▽￣)／", "(*´▽`*)", "(●´ω｀●)",
    "♪(^∇^*)", "ヾ(´︶`♡)ﾉ", "(ﾉ´ヮ`)ﾉ♪", "٩(♡ε♡)۶",
    "♪(๑ᴖ◡ᴖ๑)♪", "ヽ(´▽`)ノ♪", "(˶˃ ᵕ ˂˶)♡", "♫♪♬ヽ(ˇ∀ˇ)ゞ",
    "₍₍ ◝(　ﾟ∀ ﾟ )◟ ⁾⁾", "(ノ≧∀≦)ノ♪", "✧♫•*¨*•.¸¸♪", "ヾ(○゜▽゜○)♪",
    "(〜￣▽￣)〜♪♪", "♪ヽ(^^ヽ)♪", "♪(/_ _ )/♪", "└|ﾟεﾟ|┐♪"
  ],
  gaming: [
    "ᕦ(ò_óˇ)ᕤ", "ᕙ(⇀‸↼‶)ᕗ", "(ง •_•)ง", "ᕦ(ツ)ᕤ",
    "٩(๑`^´๑)۶", "(ノಠ▽ಠ)ノ", "ᕙ(▀̿Ĺ̯▀̿ ̿)ᕗ", "(•̀ᴗ•́)و",
    "(╯°□°)╯︵ ┻━┻", "(ノ°▽°)ノ︵┻━┻", "ε=ε=ε=┌(;*´Д`)ノ",
    "(╬ Ò﹏Ó)", "ヽ(`Д´)ノ", "(ﾉಥ益ಥ)ﾉ", "(ノ｀Д´)ノ",
    "щ(ಠ益щ)", "ლ(ಠ益ಠლ)", "ヽ(#`Д´)ノ",
    "┻━┻ ︵ \(°□°)/ ︵ ┻━┻", "(ノಠ益ಠ)ノ彡┻━┻",
    "(ಠ_ಠ)>⌐■-■", "(⌐■_■)", "( •_•)>⌐■-■", "gg (￣▽￣)ゞ",
    "ヽ(´ー`)", "(￣ー￣)ゞ", "( ˘ω˘ )☞", "✧*。٩(ˊᗜˋ*)و✧*。",
    "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "ヽ(゜∇゜)ノ", "☆*:.｡.o(≧▽≦)o.｡.:*☆", "(๑✧◡✧๑)"
  ],
  bilibili: [
    "( ゜- ゜)つロ", "哔哩哔哩 (゜-゜)つロ 干杯~", "(´･ω･`)",
    "(=・ω・=)", "(｀・ω・´)", "(~￣▽￣)～", "[]~(￣▽￣)~*",
    "(/≧▽≦)/", "(°∀°)ﾉ", "∑(っ°Д°;)っ", "(o゜▽゜)o☆",
    "φ(゜▽゜*)♪", "(￣▽￣)ノ", "o(*￣▽￣*)o", "( •̀ ω •́ )y",
    "ヽ(✿ﾟ▽ﾟ)ノ", "(｡･∀･)ﾉﾞ", "╰(*°▽°*)╯", "(๑•̀ㅂ•́)و✧",
    "w(ﾟДﾟ)w", "(ノへ￣、)", "╮(╯▽╰)╭", "(￣_,￣ )",
    "(⊙_⊙)?", "(?_?)", "(┬_┬)", "ㄟ( ▔, ▔ )ㄏ"
  ],
  social: [
    "(ヾﾉ･ω･`)", "( ˙꒳​˙ )", "( ´ ▽ ` )ﾉ", "(｡･∀･)ﾉﾞ",
    "(*・ω・)ﾉ", "( ´ ∀ ` )ﾉ", "ヾ(☆▽☆)", "(o´ω`o)ﾉ",
    "💬(・∀・)", "( ^_^)／", "(*￣▽￣)d", "b(￣▽￣*)",
    "( ﾟ▽ﾟ)/", "( ´ ▽ ` )", "(・ω・)ノ", "ヾ(´･ω･`)",
    "Hi~ o(*￣▽￣*)ブ", "(｡･∀･)ﾉ", "(*^▽^*)", "(￣▽￣)~*",
    "<(￣︶￣)>", "(oﾟvﾟ)ノ", "ヽ(✿ﾟ▽ﾟ)ノ", "(*￣3￣)╭",
    "(´∀｀)♡", "(●'◡'●)", "(✿◡‿◡)", "(*/ω＼*)"
  ],
  karaoke: [
    "٩(ˊ〇ˋ*)و", "( ~o~)", "♪～(´ε｀ )", "ヾ(⌐■_■)ノ♪",
    "(ノ≧∀≦)ノ♪", "✧♫•*¨*•.¸¸♪", "ヾ(○゜▽゜○)♪", "(〜￣▽￣)〜♪♪",
    "♪ヽ(^^ヽ)♪", "♪(/_ _ )/♪", "🎤(￣▽￣)", "( o )~♪",
    "٩(♡ε♡)۶", "(ﾉ´ヮ`)ﾉ♪", "♪(^∇^*)", "d(￣◇￣)b",
    "♪♪♪ ヽ(ˇ∀ˇ )ゞ", "(☆▽☆)", "(*≧▽≦)", "ヽ(>∀<☆)☆",
    "＼(￣▽￣)／", "(*´▽`*)", "(●´ω｀●)", "♪(´ε` )",
    "～(￣▽￣～)", "(～￣▽￣)～"
  ],
  browsing: [
    "(○_○)", "(゜-゜)", "ಠ_ಠ", "(・・ ) ?",
    "(・・?)", "(´・ω・`)?", "ლ(ಠ_ಠ ლ)", "(￢_￢)",
    "눈_눈", "(¬_¬ )", "( ﾟдﾟ)", "(°ロ°) !",
    "Σ(°△°|||)", "(⊙_⊙)", "(*・ω・)ﾉ", "(｡◕‿◕｡)",
    "(✧ω✧)", "(◕‿◕)", "(◠‿◠)", "( ˘ω˘ )",
    "(°o°)", "Σ(ﾟДﾟ)", "(゜゜)", "(・∀・)",
    "(*°▽°*)", "(｀・ω・´)ゞ", "( ﾟヮﾟ)", "ヽ(°〇°)ﾉ",
    "(¬‿¬)", "( ಠ ʖ̯ ಠ)", "(︶︹︺)", "┐(´д｀)┌",
    "( ´_ゝ`)", "(≖_≖ )", "(¬_¬)", "ಠ╭╮ಠ"
  ],
  idle: [
    "(￣o￣) zzZZ", "(－ω－) zzZ", "(∪｡∪)｡｡｡zzZ", "(´-ω-`)",
    "(-_-) zzZ", "( ˘ω˘ )", "(ˇωˇ)", "(¦3[▓▓]",
    "_(´ཀ`」 ∠)_", "(ノ_ _)ノ", "(-ω-)", "(´～`~)~",
    "(´〜`*)", "( ´_ゝ`)", "(￣ρ￣)..zzZZ", "(-_-)zzZ",
    "(-.-)Zzz", "(￣。￣)~zzz", "(´-﹏-`)", "( ु⁎ᴗ_ᴗ⁎)ु.。oO",
    "(ᴗ˳ᴗ)", "( ´ρ`)", "(¦3ꇤ[▓▓]", "(´ぅω・｀)",
    "( ˃̣̣̥ω˂̣̣̥ )", "(´〜`*) zzz", "₍₍ (ง ˘ω˘ )ว ⁾⁾", "(ᵕ≀ᵕ)",
    "♡´･ᴗ･`♡", "( ͡° ͜ʖ ͡°) zzz", "(˚ ˃̣̣̥⌓˂̣̣̥ )", "(*´ο`*)"
  ],
  working: [
    "٩(◕‿◕｡)۶", "(*≧∀≦*)", "(๑>◡<๑)", "٩(^‿^)۶",
    "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "( ´ ▽ ` )b", "ᕙ(⇀‸↼‶)ᕗ", "(•_•)",
    "( •_•)>⌐■-■", "(⌐■_■)", "ヾ(⌐■_■)ノ♪", "(ノ´ヮ`)ノ*:･ﾟ✧",
    "☆*:.｡.o(≧▽≦)o.｡.:*☆", "(★ω★)/", "٩(๑❛ᴗ❛๑)۶", "ヽ(´▽`)/",
    "(ノ^_^)ノ", "＼(◎o◎)／", "(｡♥‿♥｡)", "(*^▽^*)",
    "(҂◡_◡) ᕤ", "ᕦ(ò_óˇ)ᕤ", "(ง'̀-'́)ง", "( •̀ω•́ )σ",
    "٩(ˊᗜˋ*)و", "(๑˃̵ᴗ˂̵)و", "( ˘⌣˘)♡", "ヾ(＠⌒ー⌒＠)ノ",
    "(´｡• ω •｡`)", "( ˙▿˙ )", "(◕ᴗ◕✿)", "ヽ(✿ﾟ▽ﾟ)ノ"
  ],
  wayland: [
    "🐧(•_•)", "(◕ᴥ◕)🐧", "ʕ•ᴥ•ʔ", "(´・ᴥ・`)",
    "▼・ᴥ・▼", "ʕ·ᴥ·ʔ", "ʕ ᵔᴥᵔ ʔ", "(=^-ω-^=)",
    "(｡♥‿♥｡)", "(✿◠‿◠)", "(◕‿◕✿)", "( ˘ ³˘)♥",
    "(◍•ᴗ•◍)❤", "(っ˘ω˘ς)", "ʕ￫ᴥ￩ʔ", "🐧ʕ•ᴥ•ʔ",
    "🐧(◕ᴗ◕)", "ʕ •ᴥ•ʔゝ☆", "(･ω･)つ🐧", "٩(๑❛ᴗ❛๑)۶🐧",
    "🐧ヽ(✿ﾟ▽ﾟ)ノ", "(ᵔᴥᵔ)🐧", "🐧(￣▽￣)ノ", "( ˘ᴗ˘ )🐧",
    "🐧٩(◕‿◕｡)۶", "ʕ´•ᴥ•`ʔ σ", "🐧(•̀ᴗ•́)و", "(◠‿◠)🐧"
  ],
  offline: [
    "(－_－) zzZ", "(∪｡∪)｡｡｡zzZ", "(´-ω-`)", "(¦3[▓▓]",
    "_(´ཀ`」 ∠)_", "(ノ_ _)ノ", "(-ω-)", "(´〜`*)",
    "(￣ρ￣)..zzZZ", "(-_-)zzZ", "(-.-)Zzz", "(￣。￣)~zzz",
    "(´-﹏-`)", "ヾ( ･_･;)", "(・・ )", "(ι´Д`)ノ",
    "(˘ω˘)", "( ´ー`)y-~~", "(￣ー￣)", "(-.-)y-°°°",
    "(´･ω･`)", "┐('～`;)┌", "(；一_一)", "(-_-)゜zzz",
    "( ˇωˇ )", "(¬‿¬ )", "~(˘▾˘~)", "(~˘▾˘)~"
  ],
  windows: [
    "🪟(•_•)", "(◕‿◕)🪟", "٩(◕‿◕｡)۶🪟", "🪟(*≧∀≦*)",
    "(ノ´ヮ`)ノ*:・゚✧🪟", "🪟ヽ(´▽`)/", "(•̀ᴗ•́)و🪟", "🪟(｡•̀ᴗ-)✧",
    "( ˘ω˘ )🪟", "🪟(´・ω・`)", "(◠‿◠)🪟", "🪟٩(^‿^)۶",
    "⊞(•_•)", "(⌐■_■)⊞", "⊞ヾ(⌐■_■)ノ♪", "(◕ᴗ◕✿)⊞",
    "⊞(ノ◕ヮ◕)ノ*:･ﾟ✧", "(*´▽`*)⊞", "⊞(๑>◡<๑)", "(≧◡≦)⊞",
    "(ﾉ´ヮ`)ﾉ*:･ﾟ✧", "ヽ(>∀<☆)☆", "(★ω★)/", "٩(๑❛ᴗ❛๑)۶",
    "(*^▽^*)", "(◕‿◕✿)", "ヽ(✿ﾟ▽ﾟ)ノ", "(｡♥‿♥｡)"
  ],
  macos: [
    "(•_•)", "(⌐■_■)", "(◕‿◕)", "⌘(•̀ᴗ•́)و",
    "( ˘ω˘ )", "(´・ω・`)", "⌘(｡•̀ᴗ-)✧", "(◠‿◠)",
    "(★ω★)/", "⌘(ノ◕ヮ◕)ノ", "(ﾉ´ヮ`)ﾉ*:･ﾟ✧", "(๑>◡<๑)",
    "⌘(￣▽￣)ゞ", "( ´ ▽ ` )", "( ˙▿˙ )", "⌘(◕ᴗ◕✿)"
  ],
  android: [
    "🤖(•_•)", "(◕ᴥ◕)🤖", "⚡(•̀ᴗ•́)و", "( ˘ω˘ )🤖",
    "📱(•_•)", "(⌐■_■)📱", "📱(◕‿◕)", "🤖(｡•̀ᴗ-)✧",
    "🤖(★ω★)/", "📱(ノ◕ヮ◕)ノ", "(ﾉ´ヮ`)ﾉ*:･ﾟ✧🤖", "🤖(๑>◡<๑)",
    "⚡(￣▽￣)ゞ", "( ´ ▽ ` )🤖", "🤖( ˙▿˙ )", "📱(◕ᴗ◕✿)"
  ]
};

const getRandomKaomoji = (activity: string): string => {
  const list = KAOMOJI[activity as keyof typeof KAOMOJI] || KAOMOJI.working;
  return list[Math.floor(Math.random() * list.length)] || "(•_•)";
};

const KaomojiCharacter = ({ activity, appName, initialKaomoji, isActivityTransitioning = false, language = 'en' }: {
  activity: string;
  appName: string;
  initialKaomoji: string;
  isActivityTransitioning?: boolean;
  language?: 'en' | 'zh';
}) => {
  const [kaomoji, setKaomoji] = useState(initialKaomoji);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevAppNameRef = useRef(appName);
  const isFirstRenderRef = useRef(true);
  const activityContent = getActivityContent(activity, language);
  const clickHint = language === 'zh' ? '点击切换颜文字！' : 'Click to change kaomoji!';
  const clickTitle = language === 'zh' ? '点击切换！' : 'Click to change!';

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (prevAppNameRef.current !== appName) {
      setIsTransitioning(true);
      const timeout = setTimeout(() => {
        setKaomoji(getRandomKaomoji(activity));
        prevAppNameRef.current = appName;
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [appName, activity]);

  const handleClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setKaomoji(getRandomKaomoji(activity));
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const fontSize = useMemo(() => {
    const len = kaomoji.length;
    if (len <= 8) return 'text-5xl md:text-6xl';
    if (len <= 12) return 'text-4xl md:text-5xl';
    if (len <= 16) return 'text-3xl md:text-4xl';
    if (len <= 22) return 'text-2xl md:text-3xl';
    return 'text-xl md:text-2xl';
  }, [kaomoji]);

  return (
    <div className="relative">
      <div
        className={`absolute inset-0 blur-3xl rounded-full scale-150 animate-pulse ${ isActivityTransitioning ? '' : 'transition-all duration-700 ease-in-out'}`}
        style={{ backgroundColor: getGlowColor(activity) }}
      />
      <div
        className="relative w-full h-[120px] md:w-[400px] md:h-[140px] mx-auto flex items-center justify-center cursor-pointer select-none"
        onClick={handleClick}
        title={clickTitle}
      >
        <div
          className={`${fontSize} font-mono transition-all duration-300 ease-out whitespace-nowrap ${ isTransitioning ? 'opacity-0 scale-90 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
          style={{ textShadow: '0 0 40px rgba(99, 102, 241, 0.3)' }}
        >
          {kaomoji}
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span className="absolute top-4 left-8 text-2xl opacity-60 animate-float" style={{ animationDelay: '0s' }}>✦</span>
          <span className="absolute top-8 right-12 text-xl opacity-40 animate-float" style={{ animationDelay: '0.5s' }}>✧</span>
          <span className="absolute bottom-8 left-16 text-lg opacity-50 animate-float" style={{ animationDelay: '1s' }}>✦</span>
          <span className="absolute bottom-4 right-8 text-2xl opacity-30 animate-float" style={{ animationDelay: '1.5s' }}>✧</span>
        </div>
      </div>
      <div className="text-center mt-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full transition-all duration-300 ${ isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <span className="text-2xl">{activityContent.emoji}</span>
        </div>
        <p className="text-slate-500 text-xs mt-2">{clickHint}</p>
      </div>
    </div>
  );
};

const getGlowColor = (activity: string): string => {
  const colors: Record<string, string> = {
    coding: 'rgba(20, 184, 166, 0.18)',
    music: 'rgba(217, 70, 239, 0.18)',
    gaming: 'rgba(251, 113, 133, 0.18)',
    bilibili: 'rgba(244, 114, 182, 0.18)', // pink-400
    social: 'rgba(99, 102, 241, 0.18)',    // indigo-500
    karaoke: 'rgba(244, 63, 94, 0.18)',   // rose-500
    browsing: 'rgba(59, 130, 246, 0.18)',
    idle: 'rgba(168, 85, 247, 0.12)',
    working: 'rgba(139, 92, 246, 0.18)',
    wayland: 'rgba(251, 191, 36, 0.18)',
    windows: 'rgba(56, 189, 248, 0.18)',
    macos: 'rgba(96, 165, 250, 0.15)',
    android: 'rgba(52, 211, 153, 0.15)', // emerald-400
    offline: 'rgba(100, 116, 139, 0.1)',
    screen_off: 'rgba(100, 116, 139, 0.15)', // Slate
  };
  return colors[activity] || colors.working;
};

const getGradientColors = (activity: string): { from: string; to: string } => {
  const gradients: Record<string, { from: string; to: string }> = {
    coding: { from: '#2dd4bf', to: '#67e8f9' },
    music: { from: '#e879f9', to: '#f9a8d4' },
    gaming: { from: '#fb7185', to: '#fdba74' },
    bilibili: { from: '#f472b6', to: '#38bdf8' }, // pink-400 to sky-400
    social: { from: '#818cf8', to: '#22d3ee' },   // indigo-400 to cyan-400
    karaoke: { from: '#f43f5e', to: '#7c3aed' },  // rose-500 to violet-600
    browsing: { from: '#60a5fa', to: '#a5b4fc' },
    idle: { from: '#d8b4fe', to: '#94a3b8' },
    working: { from: '#a78bfa', to: '#e879f9' },
    wayland: { from: '#fbbf24', to: '#fdba74' },
    windows: { from: '#38bdf8', to: '#93c5fd' },
    macos: { from: '#94a3b8', to: '#bfdbfe' },
    android: { from: '#34d399', to: '#6ee7b7' }, // emerald-400 -> emerald-300
    offline: { from: '#64748b', to: '#475569' },
    screen_off: { from: '#64748b', to: '#52525b' }, // Slate to Zinc
  };
  return gradients[activity] || gradients.working;
};

const StatusPage = () => {
  const { language, toggleLanguage, isTransitioning: isLangTransitioning } = useLanguage();
  const [statuses, setStatuses] = useState<StatusData[]>([]); // Changed from single status to array
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [particles] = useState(() => generateParticles(25));
  const [_error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);
  const [activeOsName, setActiveOsName] = useState<string | null>(null);
  
  const [displayedStatus, setDisplayedStatus] = useState<StatusData | null>(null);
  const [displayedActivity, setDisplayedActivity] = useState<string | null>(null);
  const [initialKaomoji, setInitialKaomoji] = useState<string | null>(null);
  
  const [isActivityTransitioning, setIsActivityTransitioning] = useState(false);
  const prevStatusRef = useRef<string>(''); // Use a stringified version or unique key to track changes
  
  const pendingUpdateRef = useRef<{ status: StatusData | null; activity: string; kaomoji: string; } | null>(null);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (hasFetched && !isDataLoaded) {
       const t = setTimeout(() => setIsDataLoaded(true), 100);
       return () => clearTimeout(t);
    }
  }, [hasFetched, isDataLoaded]);

  useEffect(() => {
    if (statuses.length === 0) return;
    
    if (activeOsName) {
        const newIndex = statuses.findIndex(s => s.os_name === activeOsName);
        if (newIndex !== -1 && newIndex !== activeDeviceIndex) {
            setActiveDeviceIndex(newIndex);
        } else if (newIndex === -1) {
            const safeIndex = activeDeviceIndex >= statuses.length ? 0 : activeDeviceIndex;
            setActiveDeviceIndex(safeIndex);
            setActiveOsName(statuses[safeIndex]?.os_name || null);
        }
    } else if (statuses.length > 0) {
        setActiveOsName(statuses[0]?.os_name || null);
    }
  }, [statuses]);

  const displayedStatusType = displayedStatus
      ? getStatusType(displayedStatus, true)
      : (isDataLoaded ? 'offline' : 'unknown');

  const isSystemOnline = isConnected && statuses.length > 0;

  const applyPendingUpdate = useCallback(() => {
    if (pendingUpdateRef.current) {
      const { status, activity, kaomoji } = pendingUpdateRef.current;
      setDisplayedStatus(status);
      setDisplayedActivity(activity);
      setInitialKaomoji(kaomoji);
      pendingUpdateRef.current = null;
    }
  }, []);

  const handleStatusUpdate = useCallback((targetStatus: StatusData | null, _isOnline: boolean, isImmediate: boolean) => {
      
      let effectiveActivity = 'offline';
      
      if (targetStatus) {
          const newActivity = getActivityType(targetStatus.app_name, targetStatus.title, targetStatus.os_name || '');
          const newStatusType = getStatusType(targetStatus, true);
          const osName = targetStatus.os_name?.toLowerCase();

          const validActivityTypes = ['coding', 'music', 'gaming', 'browsing', 'idle', 'working', 'wayland', 'windows', 'macos', 'android', 'screen_off', 'offline'];
          const forceType = targetStatus.force_status_type?.toLowerCase();
          const isForceValid = forceType && forceType !== 'n/a' && validActivityTypes.includes(forceType);

          effectiveActivity = isForceValid ? forceType
            : newStatusType === 'offline' ? 'offline'
            : newStatusType === 'wayland_limited' ? (
                osName === 'linux' ? 'wayland' :
                osName === 'windows' ? 'windows' :
                (osName === 'macos' || osName === 'darwin') ? 'macos' :
                (osName?.includes('android')) ? 'android' :
                'working'
              )
            : newActivity;
      }

      const currentStatusKey = targetStatus ? JSON.stringify(targetStatus) : 'offline';
      const statusChanged = prevStatusRef.current !== currentStatusKey;

      // Major change detection: activity change or offline <-> online switch
      const activityChanged = effectiveActivity !== displayedActivity;
      
      // If it's the first load or a major change, do the full transition
      if (isImmediate || !isDataLoaded || (prevStatusRef.current === '' && statusChanged) || activityChanged) {
          if (statusChanged || isImmediate || !isDataLoaded) {
              prevStatusRef.current = currentStatusKey;
              
              const newKaomoji = getRandomKaomoji(effectiveActivity);
              pendingUpdateRef.current = {
                  status: targetStatus,
                  activity: effectiveActivity,
                  kaomoji: newKaomoji,
              };
              
              if (isImmediate || !isDataLoaded) {
                  // Instant update without transition for initial load
                  applyPendingUpdate();
                  setIsDataLoaded(true);
              } else {
                  // Full blur transition for major changes
                  setIsActivityTransitioning(true);
                  setTimeout(() => {
                      applyPendingUpdate();
                      setTimeout(() => {
                          setIsActivityTransitioning(false);
                      }, 200);
                  }, 300);
              }
          }
      } else if (statusChanged) {
          // Minor change (same activity, just title/app name update)
          // Update immediately without global blur
          prevStatusRef.current = currentStatusKey;
          setDisplayedStatus(targetStatus);
          setDisplayedActivity(effectiveActivity);
          // We do NOT update kaomoji here to keep it stable during minor updates
      }
  }, [applyPendingUpdate, displayedActivity]);

  const fetchStatus = useCallback(async (isFirstFetch: boolean = false) => {
    const handleFetchError = () => {
      setIsConnected(false);
      setStatuses([]);
      setActiveDeviceIndex(0);
      setActiveOsName(null);
      setError(language === 'zh' ? '无法连接到状态服务' : 'Unable to connect to status service');
      setHasFetched(true);
      handleStatusUpdate(null, false, isFirstFetch);
    };

    try {
      const response = await fetch('/api/status');
      if (!response.ok) {
        handleFetchError();
        return;
      }
      const data: StatusData[] = await response.json();

      data.sort((a, b) => {
        const getWeight = (s: StatusData) => {
          const os = s.os_name?.toLowerCase() || '';
          const app = s.app_name || '';

          if (os.includes('android')) {
            return app === 'Screen Off' ? 100 : 0;
          }
          if (os.includes('windows')) return 10;
          if (os.includes('linux')) return 20;
          if (os.includes('mac') || os.includes('darwin')) return 30;
          return 50; 
        };

        return getWeight(a) - getWeight(b);
      });

      setStatuses(data);
      setIsConnected(true);
      setLastUpdate(new Date());
      setError(null);
      setHasFetched(true);

      if (data.length === 0) {
          handleStatusUpdate(null, true, isFirstFetch);
          setActiveOsName(null);
      }

    } catch {
      handleFetchError();
    }
  }, [language, handleStatusUpdate]); 

  useEffect(() => {
    void fetchStatus(true);
    const interval = setInterval(() => void fetchStatus(false), 1000);
    return () => clearInterval(interval);
  }, []); 

  useEffect(() => {
      if (!hasFetched) return;

      if (statuses.length > 0) {
          const index = activeDeviceIndex >= statuses.length ? 0 : activeDeviceIndex;
          const status = statuses[index];
          if (status) {
             handleStatusUpdate(status, true, false);
          }
      } else {
          handleStatusUpdate(null, isConnected, false);
      }
  }, [statuses, activeDeviceIndex, handleStatusUpdate, isConnected, hasFetched]);

  const handleManualSwitch = (idx: number) => {
      setActiveDeviceIndex(idx);
      if (statuses[idx]) {
          setActiveOsName(statuses[idx].os_name || null);
      }
  };

  const activityContent = getActivityContent(displayedActivity || 'working', language);
  const t = {
    en: {
      title: 'Right Now',
      subtitle: 'What am I up to?',
      offline: 'Currently Offline',
      offlineDesc: 'The status service shows I\'m offline. I might be away from my computer or the client is not running.',
      using: 'CURRENTLY',
      backHome: 'Back Home',
      tip: 'This page auto-refreshes every 5 seconds to show what I\'m currently doing.'
    },
    zh: {
      title: '此刻',
      subtitle: '我在做什么？',
      offline: '当前离线',
      offlineDesc: '状态服务显示我已离线。我可能不在电脑前，或者客户端没有运行。',
      using: '正在',
      backHome: '返回首页',
      tip: '这个页面每 5 秒自动更新一次，展示我当前正在做的事情。'
    }
  }[language];

  const isTransitioning = isLangTransitioning || isActivityTransitioning;

  return (
    <div className="fixed inset-0 bg-dark text-light font-sans overflow-hidden selection:bg-primary/30">
      <div
        className={`fixed inset-0 bg-dark z-[100] transition-opacity duration-300 pointer-events-none ${ isTransitioning ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        className={`relative w-full h-full transition-opacity duration-700 ease-out ${ isDataLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute inset-0 pointer-events-none">
          {displayedActivity && (
            <>
              <div
                className={`absolute top-0 left-0 w-full h-full opacity-20 transition-colors duration-1000 ease-in-out`}
                style={{
                  background: `radial-gradient(circle at 50% 30%, ${getGradientColors(displayedActivity).from}, transparent 70%)`
                }}
              />
              <div
                className={`absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 mix-blend-screen animate-pulse ${ isActivityTransitioning ? '' : 'transition-colors duration-1000'}`}
                style={{ backgroundColor: getGradientColors(displayedActivity).to }}
              />
            </>
          )}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48ZmVCbGVuZCBtb2RlPSJzY3JlZW4iLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] mix-blend-overlay" />
          <ParticleField particles={particles} />
        </div>

        <nav className="absolute top-0 left-0 right-0 p-6 md:p-8 flex justify-between items-start z-50">
          <ConnectionStatus isOnline={isSystemOnline} lastUpdate={lastUpdate} language={language} />
          
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={toggleLanguage}
              className={`flex items-center gap-2 h-10 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all duration-300 group ${ isLangTransitioning ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}`}
            >
              <Globe size={14} className={`text-white/70 group-hover:text-white transition-all duration-300 ${isLangTransitioning ? 'rotate-180' : 'rotate-0'}`} />
              <span className={`text-xs font-medium text-white/70 group-hover:text-white transition-all duration-200 ${isLangTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                {language === 'en' ? 'CN' : 'EN'}
              </span>
            </button>
          </div>
        </nav>

        <main className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pointer-events-none">
          <div className="relative w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-8 md:gap-12">
            <div className="pointer-events-auto relative group">
              <div className={`absolute inset-0 bg-gradient-to-tr ${activityContent.color} opacity-20 blur-[60px] rounded-full group-hover:opacity-30 transition-opacity duration-700`} />
              <div className="relative transform transition-transform duration-500 group-hover:scale-105">
                {initialKaomoji && displayedActivity && (
                  <KaomojiCharacter
                    activity={displayedActivity}
                    appName={displayedStatus?.app_name || ''}
                    initialKaomoji={initialKaomoji}
                    isActivityTransitioning={isActivityTransitioning}
                    language={language}
                  />
                )}
              </div>
            </div>

            <div className="text-center z-20 space-y-4 mix-blend-screen">
              <h2 className="text-xs md:text-sm font-mono text-white/40 tracking-[0.3em] uppercase">
                {t.using}
              </h2>
              
              <h1 
                className={`font-display text-3xl md:text-4xl font-light tracking-[0.2em] uppercase text-white/90 select-none ${ isActivityTransitioning ? 'opacity-0 blur-sm' : 'opacity-100 blur-0' } transition-all duration-700 ease-out`}
              >
                {displayedStatusType === 'offline' 
                  ? (language === 'zh' ? '离线休息' : 'OFFLINE') 
                  : activityContent.verb[language === 'en' ? 'en' : 'zh']}
              </h1>

              <div className={`transition-all duration-700 delay-100 ${isActivityTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}> 
                 {displayedStatusType === 'online' ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg md:text-xl font-display font-medium text-white/80 border-b border-white/10 pb-1">
                        <FadeText text={displayedStatus?.app_name || 'Unknown'} />
                      </span>
                      {displayedStatus?.title && displayedStatus.title !== displayedStatus.app_name && (
                        <span className="text-xs text-white/30 font-light max-w-[200px] md:max-w-xs truncate tracking-wide">
                          <FadeText text={displayedStatus.title} />
                        </span>
                      )}
                    </div>
                 ) : displayedStatusType === 'wayland_limited' ? (
                    <DetectionLimitNotice 
                        language={language} 
                        osName={displayedStatus?.os_name}
                        displayedActivity={displayedActivity || 'working'} 
                    />
                 ) : (
                    <span className="text-xs text-white/30 font-light tracking-wide">{t.offlineDesc}</span>
                 )}
              </div>
            </div>
          </div>
        </main>

        <footer className="absolute bottom-8 left-0 right-0 z-50 flex flex-col items-center justify-end px-6 pb-safe pointer-events-auto">
          <div className="flex flex-col items-center gap-3">
             {statuses.length > 1 && (
                 <div className="flex items-center gap-2 mb-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                     {statuses.map((_, idx) => (
                         <button
                            key={idx}
                            onClick={() => handleManualSwitch(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${ idx === activeDeviceIndex 
                                    ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]' 
                                    : 'bg-white/20 hover:bg-white/40'}`}
                         />
                     ))}
                 </div>
             )}
          
             <div className="flex items-center gap-4 text-[10px] text-white/20 font-medium uppercase tracking-widest">
                {displayedStatus?.os_name && (
                    <span className="transition-opacity duration-300">
                        {displayedStatus.os_name}
                    </span>
                )}
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className={`transition-colors duration-500 ${isSystemOnline ? 'text-green-400/60' : 'text-red-400/60'}`}>
                    {isSystemOnline ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
             </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <StatusPage />
    </LanguageProvider>
  );
};

export default App;