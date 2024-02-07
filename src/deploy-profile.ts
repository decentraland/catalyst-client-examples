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

  const identity = getIdentity(signingKey)
  console.log(`Signing address: ${identity.address}`)

  const fetcher = createFetchComponent()
  const contentClient = createContentClient({ url: peerUrl, fetcher })

  const entityJson = JSON.parse(fs.readFileSync('etc/profiles/profile.json').toString())
  const entityFiles = new Map<string, Uint8Array>()
  entityFiles.set('body.png', fs.readFileSync('etc/profiles/body.png'))
  entityFiles.set('face256.png', fs.readFileSync('etc/profiles/face256.png'))

  const { entityId, files } = await DeploymentBuilder.buildEntity({
    type: EntityType.PROFILE,
    files: entityFiles,
    pointers: [identity.address],
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
