import { getCatalystServersFromCache } from "dcl-catalyst-client/dist/contracts-snapshots"

export async function main() {
  console.log("Catalysts: ", getCatalystServersFromCache("mainnet"))
}

main().catch(console.error)
