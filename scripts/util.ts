import { ethers } from "ethers";
import fs from "fs";
import path from "path";

export function toKeccakHex(input: Buffer | string): string {
  const data = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return ethers.keccak256(data);
}

export function readFileAsBuffer(filePath: string): Buffer {
  return fs.readFileSync(path.resolve(filePath));
}

export function getContractAddr(): string {
  const p = path.resolve(__dirname, "../cache/contract.json");
  if (!fs.existsSync(p)) throw new Error("cache/contract.json not found. Deploy first or set CONTRACT env var.");
  const { address } = JSON.parse(fs.readFileSync(p, "utf-8"));
  if (!address) throw new Error("No address in cache/contract.json");
  return address;
}
