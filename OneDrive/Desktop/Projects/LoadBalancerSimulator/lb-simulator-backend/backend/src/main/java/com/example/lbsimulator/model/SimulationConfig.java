package com.example.lbsimulator.model;

public class SimulationConfig {
    private int requestsPerSec = 15;
    private String algorithm = "round-robin"; // round-robin | least-connections | random | weighted-round-robin | ip-hash
    private boolean stickySessions = false;
    private boolean retryEnabled = true;
    private int requestTimeoutMs = 5000;

    public int getRequestsPerSec() { return requestsPerSec; }
    public void setRequestsPerSec(int requestsPerSec) { this.requestsPerSec = requestsPerSec; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    public boolean isStickySessions() { return stickySessions; }
    public void setStickySessions(boolean stickySessions) { this.stickySessions = stickySessions; }
    public boolean isRetryEnabled() { return retryEnabled; }
    public void setRetryEnabled(boolean retryEnabled) { this.retryEnabled = retryEnabled; }
    public int getRequestTimeoutMs() { return requestTimeoutMs; }
    public void setRequestTimeoutMs(int requestTimeoutMs) { this.requestTimeoutMs = requestTimeoutMs; }
}
