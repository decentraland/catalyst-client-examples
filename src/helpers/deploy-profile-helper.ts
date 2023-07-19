import { DeploymentBuilder } from 'dcl-catalyst-client'
import { EntityType } from '@dcl/schemas'
import { DeploymentPreparationData } from 'dcl-catalyst-client/dist/client/types'
import { IdentityType } from '@dcl/crypto'
import { bytesToHex, getAddress, hexToBytes, sha3 } from 'eth-connect'
import { getPublicKey } from 'ethereum-cryptography/secp256k1'

export async function buildProfile(address: string, metadata: object, files: Map<string, Uint8Array>): Promise<DeploymentPreparationData> {
    return await DeploymentBuilder.buildEntity({
        type: EntityType.PROFILE,
        pointers: [address],
        metadata,
        files
    })
}

export function getIdentity() {
  if (!process.env.DCL_PRIVATE_KEY) {
    throw new Error('DCL_PRIVATE_KEY env var is required')
  }

  return createWallet(process.env.DCL_PRIVATE_KEY)
}

function createWallet(privateKey: string): IdentityType {
  const length = privateKey.startsWith('0x') ? 66 : 64
  if (privateKey.length !== length) {
    throw Error('Addresses should be 64 characters length.')
  }

  const pk = hexToBytes(privateKey)

  const publicKey = getPublicKey(pk).slice(1)
  const address = getAddress(sha3(publicKey).substring(24))

  return {
    address,
    privateKey,
    publicKey: bytesToHex(publicKey)
  }
}
