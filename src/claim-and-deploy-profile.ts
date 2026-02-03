/**
 * Claim Reward and Deploy Profile with Attestation
 *
 * This script demonstrates the complete attestation flow:
 * 1. Claims a wearable reward from the Rewards service
 * 2. Receives an ownership attestation in the response
 * 3. Builds a profile with the wearable equipped
 * 4. Deploys the profile to Catalyst with the attestation
 *
 * The attestation allows the user to equip the wearable immediately,
 * without waiting for blockchain minting to complete.
 *
 * Environment variables:
 * - DCL_PRIVATE_KEY: Private key for signing (user wallet)
 * - CONTENT_SERVER_URL: Catalyst content server URL
 * - REWARDS_SERVICE_URL: Rewards service URL
 * - CAMPAIGN_KEY: Campaign key for claiming rewards
 */

import { DeploymentBuilder } from 'dcl-catalyst-client'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { Authenticator } from '@dcl/crypto'
import { EntityType } from '@dcl/schemas'
import { getIdentity } from './utils.js'

// =============================================================================
// Types
// =============================================================================

interface AuthLink {
  type: string
  payload: string
  signature: string
}

interface OwnershipAttestation {
  urn: string
  version: number
  beneficiary: string
  itemUrn: string
  issuedAt: number
  expiresAt: number
  authChain: AuthLink[]
}

interface RewardResponse {
  id: string
  user: string
  airdrop_type: string
  status: string
  chain_id: number
  target: string
  value: string
  token: string
  image: string | null
  rarity: string | null
  category: string | null
  attestation: OwnershipAttestation | null
}

interface ProfileMetadata {
  avatars: Array<{
    hasClaimedName: boolean
    description: string
    tutorialStep: number
    name: string
    avatar: {
      bodyShape: string
      wearables: string[]
      forceRender: string[]
      emotes: Array<{ slot: number; urn: string }>
      eyes: { color: { r: number; g: number; b: number; a: number } }
      hair: { color: { r: number; g: number; b: number; a: number } }
      skin: { color: { r: number; g: number; b: number; a: number } }
    }
    ethAddress: string
    userId: string
    version: number
    hasConnectedWeb3: boolean
    email: string
    muted: string[]
  }>
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build a wearable URN from chain ID, contract address, item ID, and token ID
 *
 * URN format: urn:decentraland:<network>:collections-v2:<contract>:<itemId>:<tokenId>
 * - itemId identifies the type of wearable in the collection
 * - tokenId identifies the specific minted instance (numeric)
 */
function buildWearableUrn(chainId: number, contractAddress: string, itemId: string, tokenId: string): string {
  const networkMap: Record<number, string> = {
    1: 'ethereum',
    137: 'matic',
    11155111: 'sepolia',
    80002: 'amoy'
  }
  const network = networkMap[chainId] || 'matic'
  return `urn:decentraland:${network}:collections-v2:${contractAddress.toLowerCase()}:${itemId}:${tokenId}`
}

/**
 * Generate a simulated token ID for PoC purposes
 * In production, this would come from the actual minting transaction
 * Token ID format: itemId * 1000000000000 + sequential number
 */
function generateSimulatedTokenId(itemId: string, index: number): string {
  // Simulate token ID based on item ID and index
  // This matches the typical pattern used by DCL collections
  const baseId = BigInt(itemId) * BigInt('1000000000000')
  return (baseId + BigInt(index + 1)).toString()
}

/**
 * Claim a reward from the Rewards service
 */
async function claimReward(
  rewardsServiceUrl: string,
  campaignKey: string,
  beneficiary: string
): Promise<RewardResponse[]> {
  console.log(`\n📦 Claiming reward...`)
  console.log(`   Rewards Service: ${rewardsServiceUrl}`)
  console.log(`   Beneficiary: ${beneficiary}`)

  const response = await fetch(`${rewardsServiceUrl}/api/rewards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      campaign_key: campaignKey,
      beneficiary: beneficiary
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to claim reward: ${response.status} ${response.statusText}\n${errorText}`)
  }

