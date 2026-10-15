import { PLACEHOLDER_CLOSE_RATE, PRESETS, SLOW_LOSS, SPEND, type IndustryKey } from "@/data/benchmarks"
import { SLOW_SITE_LEAK } from "@/data/site"
import { approxAud, aud, count, funnel, payPerBookingFee } from "@/lib/funnel"

/**
 * Everything on the home page that moves: the headline fit, scroll-lit words,
 * header tone, reveal-on-scroll, the calculator and its flow of dots, the
 * package buttons and the enquiry form. The markup is server-rendered by the
 * home components; this wires it up by element id.
 *
 * Returns a cleanup that removes every listener, observer, timer and frame,
 * so React's double effects in development don't stack two copies.
 */
export function initHome(): () => void {
  const ac = new AbortController()
  const { signal } = ac
  const cleanups: (() => void)[] = [() => ac.abort()]
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches

  // ---- Hero type sized to the column, capped ----
  function fitAll() {
    document.querySelectorAll<HTMLElement>("[data-fit]").forEach((group) => {
      const lines = [...group.querySelectorAll<HTMLElement>(".mega")]
      lines.forEach((l) => { l.style.fontSize = "100px" })
      const avail = group.clientWidth
      const widest = Math.max(...lines.map((l) => (l.firstElementChild as HTMLElement).getBoundingClientRect().width))
      if (!avail || !widest) return
      const size = Math.min(parseFloat(group.dataset.max ?? "") || Infinity, ((100 * avail) / widest) * 0.995)
      lines.forEach((l) => { l.style.fontSize = size + "px" })
    })
  }

  // ---- Statement: words darken as you scroll ----
  const scrolly = document.querySelector<HTMLElement>(".scrolly")
  const words = [...document.querySelectorAll<HTMLElement>(".scrolly .w")]
  function lightWords() {
    if (!scrolly) return
    if (reduce) { words.forEach((w) => w.classList.add("on")); return }
    const r = scrolly.getBoundingClientRect()
    const vh = innerHeight
    const p = Math.max(0, Math.min(1, (vh * 0.82 - r.top) / (r.height + vh * 0.3)))
    const n = Math.round(p * words.length)
    words.forEach((w, i) => w.classList.toggle("on", i < n))
  }
  const head = document.querySelector<HTMLElement>(".head")
  const nights = [...document.querySelectorAll<HTMLElement>(".night")]
  function headTone() {
    if (!head) return
    const y = head.getBoundingClientRect().bottom - 10
    head.classList.toggle("dark", nights.some((n) => { const r = n.getBoundingClientRect(); return r.top <= y && r.bottom >= y }))
  }
  let ticking = false
  addEventListener("scroll", () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => { lightWords(); headTone(); ticking = false })
  }, { passive: true, signal })

  const reveals = document.querySelectorAll<HTMLElement>(".rv")
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } }), { rootMargin: "0px 0px -8% 0px" })
    reveals.forEach((el) => io.observe(el))
    cleanups.push(() => io.disconnect())
  } else reveals.forEach((el) => el.classList.add("in"))

  // ---- The calculator. Every input is a published benchmark or the visitor's own number. ----
  const S = { spend: SPEND.start, cpc: PRESETS.svc.cpc, cr: PRESETS.svc.cr, close: PLACEHOLDER_CLOSE_RATE, job: 0, slow: true, ownClose: false }
  const model = (slow: boolean) => funnel(S, slow)

  function renderModel() {
    const m = model(S.slow)
    const fast = model(false)
    const cpa = m.costPerClient ? approxAud(m.costPerClient) : "—"
    $("oCpa").textContent = cpa
    $("chipCpa").textContent = cpa
    $("oBasis").textContent = S.ownClose ? `At your ${S.close}% close rate.` : `At a placeholder ${PLACEHOLDER_CLOSE_RATE}% close rate. Put in yours below.`
    $("spendOut").textContent = aud(S.spend)
    $("spoutSpend").textContent = aud(S.spend) + "/mo"
    $("oClicks").textContent = Math.round(m.clicks).toLocaleString("en-AU")
    $("oEnq").textContent = count(m.enquiries)
    $("oBook").textContent = m.booked.toFixed(1)
    const pw = $("pWork")
    if (S.job > 0) {
      const b = document.createElement("b")
      b.textContent = "about " + approxAud(m.work)
      pw.replaceChildren("Booked work a month: ", b)
    } else pw.textContent = "Add your average job to see the work this books."
    $("nLeave").textContent = Math.round(100 - S.cr) + "%"
    $("nEnq").textContent = count(m.enquiries)
    $("nClose").textContent = S.close + "%"
    $("oDelta").textContent = S.slow
      ? `With a fast site: about ${fast.costPerClient ? approxAud(fast.costPerClient) : "—"} per client and ${(fast.booked - m.booked).toFixed(1)} more bookings a month`
      : "Fast site: no clicks lost to load time."
    $("ppbEst").textContent = `At the calculator's numbers: about ${approxAud(payPerBookingFee(m.booked))}/mo`
    const leak = $("speedLeak")
    leak.setAttribute("aria-pressed", S.slow ? "false" : "true")
    ;(leak.querySelector(".lk-fix") as HTMLElement).textContent = S.slow ? "Tap to fix: a fast site" : "Fixed: loads in under 3 seconds"
    $("speedLost").textContent = S.slow ? `−${Math.round(m.lost)} clicks a month` : "Fixed"
    $("lostTot").textContent = String(Math.round(m.lost))
    $("trayCount").textContent = m.booked.toFixed(1)
  }

  const industry = $<HTMLSelectElement>("ind")
  industry.addEventListener("change", () => {
    const p = PRESETS[industry.value as IndustryKey]
    if (p) {
      S.cpc = p.cpc
      S.cr = p.cr
      $<HTMLInputElement>("cpc").value = String(p.cpc)
      $<HTMLInputElement>("cr").value = String(p.cr)
    }
    renderModel()
  }, { signal })
  $<HTMLInputElement>("spend").addEventListener("input", (e) => { S.spend = +(e.target as HTMLInputElement).value; renderModel() }, { signal })
  const limits: [keyof typeof S & ("cpc" | "cr" | "close" | "job"), number, number][] = [["cpc", 0.1, 1000], ["cr", 0.1, 100], ["close", 1, 100], ["job", 0, 10_000_000]]
  for (const [id, min, max] of limits) {
    $<HTMLInputElement>(id).addEventListener("input", (e) => {
      const raw = (e.target as HTMLInputElement).value.trim()
      if (id === "job" && raw === "") { S.job = 0; renderModel(); return }
      const v = parseFloat(raw)
      if (!(v >= min && v <= max)) return
      S[id] = v
      if (id === "cpc" || id === "cr") industry.value = "custom"
      if (id === "close") S.ownClose = true
      renderModel()
    }, { signal })
  }

  // ---- The flow of dots: one dot per click, sped up ----
  const mach = $("mach")
  const cv = $<HTMLCanvasElement>("sim")
  const ctx = cv.getContext("2d") as CanvasRenderingContext2D
  const css = getComputedStyle(document.documentElement)
  const C = { orange: css.getPropertyValue("--orange").trim(), hi: css.getPropertyValue("--orange-hi").trim(), muted: css.getPropertyValue("--teal-muted").trim() }
  type Box = { x: number; y: number; w: number; h: number }
  type Dot = { x: number; y: number; vy: number; st: 0 | 1 | 2 | 3; stage: number; fate: "lost" | "leave" | null; ty: number; a: number; sx?: number; sy?: number; dead?: boolean }
  let G: { W: number; H: number; corrL: number; corrR: number; srcY: number; stages: Box[]; tray: Box; leakY: number; slots: { x: number; y: number }[] } | null = null
  let dots: Dot[] = []
  let landed: { x: number; y: number }[] = []
  let reserved = 0
  let acc = 0
  let warming = false
  let running = !reduce
  let visible = true

  function measure() {
    const mr = mach.getBoundingClientRect()
    const W = mach.clientWidth
    const H = mach.clientHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    cv.style.width = W + "px"
    cv.style.height = H + "px"
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const rel = (el: Element): Box => { const r = el.getBoundingClientRect(); return { x: r.left - mr.left, y: r.top - mr.top, w: r.width, h: r.height } }
    const corrs = [...mach.querySelectorAll(".m-corr")].map(rel)
    const src = corrs[0]
    const tray = rel($("tray"))
    const stages = [...mach.querySelectorAll(".m-stage")].map(rel)
    const leakR = rel($("speedLeak"))
    const step = 10
    const cols = Math.max(4, Math.floor((tray.w - 16) / step))
    const rows = Math.max(3, Math.floor((tray.h - 34) / step))
    const offX = tray.x + (tray.w - cols * step) / 2 + step / 2
    const slots: { x: number; y: number }[] = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push({ x: offX + c * step, y: tray.y + tray.h - 9 - r * step })
    G = { W, H, corrL: corrs[1].x, corrR: corrs[1].x + corrs[1].w, srcY: src.y + src.h, stages, tray, leakY: leakR.y + leakR.h / 2, slots }
  }
  function spawn() {
    if (!G) return
    const w = G.corrR - G.corrL
    dots.push({ x: G.corrL + 7 + Math.random() * (w - 14), y: G.srcY - 4, vy: 0.9 + Math.random() * 0.5, st: 0, stage: -1, fate: null, ty: 0, a: 1 })
  }
  function fadeY(i: number) { const s = (G as NonNullable<typeof G>).stages[i]; return s.y + 14 + Math.random() * Math.max(10, s.h - 28) }
  function decide(d: Dot, i: number) {
    if (i === 0) {
      if (S.slow && Math.random() < SLOW_LOSS) { d.fate = "lost"; d.ty = (G as NonNullable<typeof G>).leakY; return }
      if (Math.random() < S.cr / 100) { d.fate = null; return }
      d.fate = "leave"; d.ty = fadeY(0); return
    }
    if (Math.random() < S.close / 100) { d.fate = null; return }
    d.fate = "leave"; d.ty = fadeY(1)
  }
  function onLanded() {
    if (!G || landed.length < G.slots.length) return
    landed = []
    reserved = 0
    if (!warming) { const t = $("tray"); t.classList.remove("full"); void t.offsetWidth; t.classList.add("full") }
  }
  function step(dt: number) {
    if (!G) return
    const k = dt / 16.67
    const rate = Math.min(14, Math.max(4, (S.spend / 1500) * 8))
    acc += (rate * dt) / 1000
    while (acc >= 1) { spawn(); acc -= 1 }
    for (const d of dots) {
      if (d.st === 0) {
        d.y += d.vy * k * 1.7
        d.x += (Math.random() - 0.5) * 0.7 * k
        d.x = Math.max(G.corrL + 5, Math.min(G.corrR - 5, d.x))
        for (let i = d.stage + 1; i < G.stages.length; i++) { if (d.y >= G.stages[i].y) { d.stage = i; decide(d, i) } else break }
        if (d.fate === "lost" && d.y >= d.ty) { d.st = 1; d.y = d.ty }
        else if (d.fate === "leave" && d.y >= d.ty) d.st = 2
        else if (!d.fate && d.y >= G.tray.y + 20) { d.st = 3; const s = G.slots[reserved % G.slots.length]; reserved++; d.sx = s.x; d.sy = s.y }
      } else if (d.st === 1) {
        if (d.x > G.corrL - 14) d.x -= 2.4 * k
        else { d.vy += 0.14 * k; d.y += d.vy * k; d.a -= 0.01 * k }
        if (d.a <= 0 || d.y > G.H - 4) d.dead = true
      } else if (d.st === 2) {
        d.a -= 0.03 * k; d.y += 0.25 * k; if (d.a <= 0) d.dead = true
      } else {
        const e = Math.min(1, 0.2 * k)
        const sx = d.sx as number, sy = d.sy as number
        d.x += (sx - d.x) * e; d.y += (sy - d.y) * e
        if (Math.abs(sx - d.x) < 0.6 && Math.abs(sy - d.y) < 0.6) { d.dead = true; landed.push({ x: sx, y: sy }); onLanded() }
      }
    }
    dots = dots.filter((d) => !d.dead)
  }
  function circle(x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832) }
  function draw() {
    if (!G) return
    ctx.clearRect(0, 0, G.W, G.H)
    ctx.strokeStyle = "rgba(255,255,255,.85)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    if (S.slow) { ctx.moveTo(G.corrL, G.srcY); ctx.lineTo(G.corrL, G.leakY - 12); ctx.moveTo(G.corrL, G.leakY + 12); ctx.lineTo(G.corrL, G.tray.y) }
    else { ctx.moveTo(G.corrL, G.srcY); ctx.lineTo(G.corrL, G.tray.y) }
    ctx.moveTo(G.corrR, G.srcY); ctx.lineTo(G.corrR, G.tray.y)
    ctx.stroke()
    if (!S.slow) { ctx.fillStyle = C.orange; ctx.fillRect(G.corrL - 3, G.leakY - 14, 6, 28) }
    else { ctx.strokeStyle = C.hi; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(G.corrL - 4, G.leakY - 5); ctx.lineTo(G.corrL - 10, G.leakY); ctx.lineTo(G.corrL - 4, G.leakY + 5); ctx.stroke() }
    ctx.fillStyle = C.orange
    for (const l of landed) { circle(l.x, l.y, 3.4); ctx.fill() }
    for (const d of dots) {
      ctx.globalAlpha = Math.max(0, d.st === 2 ? d.a * 0.55 : d.a)
      ctx.fillStyle = d.st === 1 ? C.muted : d.st === 3 ? C.orange : "#FFFFFF"
      circle(d.x, d.y, 3.1); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
  function prewarm() {
    dots = []; landed = []; reserved = 0; acc = 0
    warming = true
    for (let i = 0; i < 520; i++) step(16.67)
    warming = false
  }
  $("speedLeak").addEventListener("click", () => { S.slow = !S.slow; renderModel(); if (!running) { prewarm(); draw() } }, { signal })

  let last = performance.now()
  let frameId = 0
  function frame(now: number) {
    const dt = Math.min(48, now - last)
    last = now
    if (running && visible && G) { step(dt); draw() }
    frameId = requestAnimationFrame(frame)
  }
  function rebuild() { fitAll(); measure(); prewarm(); draw(); lightWords(); headTone() }
  const pause = $("pause")
  pause.addEventListener("click", () => {
    running = !running
    pause.textContent = running ? "Pause" : "Play"
    pause.setAttribute("aria-pressed", running ? "false" : "true")
  }, { signal })
  if (!running) { pause.textContent = "Play"; pause.setAttribute("aria-pressed", "true") }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting })
    io.observe(mach)
    cleanups.push(() => io.disconnect())
  }
  let rt: ReturnType<typeof setTimeout> | undefined
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(rebuild, 120) }, { signal })
  cleanups.push(() => clearTimeout(rt))
  if (document.fonts?.ready) void document.fonts.ready.then(() => { if (!signal.aborted) rebuild() })
  renderModel()
  rebuild()
  frameId = requestAnimationFrame(frame)
  cleanups.push(() => cancelAnimationFrame(frameId))

  // ---- Packages to form ----
  let tt: ReturnType<typeof setTimeout> | undefined
  function toast(msg: string) {
    $("toastText").textContent = msg
    $("toast").hidden = false
    clearTimeout(tt)
    tt = setTimeout(() => { $("toast").hidden = true }, 4200)
  }
  cleanups.push(() => clearTimeout(tt))
  document.querySelectorAll<HTMLElement>("[data-pick]").forEach((b) => b.addEventListener("click", () => {
    $<HTMLSelectElement>("f-pkg").value = b.dataset.pick ?? ""
    toast(b.dataset.pick + " is on your enquiry.")
  }, { signal }))

  // ---- Magnetic buttons (mouse only, subtle) ----
  if (finePointer && !reduce) {
    document.querySelectorAll<HTMLElement>(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect()
        el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.12}px,${(e.clientY - (r.top + r.height / 2)) * 0.16}px)`
      }, { signal })
      el.addEventListener("pointerleave", () => { el.style.transform = "" }, { signal })
    })
  }

  // ---- Enquiry form: sends to /api/enquiry with the calculator inputs attached ----
  const form = $<HTMLFormElement>("enq")
  let busy = false
  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    if (busy) return
    const v = (id: string) => $<HTMLInputElement>(id).value.trim()
    const missing: string[] = []
    if (!v("f-name")) missing.push("your name")
    if (!v("f-biz")) missing.push("your business")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("f-email"))) missing.push("an email we can reply to")
    const err = $("formError")
    if (missing.length) { err.hidden = false; err.textContent = "Please add " + missing.join(", ") + "."; return }
    err.hidden = true
    const leaks = (S.slow ? [SLOW_SITE_LEAK as string] : []).concat([...document.querySelectorAll<HTMLInputElement>(".r-card input:checked")].map((i) => i.dataset.name ?? ""))
    const body = {
      name: v("f-name"), business: v("f-biz"), email: v("f-email"), website: v("f-site"),
      package: v("f-pkg"), budget: v("f-budget"), message: v("f-msg"), leaks,
      calculator: { industry: industry.value, spend: S.spend, cpc: S.cpc, cr: S.cr, close: S.close, ownClose: S.ownClose, job: S.job, slow: S.slow },
      hp: v("f-hp"),
    }
    const btn = form.querySelector("button[type=submit]") as HTMLButtonElement
    busy = true
    btn.disabled = true
    let status = 0
    let message = ""
    try {
      const res = await fetch("/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      status = res.status
      if (!res.ok) message = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? ""
    } catch {
      status = 0
    }
    busy = false
    btn.disabled = false
    if (status >= 200 && status < 300) {
      const first = v("f-name").split(/\s+/)[0]
      $("sentName").textContent = first ? ", " + first : ""
      form.querySelectorAll<HTMLElement>(".fld, .send-row").forEach((el) => { el.hidden = true })
      $("sent").hidden = false
      $("sent").focus()
      return
    }
    err.hidden = false
    err.textContent = status === 429 ? "Too many enquiries from this connection. Please try again in an hour."
      : status === 400 && message ? message
      : status === 400 ? "Something in the form didn't look right. Please check your details and try again."
      : "That didn't send. Please try again in a minute."
  }, { signal })

  return () => { for (const c of cleanups) c() }
}
