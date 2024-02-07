import { createCatalystClient } from 'dcl-catalyst-client'
import { createFetchComponent } from '@well-known-components/fetch-component'

const CATALYST_URL = 'https://peer.decentraland.org'
const address = '0x5e5D9D1dfD87E9B8B069B8e5d708dB92bE5ADe99'

export async function main() {
  const fetcher = createFetchComponent()
  const client = createCatalystClient({ url: CATALYST_URL, fetcher })
  const lambdasClient = await client.getLambdasClient()
  const profiles = await lambdasClient.getAvatarsDetailsByPost({ ids: [address] })

  console.log('Profiles: ', JSON.stringify(profiles, null, 2))
}

main().catch(console.error)
