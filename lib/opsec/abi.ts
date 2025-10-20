export const ERC20 = [
  { "type": "function", "name": "name", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "symbol", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "string" }] },
  { "type": "function", "name": "decimals", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint8" }] },
  { "type": "function", "name": "totalSupply", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "owner", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "address" }] },
  { "type": "function", "name": "getOwner", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "address" }] },   // some variants
  { "type": "function", "name": "paused", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "bool" }] },
  { "type": "function", "name": "isBlacklisted", "stateMutability": "view", "inputs": [{ "type": "address" }], "outputs": [{ "type": "bool" }] },
  { "type": "function", "name": "taxFee", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "buyTax", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] },
  { "type": "function", "name": "sellTax", "stateMutability": "view", "inputs": [], "outputs": [{ "type": "uint256" }] }
] as const;
