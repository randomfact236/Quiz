interface CountryFlagProps {
  code: string;
  size?: 'sm' | 'md' | 'lg';
}

const flagEmojis: Record<string, string> = {
  us: '🇺🇸',
  gb: '🇬🇧',
  ca: '🇨🇦',
  au: '🇦🇺',
  de: '🇩🇪',
  in: '🇮🇳',
  fr: '🇫🇷',
  jp: '🇯🇵',
  br: '🇧🇷',
  mx: '🇲🇽',
  es: '🇪🇸',
  it: '🇮🇹',
  nl: '🇳🇱',
  sg: '🇸🇬',
  ae: '🇦🇪',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function CountryFlag({ code, size = 'md' }: CountryFlagProps) {
  const emoji = flagEmojis[code.toLowerCase()] || '🌍';
  
  return (
    <span className={sizeClasses[size]} title={code.toUpperCase()}>
      {emoji}
    </span>
  );
}
