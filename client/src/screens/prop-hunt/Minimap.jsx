import React from "react";
import { BOUNDS, WALLS, FURNITURE, JAIL } from "./world.js";

const edge = BOUNDS + 2;

export default function Minimap({ players = [] }) {
  return (
    <aside className="ph-minimap" aria-label="Courtyard minimap">
      <div className="ph-minimap-heading">COURTYARD <span>N ↑</span></div>
      <svg viewBox={`${-edge} ${-edge} ${edge * 2} ${edge * 2}`} role="img"
        aria-label="North-up map. Arrow: you. Dots: teammates. Rings: captured teammates. Diamond: Lost and Found.">
        <rect x={-BOUNDS} y={-BOUNDS} width={BOUNDS * 2} height={BOUNDS * 2} fill="#315448" />
        {FURNITURE.map((f, i) => <rect key={`f${i}`} x={f.x - f.w / 2} y={f.z - f.d / 2} width={f.w} height={f.d} fill="#718675" />)}
        {WALLS.map((w, i) => <rect key={`w${i}`} x={w.x - w.w / 2} y={w.z - w.d / 2} width={w.w} height={w.d} fill="#d4c5a4" />)}
        <g transform={`translate(${JAIL.x} ${JAIL.z})`}>
          <path d="M0 -2.2 2.2 0 0 2.2 -2.2 0Z" fill="#ffc181" stroke="#18382e" strokeWidth="0.5" />
          <text y="6" textAnchor="middle" fill="#ffdbad" fontSize="2.7" fontWeight="700">LOST &amp; FOUND</text>
        </g>
        {players.filter((p) => !p.mine).map((p) => (
          <circle key={p.id} cx={p.x} cy={p.z} r="1.25" fill={p.caught ? "#315448" : "#8fdfeb"} stroke={p.caught ? "#ffc181" : "#18382e"} strokeWidth="0.6">
            <title>{p.name}{p.caught ? " — captured" : " — teammate"}</title>
          </circle>
        ))}
        {players.filter((p) => p.mine).map((p) => (
          <path key={p.id} d="M0 -2.6 1.8 1.8 0 0.8 -1.8 1.8Z" transform={`translate(${p.x} ${p.z}) rotate(${-p.yaw * 180 / Math.PI})`} fill="#fff9df" stroke="#18382e" strokeWidth="0.5">
            <title>You{p.caught ? " — captured" : ""}</title>
          </path>
        ))}
      </svg>
      <div className="ph-minimap-key"><span>▲ You</span><span>● Team</span><span>○ Caught</span></div>
    </aside>
  );
}
