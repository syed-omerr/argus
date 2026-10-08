/**
 * Types and definitions for the ARGUS Surveillance and Intelligence System
 */

export type ArgusState = 'dormant' | 'awakening' | 'active';

export interface EyeCoordinate {
  id: number;
  label: string;
  region: string;
  cx: number; // percentage 0-100 relative to globe center
  cy: number; // percentage 0-100 relative to globe center
  radius: number; // relative size
  rotation?: number; // tilt angle
  lookX: number; // gaze direction -1 to 1
  lookY: number; // gaze direction -1 to 1
  polygonPoints: string; // cutout border
  delay: number; // awaken delay in ms
  status: 'active' | 'synced' | 'searching' | 'locked';
  anomalyScore: number;
  feedType: 'Optical' | 'Synthetic Aperture Radar' | 'SigInt Intercept' | 'Thermal IR';
}

export interface SurveillanceNode {
  id: string;
  code: string;
  name: string;
  region: string;
  coordinates: string;
  status: 'ONLINE' | 'INTERCEPTING' | 'ANALYZING' | 'RECON';
  bandwidth: string;
  lastIntercept: string;
  targetCount: number;
  description: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  nodeCode: string;
  level: 'INFO' | 'ALERT' | 'INTERCEPT' | 'TELEMETRY';
  message: string;
}
