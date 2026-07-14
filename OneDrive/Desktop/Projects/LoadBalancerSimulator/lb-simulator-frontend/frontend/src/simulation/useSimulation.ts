import { useCallback, useEffect, useRef, useState } from 'react';
import { EngineSnapshot, SimulationEngine } from './engine';
import { Algorithm, Region, SimulationConfig } from '../types';

const TICK_MS = 100;

export function useSimulation() {
  const engineRef = useRef<SimulationEngine>(new SimulationEngine());
  const [snapshot, setSnapshot] = useState<EngineSnapshot>(() => engineRef.current.snapshot());
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const engine = engineRef.current;
    const interval = setInterval(() => {
      engine.running = running;
      if (running) engine.tick(TICK_MS);
      setSnapshot(engine.snapshot());
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    engineRef.current.reset();
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const setAlgorithm = useCallback((algo: Algorithm) => {
    engineRef.current.setAlgorithm(algo);
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const updateConfig = useCallback((patch: Partial<SimulationConfig>) => {
    engineRef.current.updateConfig(patch);
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const addServer = useCallback((region?: Region) => {
    engineRef.current.addServer(region);
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const removeServer = useCallback((id: string) => {
    engineRef.current.removeServer(id);
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const killServer = useCallback((id: string) => {
    engineRef.current.killServer(id);
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const recoverServer = useCallback((id: string) => {
    engineRef.current.recoverServer(id);
    setSnapshot(engineRef.current.snapshot());
  }, []);

  const updateServer = useCallback(
    (id: string, patch: Parameters<SimulationEngine['updateServer']>[1]) => {
      engineRef.current.updateServer(id, patch);
      setSnapshot(engineRef.current.snapshot());
    },
    []
  );

  return {
    snapshot,
    running,
    config: engineRef.current.config,
    start,
    pause,
    reset,
    setAlgorithm,
    updateConfig,
    addServer,
    removeServer,
    killServer,
    recoverServer,
    updateServer,
  };
}
