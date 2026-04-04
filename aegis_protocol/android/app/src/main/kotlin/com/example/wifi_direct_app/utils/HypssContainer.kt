package com.example.wifi_direct_app.utils

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec
import java.nio.ByteBuffer

object HypssContainer {
    private val MAGIC_BYTES = "HYPSS".toByteArray(Charsets.US_ASCII)
    private const val VERSION: Byte = 0x01
    
    // Crypto Constants
    private const val SALT_LENGTH = 16
    private const val IV_LENGTH = 12
    private const val TAG_LENGTH_BIT = 128
    private const val ITERATION_COUNT = 10_000
    private const val KEY_LENGTH_BIT = 256
    
    /**
     * Encrypts the provided raw bytes (e.g., PNG data) using AES-256-GCM.
     * The encryption key is derived from the OTC code and a randomly generated salt.
     */
    suspend fun seal(payload: ByteArray, otpCode: String): ByteArray = withContext(Dispatchers.Default) {
        val random = SecureRandom()
        
        // Generate random 16-byte salt
        val salt = ByteArray(SALT_LENGTH)
        random.nextBytes(salt)
        
        // Derive key from OTP + Salt
        val key = deriveKey(otpCode, salt)
        
        // Generate random 12-byte IV for GCM
        val iv = ByteArray(IV_LENGTH)
        random.nextBytes(iv)
        
        // Initialize AES-GCM cipher
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val parameterSpec = GCMParameterSpec(TAG_LENGTH_BIT, iv)
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec)
        
        // Encrypt payload (this includes the 16-byte auth tag at the end)
        val ciphertext = cipher.doFinal(payload)
        
        // Pack container: Magic (5) + Version (1) + Salt (16) + IV (12) + Ciphertext
        val buffer = ByteBuffer.allocate(MAGIC_BYTES.size + 1 + SALT_LENGTH + IV_LENGTH + ciphertext.size)
        buffer.put(MAGIC_BYTES)
        buffer.put(VERSION)
        buffer.put(salt)
        buffer.put(iv)
        buffer.put(ciphertext)
        
        buffer.array()
    }
    
    /**
     * Decrypts a valid .hypss container back into raw bytes.
     * Throws an Exception (e.g., AEADBadTagException) if the OTP is wrong or data is corrupted.
     */
    suspend fun unseal(container: ByteArray, otpCode: String): ByteArray = withContext(Dispatchers.Default) {
        if (!isValidContainer(container)) {
            throw IllegalArgumentException("Invalid HYPSS container: Magic bytes mismatch or data too short.")
        }
        
        val buffer = ByteBuffer.wrap(container)
        
        // Skip Magic & Version
        buffer.position(MAGIC_BYTES.size + 1)
        
        // Extract Salt
        val salt = ByteArray(SALT_LENGTH)
        buffer.get(salt)
        
        // Extract IV
        val iv = ByteArray(IV_LENGTH)
        buffer.get(iv)
        
        // Extract Ciphertext
        val ciphertext = ByteArray(buffer.remaining())
        buffer.get(ciphertext)
        
        // Derive key from extracted Salt + provided OTP
        val key = deriveKey(otpCode, salt)
        
        // Initialize AES-GCM cipher for decryption
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val parameterSpec = GCMParameterSpec(TAG_LENGTH_BIT, iv)
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec)
        
        // Decrypt payload
        cipher.doFinal(ciphertext)
    }
    
    /**
     * Validates if the given byte array is a well-formed HYPSS container.
     */
    fun isValidContainer(bytes: ByteArray): Boolean {
        // Minimum size: Magic (5) + Version (1) + Salt (16) + IV (12) + AuthTag (16) = 50 bytes
        val minSize = MAGIC_BYTES.size + 1 + SALT_LENGTH + IV_LENGTH + (TAG_LENGTH_BIT / 8)
        if (bytes.size < minSize) return false
        
        for (i in MAGIC_BYTES.indices) {
            if (bytes[i] != MAGIC_BYTES[i]) return false
        }
        
        if (bytes[MAGIC_BYTES.size] != VERSION) return false
        
        return true
    }
    
    private fun deriveKey(password: String, salt: ByteArray): SecretKeySpec {
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(password.toCharArray(), salt, ITERATION_COUNT, KEY_LENGTH_BIT)
        val secret = factory.generateSecret(spec)
        return SecretKeySpec(secret.encoded, "AES")
    }
}
