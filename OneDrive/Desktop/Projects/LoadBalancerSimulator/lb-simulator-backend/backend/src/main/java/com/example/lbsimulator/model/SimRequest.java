package com.example.lbsimulator.model;

public class SimRequest {
    private final long id;
    private final String clientId;
    private final long arrivalTimeMs;
    private final String priority; // "high" | "low"
    private String assignedServerId;
    private String stage = "generated";

    public SimRequest(long id, String clientId, long arrivalTimeMs, String priority) {
        this.id = id;
        this.clientId = clientId;
        this.arrivalTimeMs = arrivalTimeMs;
        this.priority = priority;
    }

    public long getId() { return id; }
    public String getClientId() { return clientId; }
    public long getArrivalTimeMs() { return arrivalTimeMs; }
    public String getPriority() { return priority; }
    public String getAssignedServerId() { return assignedServerId; }
    public void setAssignedServerId(String assignedServerId) { this.assignedServerId = assignedServerId; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
}
