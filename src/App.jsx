import { useEffect, useRef, useState } from "react";

// Animated background: a field of "neurons" that occasionally fire,
// with the signal traveling along connections to nearby cells.
function NeuralField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, nodes, edges, pulses, raf;

    const build = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 16000);
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        glow: 0,
      }));
      edges = [];
      nodes.forEach((a, i) => {
        nodes
          .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
          .filter((o) => o.j !== i && o.d < 150)
          .sort((p, q) => p.d - q.d)
          .slice(0, 3)
          .forEach((o) => edges.push([i, o.j]));
      });
      pulses = [];
    };

    const fire = (i) => {
      nodes[i].glow = 1;
      edges
        .filter(([a]) => a === i)
        .forEach(([, b]) => {
          if (Math.random() < 0.55) pulses.push({ from: i, to: b, t: 0 });
        });
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      if (Math.random() < 0.03) fire(Math.floor(Math.random() * nodes.length));

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(120, 255, 190, 0.06)";
      ctx.beginPath();
      edges.forEach(([a, b]) => {
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
      });
      ctx.stroke();

      pulses = pulses.filter((p) => {
        p.t += 0.025;
        const a = nodes[p.from], b = nodes[p.to];
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        ctx.fillStyle = "rgba(140, 255, 200, 0.9)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (p.t >= 1) {
          if (Math.random() < 0.6) fire(p.to);
          return false;
        }
        return true;
      });
      if (pulses.length > 120) pulses.length = 120;

      nodes.forEach((n) => {
        if (!reduce) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        const g = n.glow;
        if (g > 0.02) {
          const r = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18);
          r.addColorStop(0, `rgba(120, 255, 190, ${0.5 * g})`);
          r.addColorStop(1, "rgba(120, 255, 190, 0)");
          ctx.fillStyle = r;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${180 + 60 * g}, 255, ${210 - 20 * g}, ${0.25 + 0.75 * g})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8 + 1.5 * g, 0, Math.PI * 2);
        ctx.fill();
        n.glow *= 0.95;
      });

      raf = requestAnimationFrame(tick);
    };

    build();
    tick();
    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, []);

  return <canvas ref={ref} className="field" aria-hidden="true" />;
}

// Cycles through short descriptors under the name, typed out letter by letter.
function Typer({ words }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const word = words[i % words.length];
    const done = !del && text === word;
    const empty = del && text === "";
    const id = setTimeout(
      () => {
        if (done) setDel(true);
        else if (empty) { setDel(false); setI(i + 1); }
        else setText(word.slice(0, text.length + (del ? -1 : 1)));
      },
      done ? 1800 : del ? 35 : 70
    );
    return () => clearTimeout(id);
  }, [text, del, i, words]);

  return <span className="typer">{text}<span className="caret">▍</span></span>;
}

// Fades sections in as they scroll into view.
function Reveal({ children }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${seen ? "in" : ""}`}>{children}</div>;
}

const research = [
  {
    tag: "01",
    title: "Social competence",
    body: "How the brain supports reading and responding to others, and what changes when that ability is disrupted.",
  },
  {
    tag: "02",
    title: "Prosocial decisions",
    body: "The circuits behind choosing to help another animal, and how those choices weigh cost against benefit.",
  },
  {
    tag: "03",
    title: "Neural recordings",
    body: "Linking activity in defined cell populations to moment-by-moment social behavior.",
  },
];

const toolkit = [
  "Cre mouse lines",
  "AAV circuit tracing",
  "Optogenetics",
  "SLEAP pose estimation",
  "Python",
  "HPC (HiPerGator)",
];

export default function App() {
  return (
    <>
      <NeuralField />
      <div className="vignette" aria-hidden="true" />

      <header className="nav">
        <span className="mono">EOA</span>
        <nav>
          <a href="#research">Research</a>
          <a href="#toolkit">Toolkit</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="mono eyebrow">Neuroscience PhD · University of Florida</p>
          <h1>
            Edgar<br />
            <em>Ocasio-Arce</em>
          </h1>
          <p className="lede">
            I study <Typer words={["social behavior", "prosocial choice", "neural circuits", "how mice help each other"]} />
          </p>
          <p className="sub">Padilla-Coreano Lab · Gainesville, FL</p>
          <a className="scroll mono" href="#research">scroll ↓</a>
        </section>

        <section id="research">
          <Reveal>
            <h2><span className="mono num">§1</span> Research</h2>
            <div className="cards">
              {research.map((r) => (
                <article className="card" key={r.tag}>
                  <span className="mono num">{r.tag}</span>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <section id="toolkit">
          <Reveal>
            <h2><span className="mono num">§2</span> Toolkit</h2>
            <ul className="chips">
              {toolkit.map((t) => <li key={t} className="mono">{t}</li>)}
            </ul>
          </Reveal>
        </section>

        <section id="contact">
          <Reveal>
            <h2><span className="mono num">§3</span> Contact</h2>
            <p className="contact-line">Want to talk science, code, or collaboration?</p>
            <div className="links">
              <a className="btn" href="https://github.com/edjavi120">GitHub →</a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mono">© {new Date().getFullYear()} Edgar Ocasio-Arce</footer>
    </>
  );
}
