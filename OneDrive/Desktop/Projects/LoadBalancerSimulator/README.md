# Distributed Load Balancer Simulator

An interactive simulator that visualizes how a load balancer routes traffic across
a fleet of servers — built to the outline you provided (React + TypeScript frontend,
Spring Boot backend, REST/WebSocket-ready, in-memory state).

```
lb-simulator/
├── frontend/    # React + TypeScript app — the full, working simulator
├── backend/     # Spring Boot REST reference implementation (see status below)
└── README.md
```

## How it's split, and why

The simulation (request generation, routing, queues, animation, failure injection,
analytics) is implemented **entirely in the frontend**, in a framework-agnostic
TypeScript engine (`frontend/src/simulation/engine.ts`). This is a deliberate
architectural choice, not a shortcut: the outline's real-time animation, sub-100ms
queue updates, and instant "change the dropdown → watch routing change" interactions
need a tight client-side loop. A network round trip per tick would make the
animation stutter. This is also how most interview-demo simulators of this kind are
actually built in practice.

The **Spring Boot backend** (`backend/`) is a separate, standalone REST service that
implements the same core load-balancing logic (round robin, least connections,
weighted round robin, IP hash, sticky sessions) against its own in-memory server
list, with `/api/simulation/*` endpoints for start/pause/reset, config, and server
management. It is not wired into the frontend UI — doing that well would mean
replacing the frontend's local tick loop with polling or a WebSocket feed, which
would change the animation model. Treat it as a working reference implementation
of the backend half of the stack, and a starting point if you want to move the
simulation server-side later. `frontend/vite.config.ts` has a commented-out proxy
entry to make that wiring easier when you're ready.

### Backend status — please read

**I was not able to compile or run the Spring Boot backend in the environment I
used to build this** — it only has network access to npm/PyPI/GitHub, not Maven
Central, and no `javac`/`mvn` were installed. The frontend, by contrast, was
installed, type-checked (`tsc -b`), and production-built successfully — I'm
confident in it. The backend code follows standard, common Spring Boot 3 /
Java 17 patterns and I've reviewed it carefully, but I can't personally verify it
compiles cleanly on your machine the way I could verify the frontend. Please
build it locally (`mvn spring-boot:run`) and treat the first build as a normal
"check it compiles" step, the way you would for any new codebase.

## Running the frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

`npm run build` produces a production bundle in `frontend/dist/` (already verified
to build cleanly).

## Running the backend

```bash
cd backend
mvn spring-boot:run     # http://localhost:8080
```

Key endpoints: `POST /api/simulation/start|pause|reset`, `GET/PUT /api/simulation/config`,
`GET/POST /api/simulation/servers`, `POST /api/simulation/servers/{id}/kill|recover`,
`GET /api/simulation/logs`.

## Feature coverage vs. the outline

**Fully implemented (frontend simulator):**
- Request generator with requests/sec slider, Constant / Burst / Random load patterns
- Multiple servers with queue, simulated CPU/memory, completed/failed counters
- All 7 algorithms: Round Robin, Least Connections, Least Response Time, Random,
  Weighted Round Robin, IP Hash, Weighted Least Connections — switch live
- Animated request "packets" flowing Generator → Load Balancer → Server
- Per-request inspection: click any packet for its full lifecycle timeline
- Kill Server / Recover Server, with in-flight requests rerouting or retrying
- Add Server (rebalances automatically since the algorithm re-evaluates every tick)
- Health states: Healthy, Unhealthy, Recovering, Circuit Open, Circuit Half-Open
- Queue visualization (per-server bar) and a CPU/memory heat map (color-coded cards)
- Adjustable per-server processing time, capacity, and weight (live sliders)
- Auto scaling: adds a server when average CPU > 80% (sustained, capped at 8 servers)
- Sticky sessions toggle (client → server pinning)
- Request priority (a subset of simulated clients are tagged VIP/high priority and
  are processed first)
- Retry logic (failed/timed-out requests requeue up to 3x when enabled)
- Circuit breaker (opens after repeated failures, half-opens after a cooldown to
  test recovery, closes on success)
- Rate limiting (per-client requests/sec cap → simulated 429s in the log)
- Request timeout (configurable; timed-out requests are logged and counted)
- Live logging panel, with a "replay last 40 events" playback control
- Analytics dashboard: requests/sec, total/failed/retried, avg response time,
  throughput, queue length, active servers, current algorithm, plus trend charts
- Controls panel covering start/pause/reset, algorithm, rate slider, add server,
  auto scaling / sticky sessions / retry toggles
- Compare Algorithms: runs two isolated headless simulations at your current
  traffic settings and compares average response time, completed, and failed counts

**Implemented with a simplified model** (called out here so nothing is presented
as more complete than it is):
- **Geographic routing**: servers and simulated clients each have a region
  (Asia/Europe/America); the router prefers same-region healthy servers before
  applying the selected algorithm. There's no real network simulation — "latency"
  per server is a fixed illustrative number, not a modeled RTT.
- **Weighted algorithms**: weights are a live per-server slider (1–10) that feed
  directly into Weighted Round Robin and Weighted Least Connections.

**Not implemented:**
- WebSocket streaming (the outline lists this as a later-phase upgrade over REST;
  the frontend doesn't need it since simulation state lives client-side, and the
  backend currently exposes REST only)
- Persistent logging to PostgreSQL (outline marks this optional; state is in-memory
  in both frontend and backend, which matches the "in-memory for the prototype" option)
- A dedicated "Replay Mode" that reruns a full past session tick-by-tick — what's
  built instead is a lightweight replay of the last 40 log lines, which was a more
  honest scope for the time available. Every request's own lifecycle is fully
  replayable via the click-to-inspect timeline, though.

## Design notes

The visual language leans into what the subject actually is — an operations/
monitoring dashboard — rather than a generic marketing-site look: a dark
near-black canvas, monospace (IBM Plex Mono) for data and metrics, Space Grotesk
for headings, and a single signature cyan accent used consistently for "data in
motion" (the animated packets), with status colors (green/amber/red/blue) reserved
strictly for server health, never used decoratively.

## Known simplifications / things to verify yourself

- The engine simulates CPU/memory/latency; these are illustrative numbers derived
  from queue pressure, not real measurements.
- Random elements (transient failure chance, burst timing, client selection) mean
  two runs with identical settings won't produce byte-identical numbers — that's
  expected for a simulator.
- The backend's algorithm implementations mirror the frontend's logic but were
  written and reviewed, not test-executed, in this environment (see "Backend
  status" above). Please run your own tests before relying on it.
