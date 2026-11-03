import { rejectDuplicateKeys } from "./core/index.js";
import {
  bridgeFailure,
  handleBridgeRequest,
  MAX_BRIDGE_BYTES,
  validateBridgeEnvelope,
  type BridgeResponse,
} from "./adapters/node-bridge.js";

async function main(): Promise<BridgeResponse> {
  try {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of process.stdin) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buffer.byteLength;
      if (bytes > MAX_BRIDGE_BYTES) return bridgeFailure("invalid_request");
      chunks.push(buffer);
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    const request: unknown = JSON.parse(text);
    // Bound nesting/values before the duplicate-key scanner allocates its stack.
    validateBridgeEnvelope(request);
    rejectDuplicateKeys(text);
    return handleBridgeRequest(request);
  } catch {
    return bridgeFailure("invalid_request");
  }
}
const response = await main();
process.stdout.write(JSON.stringify(response) + "\n");
process.exitCode = response.ok ? 0 : 1;
