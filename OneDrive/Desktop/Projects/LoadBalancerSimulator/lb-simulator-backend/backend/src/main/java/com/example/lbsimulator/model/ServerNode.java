package com.example.lbsimulator.model;

import java.util.concurrent.atomic.AtomicInteger;

public class ServerNode {
    public enum Status { HEALTHY, UNHEALTHY, RECOVERING }

    private final String id;
    private String name;
    private String region;
    private volatile Status status = Status.HEALTHY;
    private volatile int queueLength = 0;
    private volatile int processingMs;
    private volatile int capacity;
    private volatile int weight = 1;
    private final AtomicInteger totalCompleted = new AtomicInteger(0);
    private final AtomicInteger totalFailed = new AtomicInteger(0);

    public ServerNode(String id, String name, String region, int processingMs, int capacity) {
        this.id = id;
        this.name = name;
        this.region = region;
        this.processingMs = processingMs;
        this.capacity = capacity;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getQueueLength() { return queueLength; }
    public void setQueueLength(int queueLength) { this.queueLength = queueLength; }
    public int getProcessingMs() { return processingMs; }
    public void setProcessingMs(int processingMs) { this.processingMs = processingMs; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public int getWeight() { return weight; }
    public void setWeight(int weight) { this.weight = weight; }
    public int getTotalCompleted() { return totalCompleted.get(); }
    public void incrementCompleted() { totalCompleted.incrementAndGet(); }
    public int getTotalFailed() { return totalFailed.get(); }
    public void incrementFailed() { totalFailed.incrementAndGet(); }
}
