package com.example.wifi_direct_app.utils

import android.graphics.Bitmap
import android.graphics.Color
import java.security.SecureRandom
import kotlin.experimental.xor

object VisualCryptoUtils {

    private val random = SecureRandom()

    /**
     * Splits a bitmap into two shares using a (2, 2) Random Grid scheme with XOR.
     * This supports 24-bit color by XORing each RGB channel.
     * 
     * @param source The original bitmap to split.
     * @return A Pair containing Share 1 and Share 2.
     */
    fun splitImage(source: Bitmap): Pair<Bitmap, Bitmap> {
        val width = source.width
        val height = source.height
        
        val share1 = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val share2 = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        
        val pixels = IntArray(width * height)
        val s1Pixels = IntArray(width * height)
        val s2Pixels = IntArray(width * height)
        
        source.getPixels(pixels, 0, width, 0, 0, width, height)
        
        for (i in pixels.indices) {
            val pixel = pixels[i]
            
            // Extract ARGB
            val a = Color.alpha(pixel)
            val r = Color.red(pixel)
            val g = Color.green(pixel)
            val b = Color.blue(pixel)
            
            // Generate random RGB for Share 1
            val r1 = random.nextInt(256)
            val g1 = random.nextInt(256)
            val b1 = random.nextInt(256)
            
            // XOR with original for Share 2
            val r2 = r xor r1
            val g2 = g xor g1
            val b2 = b xor b1
            
            // Note: We preserve the alpha channel from the source
            s1Pixels[i] = Color.argb(a, r1, g1, b1)
            s2Pixels[i] = Color.argb(a, r2, g2, b2)
        }
        
        share1.setPixels(s1Pixels, 0, width, 0, 0, width, height)
        share2.setPixels(s2Pixels, 0, width, 0, 0, width, height)
        
        return Pair(share1, share2)
    }

    /**
     * Reconstructs the original image by XORing two shares.
     * 
     * @param share1 The first share.
     * @param share2 The second share.
     * @return The reconstructed bitmap.
     */
    fun reconstructImage(share1: Bitmap, share2: Bitmap): Bitmap {
        val width = share1.width
        val height = share1.height
        
        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        
        val s1Pixels = IntArray(width * height)
        val s2Pixels = IntArray(width * height)
        val resultPixels = IntArray(width * height)
        
        share1.getPixels(s1Pixels, 0, width, 0, 0, width, height)
        share2.getPixels(s2Pixels, 0, width, 0, 0, width, height)
        
        for (i in s1Pixels.indices) {
            val p1 = s1Pixels[i]
            val p2 = s2Pixels[i]
            
            val a = Color.alpha(p1) // Assume same alpha
            val r = Color.red(p1) xor Color.red(p2)
            val g = Color.green(p1) xor Color.green(p2)
            val b = Color.blue(p1) xor Color.blue(p2)
            
            resultPixels[i] = Color.argb(a, r, g, b)
        }
        
        result.setPixels(resultPixels, 0, width, 0, 0, width, height)
        return result
    }
}
