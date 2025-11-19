import { IdentityType } from '@dcl/crypto'
import { getPublicKey } from 'ethereum-cryptography/secp256k1.js'
import { computeAddress } from '@dcl/crypto/dist/crypto.js'

export async function getIdentity(privateKey: string): Promise<IdentityType> {
  const ethConnect = (await import('eth-connect')).default as any
  const privateKeyBytes = ethConnect.hexToBytes(privateKey)
  const publicKeyBytes = getPublicKey(privateKeyBytes)
  // Remove the leading 0x04 byte
  const publicKey = publicKeyBytes.slice(1)
  const address = computeAddress(publicKey)

  return {
    privateKey: privateKey,
    publicKey: ethConnect.bytesToHex(publicKey),
    address
  }
}
