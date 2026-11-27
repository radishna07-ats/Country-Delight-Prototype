import type { Product } from "../data/types";

// Original flat illustrations (no Country Delight photography is reproduced).
export function ProductArt({ p, size = 96 }: { p: Product; size?: number }) {
  const { kind, color, accent, label } = p.art;
  const bg = soft(color);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={p.name} className="block">
      <rect width="100" height="100" rx="18" fill={bg} />
      <ellipse cx="50" cy="86" rx="30" ry="5" fill="#000" opacity=".07" />
      {kind === "pouch" && (<g>
        <path d="M30 22h40l4 58c0 3-2 5-5 5H31c-3 0-5-2-5-5l4-58z" fill="#fff" stroke="#d9e2e8" />
        <path d="M30 22h40l-2 6H32z" fill={color} />
        <rect x="31" y="40" width="38" height="26" rx="6" fill={color} />
        <path d="M31 58c10-6 26-6 38 0v8H31z" fill={accent} opacity=".9" />
        <circle cx="50" cy="48" r="7" fill="#fff" opacity=".95" />
        <path d="M46 48c2-3 6-3 8 0" stroke={color} strokeWidth="2" fill="none" />
        {label && <text x="50" y="78" fontSize="6.5" textAnchor="middle" fontWeight="800" fill={color}>{label}</text>}
      </g>)}
      {kind === "tetra" && (<g>
        <path d="M34 26l8-8h16l8 8v56H34z" fill={color} stroke="#d9e2e8" /><path d="M34 26h32" stroke="#ccc" />
        <rect x="38" y="40" width="24" height="22" rx="4" fill={accent} /><text x="50" y="55" fontSize="10" textAnchor="middle" fontWeight="800" fill="#fff">A2</text>
      </g>)}
      {kind === "tub" && (<g>
        <path d="M26 36h48l-5 44H31z" fill={color} stroke="#d9e2e8" /><rect x="24" y="30" width="52" height="8" rx="3" fill={accent} />
        <rect x="33" y="50" width="34" height="14" rx="4" fill={accent} opacity=".15" /><text x="50" y="60" fontSize="8" textAnchor="middle" fontWeight="800" fill={accent}>DAHI</text>
      </g>)}
      {kind === "cup" && (<g>
        <path d="M30 34h40l-4 44H34z" fill={color} stroke="#d9e2e8" /><ellipse cx="50" cy="34" rx="20" ry="5" fill={accent} />
        <text x="50" y="60" fontSize="7.5" textAnchor="middle" fontWeight="800" fill={accent}>GREEK</text>
      </g>)}
      {kind === "block" && (<g>
        <path d="M24 46l26-12 26 12v24L50 82 24 70z" fill={color} stroke="#B98F2E" strokeWidth="1.4" /><path d="M24 46l26 12 26-12M50 58v24" stroke="#B98F2E" strokeWidth="1.2" fill="none" />
        <circle cx="38" cy="62" r="2" fill={accent} opacity=".4" /><circle cx="60" cy="66" r="2.5" fill={accent} opacity=".35" />
        {label && <rect x="28" y="24" width="44" height="10" rx="5" fill={accent} />}{label && <text x="50" y="31.5" fontSize="6" textAnchor="middle" fontWeight="800" fill="#fff">{label}</text>}
      </g>)}
      {kind === "jar" && (<g>
        <rect x="32" y="22" width="36" height="10" rx="3" fill={accent} /><rect x="28" y="30" width="44" height="52" rx="10" fill={color} opacity=".95" />
        <rect x="34" y="46" width="32" height="18" rx="4" fill="#fff" opacity=".85" /><path d="M38 55h24" stroke={accent} strokeWidth="2.5" />
      </g>)}
      {kind === "bottle" && (<g>
        <rect x="43" y="16" width="14" height="8" rx="2" fill={accent} /><path d="M40 26h20l4 10v42c0 3-2 5-5 5H41c-3 0-5-2-5-5V36z" fill={color} stroke="#d9e2e8" />
        <rect x="38" y="48" width="24" height="16" rx="3" fill={accent} opacity=".85" />
      </g>)}
      {kind === "coconut" && (<g>
        <path d="M26 58c0-18 10-30 24-30s24 12 24 30c0 14-11 24-24 24S26 72 26 58z" fill={color} />
        <path d="M38 34c4-6 8-8 12-8s8 2 12 8" fill={accent} /><ellipse cx="50" cy="32" rx="7" ry="3" fill="#fff" opacity=".9" /><path d="M50 32V16" stroke="#7a5" strokeWidth="2" />
      </g>)}
      {kind === "eggs" && (<g>
        <rect x="18" y="56" width="64" height="22" rx="6" fill="#B7B0A3" />
        {[28, 42, 56, 70].map((x, i) => <ellipse key={x} cx={x} cy={50 + (i % 2) * 2} rx="7" ry="9" fill={i % 2 ? accent : color} />)}
      </g>)}
      {kind === "bread" && (<g>
        <path d="M22 50c0-12 12-18 28-18s28 6 28 18c0 3-2 5-5 5v22H27V55c-3 0-5-2-5-5z" fill={color} /><path d="M27 55h46v22H27z" fill={accent} />
        <path d="M36 44l4-4M48 44l4-4M60 44l4-4" stroke={accent} strokeWidth="2" />
      </g>)}
      {kind === "powder" && (<g>
        <rect x="27" y="24" width="46" height="12" rx="4" fill={accent} />
        <path d="M29 34h42v42c0 4-3 7-7 7H36c-4 0-7-3-7-7z" fill={color} />
        <rect x="34" y="46" width="32" height="20" rx="4" fill="#fff" opacity=".95" />
        <text x="50" y="59" fontSize="8.5" textAnchor="middle" fontWeight="800" fill={color}>{label ?? "PROTEIN"}</text>
      </g>)}
      {kind === "batter" && (<g>
        <path d="M28 30h44v46c0 4-3 6-6 6H34c-3 0-6-2-6-6z" fill={color} stroke="#e5e5e5" /><rect x="28" y="30" width="44" height="12" fill={accent} />
        <text x="50" y="62" fontSize="7" textAnchor="middle" fontWeight="800" fill={accent}>IDLI · DOSA</text>
      </g>)}
      {kind === "banana" && (<g>
        <path d="M24 44c8 30 40 34 54 14-14 10-36 6-46-16z" fill={color} stroke={accent} strokeWidth="1.2" />
        <path d="M30 38c6 26 36 32 50 14" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" /><path d="M24 44l-4-6" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </g>)}
      {kind === "papaya" && (<g>
        <ellipse cx="50" cy="56" rx="22" ry="28" fill="#5E9E3A" /><ellipse cx="50" cy="56" rx="18" ry="24" fill={color} />
        <ellipse cx="50" cy="56" rx="7" ry="12" fill="#3b2a1a" opacity=".85" />
      </g>)}
      {kind === "leafy" && (<g>
        {[[-18, 0], [0, -6], [18, 0]].map(([dx, dy], i) => <path key={i} d={`M${50 + dx} 80c-14-10-14-36 0-46 14 10 14 36 0 46z`} transform={`translate(0 ${dy})`} fill={i === 1 ? color : accent} />)}
        <rect x="44" y="76" width="12" height="6" rx="2" fill="#7a5" />
      </g>)}
      {kind === "bag" && (<g>
        <path d="M30 26h40l4 54H26z" fill={color} stroke="#d9cfa8" /><path d="M30 26l4-6h32l4 6" fill={accent} />
        <rect x="36" y="44" width="28" height="18" rx="4" fill="#fff" opacity=".8" /><path d="M41 53h18" stroke={accent} strokeWidth="2.5" />
      </g>)}
      {kind === "nuts" && (<g>
        {[[36, 54], [52, 46], [62, 60], [44, 66], [56, 72], [30, 68]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="8" ry="5" transform={`rotate(${i * 30} ${x} ${y})`} fill={i % 2 ? color : accent} stroke="#8a5a32" strokeWidth=".6" />)}
      </g>)}
    </svg>
  );
}

function soft(hex: string) {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * 0.86);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
