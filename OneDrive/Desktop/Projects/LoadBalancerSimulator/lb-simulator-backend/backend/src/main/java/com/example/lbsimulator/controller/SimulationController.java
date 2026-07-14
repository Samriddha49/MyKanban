package com.example.lbsimulator.controller;

import com.example.lbsimulator.model.ServerNode;
import com.example.lbsimulator.model.SimulationConfig;
import com.example.lbsimulator.service.SimulationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/start")
    public void start() { simulationService.start(); }

    @PostMapping("/pause")
    public void pause() { simulationService.pause(); }

    @PostMapping("/reset")
    public void reset() { simulationService.reset(); }

    @GetMapping("/config")
    public SimulationConfig getConfig() { return simulationService.getConfig(); }

    @PutMapping("/config")
    public void updateConfig(@RequestBody SimulationConfig config) { simulationService.updateConfig(config); }

    @GetMapping("/servers")
    public List<ServerNode> getServers() { return simulationService.getServers(); }

    @PostMapping("/servers")
    public ServerNode addServer(@RequestBody(required = false) Map<String, String> body) {
        String region = body != null && body.containsKey("region") ? body.get("region") : "asia";
        return simulationService.addServer(region);
    }

    @DeleteMapping("/servers/{id}")
    public void removeServer(@PathVariable String id) { simulationService.removeServer(id); }

    @PostMapping("/servers/{id}/kill")
    public void killServer(@PathVariable String id) { simulationService.killServer(id); }

    @PostMapping("/servers/{id}/recover")
    public void recoverServer(@PathVariable String id) { simulationService.recoverServer(id); }

    @GetMapping("/logs")
    public List<String> getLogs() { return simulationService.getLogs(); }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "simClockMs", simulationService.getSimClockMs(),
                "serverCount", simulationService.getServers().size()
        );
    }
}