  const result = await response.json()
  // Response format is { ok: true, data: [...] }
  const rewards: RewardResponse[] = result.data || result
  return rewards
}

/**
 * Create a base profile metadata structure
 */
function createBaseProfile(address: string): ProfileMetadata {
  return {
    avatars: [
      {
        hasClaimedName: false,
        description: 'Attestation PoC Profile',
        tutorialStep: 256,
        name: 'attestation-tester',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          wearables: [
            'urn:decentraland:off-chain:base-avatars:eyes_02',
            'urn:decentraland:off-chain:base-avatars:f_mouth_02',
            'urn:decentraland:off-chain:base-avatars:hair_coolshortstyle',
            'urn:decentraland:off-chain:base-avatars:m_lowerBody_00',
            'urn:decentraland:off-chain:base-avatars:m_upperBody_00',
            'urn:decentraland:off-chain:base-avatars:m_feet_00'
          ],
          forceRender: [],
          emotes: [],
          eyes: { color: { r: 0.6, g: 0.3, b: 0.2, a: 1 } },
          hair: { color: { r: 0.5, g: 0.3, b: 0.1, a: 1 } },
          skin: { color: { r: 0.9, g: 0.7, b: 0.6, a: 1 } }
        },
        ethAddress: address.toLowerCase(),
        userId: address.toLowerCase(),
        version: 1,
        hasConnectedWeb3: true,
        email: '',
        muted: []
      }
    ]
  }
}

/**
 * Add a wearable to the profile
 */
function addWearableToProfile(profile: ProfileMetadata, wearableUrn: string): void {
  if (profile.avatars.length > 0) {
    const wearables = profile.avatars[0].avatar.wearables
    if (!wearables.includes(wearableUrn)) {
      wearables.push(wearableUrn)
      console.log(`   Added wearable: ${wearableUrn}`)
    }
  }
}

// =============================================================================
// Main Function
// =============================================================================

