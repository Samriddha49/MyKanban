package com.example.lbsimulator.service;

import com.example.lbsimulator.model.ServerNode;
import com.example.lbsimulator.model.SimRequest;
import com.example.lbsimulator.model.SimulationConfig;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory, single-instance reference implementation of the load-balancing logic
 * described in the project outline. Runs a scheduled "tick" similar in spirit to the
 * frontend's SimulationEngine (see frontend/src/simulation/engine.ts), but this copy
 * is independent and is the one exercised by the REST API in SimulationController.
 *
 * NOTE: this class has not been compiled/run in the sandbox used to build this project
 * (no Maven Central access there) — see README.md "Backend status" section. Review it
 * as you would any freshly generated code before relying on it.
 */
@Service
public class SimulationService {

    private final List<ServerNode> servers = new CopyOnWriteArrayList<>();
    private final Deque<SimRequest> pending = new ArrayDeque<>();
    private final List<String> logs = new CopyOnWriteArrayList<>();
    private final Map<String, String> stickyMap = new ConcurrentHashMap<>();

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicLong requestIdSeq = new AtomicLong(1);
    private final AtomicLong serverIdSeq = new AtomicLong(1);
    private final AtomicInteger rrPointer = new AtomicInteger(0);
    private volatile SimulationConfig config = new SimulationConfig();
    private volatile long simClockMs = 0;
    private double genAccumulator = 0;

    public SimulationService() {
        servers.add(new ServerNode(nextServerId(), "Server A", "asia", 80, 120));
        servers.add(new ServerNode(nextServerId(), "Server B", "europe", 150, 100));
        servers.add(new ServerNode(nextServerId(), "Server C", "america", 110, 100));
    }

    private String nextServerId() {
        return "srv-" + serverIdSeq.getAndIncrement();
    }

    // ---------- control endpoints ----------

    public void start() { running.set(true); log("Simulation started."); }
    public void pause() { running.set(false); log("Simulation paused."); }

    public synchronized void reset() {
        running.set(false);
        simClockMs = 0;
        genAccumulator = 0;
        pending.clear();
        logs.clear();
        stickyMap.clear();
        servers.clear();
        servers.add(new ServerNode(nextServerId(), "Server A", "asia", 80, 120));
        servers.add(new ServerNode(nextServerId(), "Server B", "europe", 150, 100));
        servers.add(new ServerNode(nextServerId(), "Server C", "america", 110, 100));
        log("Simulation reset.");
    }

    public SimulationConfig getConfig() { return config; }

    public void updateConfig(SimulationConfig patch) {
        this.config = patch;
        log("Config updated: algorithm=" + patch.getAlgorithm() + " rps=" + patch.getRequestsPerSec());
    }

    public List<ServerNode> getServers() { return servers; }

    public ServerNode addServer(String region) {
        ServerNode s = new ServerNode(nextServerId(), "Server " + (servers.size() + 1), region, 100, 100);
        servers.add(s);
        log(s.getName() + " added (" + region + ").");
        return s;
    }

    public void removeServer(String id) {
        servers.removeIf(s -> s.getId().equals(id));
        log("Server " + id + " removed.");
    }

    public void killServer(String id) {
        find(id).ifPresent(s -> {
            s.setStatus(ServerNode.Status.UNHEALTHY);
            log(s.getName() + " killed.");
        });
    }

    public void recoverServer(String id) {
        find(id).ifPresent(s -> {
            s.setStatus(ServerNode.Status.HEALTHY);
            log(s.getName() + " recovered.");
        });
    }

    public List<String> getLogs() { return logs; }

    public long getSimClockMs() { return simClockMs; }

    private java.util.Optional<ServerNode> find(String id) {
        return servers.stream().filter(s -> s.getId().equals(id)).findFirst();
    }

    private void log(String text) {
        logs.add("[" + (simClockMs / 1000.0) + "s] " + text);
        if (logs.size() > 300) logs.remove(0);
    }

    // ---------- simulation tick ----------

