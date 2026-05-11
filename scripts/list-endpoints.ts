import { endpointCount, endpoints } from "../src/endpoints";

console.log(`SayaMusicAPI endpoints: ${endpointCount}`);
for (const endpoint of endpoints) {
  console.log(`${endpoint.method.padEnd(4)} ${endpoint.path.padEnd(52)} ${endpoint.provider}`);
}

