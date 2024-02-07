import { IdentityType } from '@dcl/crypto'
import { getPublicKey } from '@noble/secp256k1'
import { hexToBytes } from 'eth-connect'
import { computeAddress } from '@dcl/crypto/dist/crypto'

export function getIdentity(privateKey: string): IdentityType {
  const publicKey = getPublicKey(hexToBytes(privateKey)).slice(1)
  const address = computeAddress(publicKey)

  return {
    privateKey: privateKey,
    publicKey: Buffer.from(publicKey).toString('hex'),
    address
  }
}
