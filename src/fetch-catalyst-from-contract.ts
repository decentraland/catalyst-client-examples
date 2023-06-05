import RequestManager, { ContractFactory, HTTPProvider, bytesToHex } from 'eth-connect'
import { createFetchComponent } from '@well-known-components/fetch-component'
import { catalystAbi, CatalystByIdResult, l1Contracts, getCatalystServersFromDAO } from '@dcl/catalyst-contracts'

export async function main() {
  const fetch = createFetchComponent()
  const provider = new HTTPProvider('https://rpc.decentraland.org/mainnet?project:catalyst-client-build', {
    fetch: fetch.fetch
  })

  const requestManager = new RequestManager(provider)
  const factory = new ContractFactory(requestManager, catalystAbi)
  const contract = (await factory.at(l1Contracts.mainnet.catalyst)) as any
  const catalysts = await getCatalystServersFromDAO({
    async catalystCount(): Promise<number> {
      return contract.catalystCount()
    },
    async catalystIds(i: number): Promise<string> {
      return contract.catalystIds(i)
    },
    async catalystById(catalystId: string): Promise<CatalystByIdResult> {
      const [id, owner, domain] = await contract.catalystById(catalystId)
      return { id: '0x' + bytesToHex(id), owner, domain }
    }
  })
  console.log('Catalysts: ', catalysts)
}

main().catch(console.error)
