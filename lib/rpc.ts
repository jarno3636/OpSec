import { createPublicClient, http } from "viem";
import { BASE } from "./chains";

const RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";
export const baseClient = createPublicClient({ chain: { id: BASE.id } as any, transport: http(RPC) });