export async function main() {
  console.log('='.repeat(70))
  console.log('🎮 Attestation PoC: Claim Reward and Deploy Profile')
  console.log('='.repeat(70))

  // Load configuration
  const config = await createDotEnvConfigComponent({
    path: ['.env.default', '.env']
  })

  const [signingKey, peerUrl, rewardsUrl, campaignKey] = await Promise.all([
    config.requireString('DCL_PRIVATE_KEY'),
    config.requireString('CONTENT_SERVER_URL'),
    config.requireString('REWARDS_SERVICE_URL'),
    config.requireString('CAMPAIGN_KEY')
  ])

  // Get identity from private key
  const identity = await getIdentity(signingKey)
  console.log(`\n🔑 Identity`)
  console.log(`   Address: ${identity.address}`)

  // Step 1: Claim reward from Rewards service
  const rewards = await claimReward(rewardsUrl, campaignKey, identity.address)

  if (rewards.length === 0) {
    console.log('\n❌ No rewards available to claim')
    return
  }

  console.log(`\n✅ Claimed ${rewards.length} reward(s)`)

  // Find rewards with attestations
  const rewardsWithAttestations = rewards.filter((r) => r.attestation !== null)
  if (rewardsWithAttestations.length === 0) {
    console.log('\n⚠️  No attestations received (rewards may not be CollectionV2IssueToken type)')
    return
  }

  // Step 2: Build profile with wearables
  console.log('\n👤 Building profile with claimed wearables...')
  const profile = createBaseProfile(identity.address)
  const attestations: OwnershipAttestation[] = []

  for (let i = 0; i < rewardsWithAttestations.length; i++) {
    const reward = rewardsWithAttestations[i]
    // reward.value is the itemId
    // Generate a simulated tokenId since the token hasn't been minted yet
    const simulatedTokenId = generateSimulatedTokenId(reward.value, i)
    const wearableUrn = buildWearableUrn(reward.chain_id, reward.target, reward.value, simulatedTokenId)
    addWearableToProfile(profile, wearableUrn)
    console.log(`   Wearable URN: ${wearableUrn}`)
    console.log(`   (Simulated tokenId: ${simulatedTokenId})`)

    if (reward.attestation) {
      attestations.push(reward.attestation)
      console.log(`   Attestation received for: ${reward.attestation.itemUrn}`)
      console.log(`   Expires at: ${new Date(reward.attestation.expiresAt * 1000).toISOString()}`)
      console.log(`   AuthChain:`)
      for (const link of reward.attestation.authChain) {
        console.log(`     - Type: ${link.type}`)
        console.log(`       Payload: ${link.payload}`)
        console.log(`       Signature: ${link.signature || '(empty)'}`)
      }
    }
  }

  // Step 3: Build entity
  console.log('\n🏗️  Building deployment entity...')

  const { entityId, files } = await DeploymentBuilder.buildEntity({
    type: EntityType.PROFILE,
    files: new Map(),
    pointers: [identity.address.toLowerCase()],
    metadata: profile,
    timestamp: Date.now()
  })

  console.log(`   Entity ID: ${entityId}`)

  // Step 4: Create auth chain
  const signature = Authenticator.createSignature(identity, entityId)
  const authChain = Authenticator.createSimpleAuthChain(entityId, identity.address, signature)

  // Step 5: Deploy with attestations
  console.log('\n🚀 Deploying to Catalyst...')
  console.log(`   Content Server: ${peerUrl}`)
  console.log(`   Attestations: ${attestations.length}`)

  // The contentClient.deploy method needs to be extended to support attestations
  // For now, we'll use a custom fetch to include the attestations
  const formData = new FormData()
  formData.append('entityId', entityId)
  formData.append('authChain', JSON.stringify(authChain))
  formData.append('ownershipAttestations', JSON.stringify(attestations))

  // Add entity file
  const entityFile = files.get(entityId)
  if (entityFile) {
    formData.append(entityId, new Blob([entityFile]), entityId)
  }

  // Add other files
  for (const [filename, content] of files) {
    if (filename !== entityId) {
      formData.append(filename, new Blob([content]), filename)
    }
  }

  const deployUrl = `${peerUrl}/entities`
  console.log(`   Deploy URL: ${deployUrl}`)

  let deployResponse: Response
  let deployResult: any
  try {
    deployResponse = await fetch(deployUrl, {
      method: 'POST',
      body: formData
    })
    deployResult = await deployResponse.json()
  } catch (fetchError: any) {
    console.error('\n❌ Fetch error details:')
    console.error(`   Message: ${fetchError.message}`)
    console.error(`   Cause: ${fetchError.cause?.message || fetchError.cause || 'N/A'}`)
    console.error(`   Code: ${fetchError.cause?.code || 'N/A'}`)
    throw fetchError
  }

  if (deployResponse.ok) {
    console.log('\n✅ Deployment successful!')
    console.log(`   Creation timestamp: ${deployResult.creationTimestamp}`)
    console.log('\n🎉 Profile deployed with attestation-backed wearables!')
    console.log('   The wearables can be equipped immediately without blockchain confirmation.')
  } else {
    console.log('\n❌ Deployment failed!')
    console.log(`   Status: ${deployResponse.status}`)
    console.log(`   Errors: ${JSON.stringify(deployResult.errors || deployResult, null, 2)}`)
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 Summary')
  console.log('='.repeat(70))
  console.log(`   Rewards claimed: ${rewards.length}`)
  console.log(`   Attestations received: ${attestations.length}`)
  console.log(`   Wearables equipped: ${profile.avatars[0].avatar.wearables.length}`)
  console.log(`   Profile deployed: ${deployResponse.ok ? 'Yes' : 'No'}`)
}

main().catch((error) => {
  console.error('\n💥 Error:', error.message || error)
  process.exit(1)
})
