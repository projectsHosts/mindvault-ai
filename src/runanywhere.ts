import {
  RunAnywhere,
  SDKEnvironment,
  ModelManager,
  ModelCategory,
  LLMFramework,
  type CompactModelDef,
} from '@runanywhere/web';

import { LlamaCPP, VLMWorkerBridge } from '@runanywhere/web-llamacpp';
import { ONNX } from '@runanywhere/web-onnx';

// @ts-ignore
import vlmWorkerUrl from './workers/vlm-worker?worker&url';

// --- Model Catalog ---
const MODELS: CompactModelDef[] = [
  {
    id: 'lfm2-350m-q4_k_m',
    name: 'LFM2 350M Q4_K_M',
    repo: 'LiquidAI/LFM2-350M-GGUF',
    files: ['LFM2-350M-Q4_K_M.gguf'],
    framework: LLMFramework.LlamaCpp,
    modality: ModelCategory.Language,
    memoryRequirement: 250_000_000,
  },
];

// --- Initialization ---
let _initPromise: Promise<void> | null = null;

export async function initSDK(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    await RunAnywhere.initialize({
      environment: SDKEnvironment.Production,
      debug: false,
    });

    try {
      // @ts-ignore
      RunAnywhere.disableTelemetry?.();
    } catch (e) {}

    await LlamaCPP.register();
    await ONNX.register();

    RunAnywhere.registerModels(MODELS);

    VLMWorkerBridge.shared.workerUrl = vlmWorkerUrl;

    RunAnywhere.setVLMLoader({
      get isInitialized() {
        return VLMWorkerBridge.shared.isInitialized;
      },
      init: () => VLMWorkerBridge.shared.init(),
      loadModel: (params) => VLMWorkerBridge.shared.loadModel(params),
      unloadModel: () => VLMWorkerBridge.shared.unloadModel(),
    });
  })();

  return _initPromise;
}

export function getAccelerationMode(): string | null {
  return LlamaCPP.isRegistered ? LlamaCPP.accelerationMode : null;
}

export { RunAnywhere, ModelManager, ModelCategory };