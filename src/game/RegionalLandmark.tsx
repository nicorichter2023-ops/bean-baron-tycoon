/** Local, lightweight landmark outlines only where no uploaded matching artwork exists. */
export function RegionalLandmark({ cityId, label }: { cityId: string; label: string }) {
  const tower = cityId === 'chicago', bridge = cityId === 'san_francisco';
  return <svg viewBox="0 0 160 220" role="img" aria-label={label} className="regional-landmark">
    <ellipse className="landmark-shadow" cx="80" cy="203" rx="65" ry="12" />
    {bridge ? <><path className="landmark-bridge" d="M10 160L150 110M36 177V50M125 144V20M10 85Q36 50 80 104Q125 20 150 54"/><path className="landmark-cable" d="M15 80V157M52 70V148M70 96V143M94 84V135M113 40V128M142 45V113"/></>
      : tower ? <><path className="landmark-building" d="M28 202V72H48V30H72V6H80V64H96V46H116V96H135V202Z"/><path className="landmark-window" d="M40 90V183M62 55V184M87 86V184M108 108V184M123 118V184"/></>
      : cityId === 'amsterdam' ? <><path className="landmark-building" d="M12 196V95L32 64L52 95V196M55 196V82L77 48L99 82V196M104 196V108L128 76L151 108V196Z"/><path className="landmark-window" d="M24 115V180M41 115V180M68 105V180M86 105V180M116 127V180M139 127V180"/></>
      : cityId === 'madrid' ? <><path className="landmark-stone" d="M18 198V96H142V198H118V150Q118 124 100 150V198H91V134Q80 99 69 134V198H60V150Q42 124 42 150V198Z"/><path className="landmark-stone" d="M14 96V80H146V96M42 80V68H118V80"/></>
      : cityId === 'osaka' ? <><path className="landmark-stone" d="M30 198L38 158H122L132 198Z"/><path className="landmark-building" d="M44 160V113H116V160M54 114V78H106V114M65 80V43H95V80"/><path className="landmark-roof" d="M24 118L80 96L139 118Z M38 81L80 64L123 81Z M51 46L80 28L110 46Z"/></>
      : <><path className="landmark-stone" d="M31 199V87H57V56H69V24H76V8H83V56H96V87H129V199Z"/><path className="landmark-window" d="M44 116V183M66 105V182M89 113V183M113 116V183"/></>}
  </svg>;
}