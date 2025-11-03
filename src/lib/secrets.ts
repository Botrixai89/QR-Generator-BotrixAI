/**
 * Secrets Management Utilities
 * Handles encrypted storage and rotation of sensitive secrets
 */

import crypto from 'crypto'
import { supabaseAdmin } from './supabase'

// Encryption key from environment (should be stored securely)
const ENCRYPTION_KEY = process.env.SECRETS_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a secret value
 */
function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Return IV:AuthTag:EncryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts a secret value
 */
function decryptSecret(encrypted: string): string {
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format')
  }

  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encryptedData = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Stores a secret (creates or updates)
 */
export async function storeSecret(
  name: string,
  value: string,
  rotate: boolean = false
): Promise<{ id: string; keyVersion: number }> {
  // Get existing secret if rotating
  let existingSecret = null
  if (rotate) {
    const { data } = await supabaseAdmin!
      .from('Secret')
      .select('*')
      .eq('name', name)
      .eq('isActive', true)
      .maybeSingle()

    existingSecret = data
  }

  // Encrypt the value
  const encryptedValue = encryptSecret(value)

  // If rotating, deactivate old secret
  if (existingSecret) {
    await supabaseAdmin!
      .from('Secret')
      .update({
        isActive: false,
        rotatedAt: new Date().toISOString(),
      })
      .eq('id', existingSecret.id)
  }

  // Create new secret entry
  const { data: newSecret, error } = await supabaseAdmin!
    .from('Secret')
    .insert({
      name,
      encryptedValue,
      keyVersion: existingSecret ? (existingSecret.keyVersion || 1) + 1 : 1,
      rotatedFromId: existingSecret?.id || null,
      isActive: true,
    })
    .select()
    .single()

  if (error || !newSecret) {
    throw new Error('Failed to store secret')
  }

  return {
    id: newSecret.id,
    keyVersion: newSecret.keyVersion,
  }
}

/**
 * Retrieves a secret value
 */
export async function getSecret(name: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin!
    .from('Secret')
    .select('*')
    .eq('name', name)
    .eq('isActive', true)
    .order('keyVersion', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  try {
    return decryptSecret(data.encryptedValue)
  } catch (error) {
    console.error('Failed to decrypt secret:', error)
    return null
  }
}

/**
 * Rotates a secret (creates new version)
 */
export async function rotateSecret(name: string, newValue: string): Promise<void> {
  await storeSecret(name, newValue, true)
}

/**
 * Lists all active secrets (without values)
 */
export async function listSecrets(): Promise<
  Array<{ id: string; name: string; keyVersion: number; createdAt: string; rotatedAt: string | null }>
> {
  const { data, error } = await supabaseAdmin!
    .from('Secret')
    .select('id, name, keyVersion, createdAt, rotatedAt')
    .eq('isActive', true)
    .order('name')

  if (error) {
    throw new Error('Failed to list secrets')
  }

  return data || []
}

/**
 * Deactivates a secret
 */
export async function deactivateSecret(name: string): Promise<void> {
  const { error } = await supabaseAdmin!
    .from('Secret')
    .update({ isActive: false })
    .eq('name', name)
    .eq('isActive', true)

  if (error) {
    throw new Error('Failed to deactivate secret')
  }
}

