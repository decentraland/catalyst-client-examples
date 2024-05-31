import { createContentClient, DeploymentBuilder } from 'dcl-catalyst-client'
import { createFetchComponent } from '@well-known-components/fetch-component'
import * as fs from 'fs'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { Authenticator } from '@dcl/crypto'
import { EntityType } from '@dcl/schemas'
import { getIdentity } from './utils'

export async function main() {
  const config = await createDotEnvConfigComponent({
    path: ['.env.default', '.env']
  })
  const [signingKey, peerUrl] = await Promise.all([
    config.requireString('DCL_PRIVATE_KEY'),
    config.requireString('CONTENT_SERVER_URL')
  ])
  console.log(`Content Server URL: ${peerUrl}`)

  const identity = getIdentity(signingKey)
  console.log(`Signing address: ${identity.address}`)

  const fetcher = createFetchComponent()
  const contentClient = createContentClient({ url: peerUrl, fetcher })

  const entityJson = JSON.parse(fs.readFileSync('etc/outfits/outfits.json').toString())
  const entityFiles = new Map<string, Uint8Array>()

  const { entityId, files } = await DeploymentBuilder.buildEntity({
    type: EntityType.OUTFITS,
    files: entityFiles,
    pointers: [`${identity.address}:outfits`],
    metadata: entityJson,
    timestamp: Date.now()
  })
  console.log(`Entity ID: ${entityId}`)
  const signature = Authenticator.createSignature(identity, entityId)
  const authChain = Authenticator.createSimpleAuthChain(entityId, identity.address, signature)

  const result = (await contentClient.deploy({
    files,
    entityId,
    authChain
  })) as any
  console.log(result.status, await result.json())
}

main().catch(console.error)