    private static final long TICK_MS = 200;

    @Scheduled(fixedRate = TICK_MS)
    public void tick() {
        if (!running.get()) return;
        simClockMs += TICK_MS;

        genAccumulator += (config.getRequestsPerSec() * TICK_MS) / 1000.0;
        while (genAccumulator >= 1) {
            spawnRequest();
            genAccumulator -= 1;
        }

        assignPending();
        processServers();
    }

    private void spawnRequest() {
        String clientId = "client-" + (1 + (int) (Math.random() * 14));
        String priority = clientId.equals("client-1") || clientId.equals("client-4") ? "high" : "low";
        SimRequest r = new SimRequest(requestIdSeq.getAndIncrement(), clientId, simClockMs, priority);
        pending.add(r);
    }

    private List<ServerNode> healthyServers() {
        List<ServerNode> out = new ArrayList<>();
        for (ServerNode s : servers) {
            if (s.getStatus() == ServerNode.Status.HEALTHY || s.getStatus() == ServerNode.Status.RECOVERING) {
                out.add(s);
            }
        }
        return out;
    }

    private void assignPending() {
        List<ServerNode> healthy = healthyServers();
        if (healthy.isEmpty()) return;

        while (!pending.isEmpty()) {
            SimRequest r = pending.poll();
            ServerNode chosen = pickServer(r, healthy);
            if (chosen == null) break;
            r.setAssignedServerId(chosen.getId());
            r.setStage("queued");
            chosen.setQueueLength(chosen.getQueueLength() + 1);
            log("Request #" + r.getId() + " -> " + chosen.getName());
            // NOTE: this reference implementation tracks queue length only (not full
            // per-request lifecycle/processing timers). Extend here if you wire this
            // backend up as the simulation's source of truth instead of the frontend engine.
            scheduleCompletion(chosen);
        }
    }

    private void scheduleCompletion(ServerNode server) {
        // Simplified: complete one queued request after its processing time elapses.
        new Thread(() -> {
            try {
                Thread.sleep(server.getProcessingMs());
            } catch (InterruptedException ignored) {
            }
            if (server.getQueueLength() > 0) {
                server.setQueueLength(server.getQueueLength() - 1);
                server.incrementCompleted();
            }
        }).start();
    }

    private void processServers() {
        // Placeholder for periodic bookkeeping (e.g. health-check transitions,
        // circuit-breaker timers). Kept intentionally minimal here — see
        // README.md for which advanced features are implemented on the
        // frontend engine only vs. this backend reference implementation.
    }

    private ServerNode pickServer(SimRequest r, List<ServerNode> healthy) {
        if (config.isStickySessions()) {
            String sticky = stickyMap.get(r.getClientId());
            if (sticky != null) {
                for (ServerNode s : healthy) if (s.getId().equals(sticky)) return s;
            }
        }

        ServerNode chosen;
        switch (config.getAlgorithm()) {
            case "least-connections":
                chosen = healthy.stream().min((a, b) -> Integer.compare(a.getQueueLength(), b.getQueueLength())).orElse(null);
                break;
            case "random":
                chosen = healthy.get((int) (Math.random() * healthy.size()));
                break;
            case "weighted-round-robin": {
                int total = healthy.stream().mapToInt(ServerNode::getWeight).sum();
                int idx = rrPointer.getAndIncrement() % Math.max(1, total);
                int acc = 0;
                chosen = healthy.get(0);
                for (ServerNode s : healthy) {
                    acc += s.getWeight();
                    if (idx < acc) { chosen = s; break; }
                }
                break;
            }
            case "ip-hash": {
                int idx = Math.abs(r.getClientId().hashCode()) % healthy.size();
                chosen = healthy.get(idx);
                break;
            }
            case "round-robin":
            default:
                int idx = rrPointer.getAndIncrement() % healthy.size();
                chosen = healthy.get(idx);
        }

        if (config.isStickySessions() && chosen != null) {
            stickyMap.put(r.getClientId(), chosen.getId());
        }
        return chosen;
    }
}
