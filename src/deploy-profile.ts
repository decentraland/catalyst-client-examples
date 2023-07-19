import { createFetchComponent } from '@well-known-components/fetch-component'
import { buildProfile, getIdentity } from './helpers/deploy-profile-helper'
import { ethSign } from '@dcl/crypto/dist/crypto'
import { Authenticator } from '@dcl/crypto'
import { hexToBytes } from 'eth-connect'
import { createCatalystClient, createContentClient } from 'dcl-catalyst-client'
import { Profile } from "@dcl/schemas"

const CATALYST_URL = 'http://127.0.0.1:6969'
// 'http://127.0.0.1:6969'
//'https://peer-ap1.decentraland.zone/content'

export async function main() {
  const fetcher = createFetchComponent()
  const client = createContentClient({ url: CATALYST_URL, fetcher })
  const metadata = {
    timestamp: 1672334076849,
    avatars: [
      {
        hasClaimedName: false,
        name: 'Ocleomansi',
        description: 'A description',
        tutorialStep: 256,
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          wearables: [
            // 'urn:decentraland:off-chain:base-avatars:green_hoodie',
            'urn:decentraland:mumbai:collections-v2:0x02101c138653a0af06a45b729d9c5d6ba27b8f4a:1:105312291668557186697918027683670432318895095400549111254310977537',
            // 'urn:decentraland:matic:collections-v2:0x26ea2f6a7273a2f28b410406d1c13ff7d4c9a162:6',
            'urn:decentraland:off-chain:base-avatars:pijama_pants',
            'urn:decentraland:off-chain:base-avatars:moccasin',
            'urn:decentraland:off-chain:base-avatars:cornrows',
            'urn:decentraland:off-chain:base-avatars:eyebrows_02',
            'urn:decentraland:off-chain:base-avatars:eyes_03',
            'urn:decentraland:off-chain:base-avatars:mouth_05'
          ],
          emotes: [
            {
              slot: 0,
              urn: 'handsair'
            },
            {
              slot: 1,
              urn: 'wave'
            },
            {
              slot: 2,
              urn: 'fistpump'
            },
            {
              slot: 3,
              urn: 'dance'
            },
            {
              slot: 4,
              urn: 'raiseHand'
            },
            {
              slot: 5,
              urn: 'clap'
            },
            {
              slot: 6,
              urn: 'money'
            },
            {
              slot: 7,
              urn: 'kiss'
            },
            {
              slot: 8,
              urn: 'headexplode'
            },
            {
              slot: 9,
              urn: 'shrug'
            }
          ],
          snapshots: {
            body: 'bafkreihzltkoap3t3ues42ppn4y3jm73pexmsqmrlhr42zafcm4nuqr33i',
            face256:
              'bafkreie65klgvjmbrpavqzxelw4ak34s6xshtkiczfuae6hokpp6rdze4m'
          },
          eyes: {
            color: {
              r: 0.5728054642677307,
              g: 0.7592542171478271,
              b: 0.6648877859115601,
              a: 1
            }
          },
          hair: {
            color: {
              r: 0.4196386933326721,
              g: 0.2638697624206543,
              b: 0.20546050369739532,
              a: 1
            }
          },
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816,
              a: 1
            }
          }
        },
        ethAddress: '0x5447c87068b3d99f50a439f98a2b420585b34a93',
        version: 6,
        userId: '0x5447c87068b3d99f50a439f98a2b420585b34a93',
        hasConnectedWeb3: true
      }
    ]
  }

  if (!Profile.validate(metadata)) {
    console.log(metadata)
    console.error(Profile.validate.errors)
    return
  }

  const filesToInclude = new Map<string, Uint8Array>()
  const bodyContent = await client.downloadContent(metadata.avatars[0].avatar.snapshots.body)
  const faceContent = await client.downloadContent(metadata.avatars[0].avatar.snapshots.face256)
  filesToInclude.set('body.png', bodyContent)
  filesToInclude.set('face256.png', faceContent)

  const { entityId, files } = await buildProfile('0x5447C87068b3d99F50a439f98a2B420585B34A93', metadata, filesToInclude)

  const identity = getIdentity()
  const signature = ethSign(hexToBytes(identity.privateKey), entityId)
  const authChain = Authenticator.createSimpleAuthChain(entityId, identity.address, signature)

  const response: Response = (await client.deploy({
    files,
    entityId,
    authChain
  })) as Response
  console.log(await response.json())
}

main().catch(console.error)
