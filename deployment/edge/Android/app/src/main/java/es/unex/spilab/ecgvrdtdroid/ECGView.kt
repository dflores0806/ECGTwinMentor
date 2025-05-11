package es.unex.spilab.ecgvrdtdroid

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import kotlin.math.PI
import kotlin.math.sin

class ECGView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {

    var heartRate: Float = 75f
    var prInterval: Float = 160f
    var qrsDuration: Float = 90f
    var stSegment: Float = 1f
    var qtcInterval: Float = 380f

    private val paint = Paint().apply {
        color = Color.RED
        strokeWidth = 3f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    private var ecgPoints: List<Pair<Float, Float>> = emptyList()
    private var progress = 0
    private val samplesPerCycle = 600
    private val numberOfCycles = 3

    init {
        generateECG()
    }

    private fun generateECG() {
        val points = mutableListOf<Pair<Float, Float>>()

        val minPR = 40f
        val minQRS = 40f
        val minST = 0.04f
        val minQT = 200f

        val prSec = (prInterval.coerceAtLeast(minPR)) / 1000f
        val qrsSec = (qrsDuration.coerceAtLeast(minQRS)) / 1000f
        val stSec = stSegment.coerceAtLeast(minST)
        val qtSec = (qtcInterval.coerceAtLeast(minQT)) / 1000f

        val prSamples = (samplesPerCycle * prSec).toInt().coerceAtMost(samplesPerCycle)
        val qrsSamples = (samplesPerCycle * qrsSec).toInt().coerceAtMost(samplesPerCycle)
        val stSamples = (samplesPerCycle * stSec).toInt().coerceAtMost(samplesPerCycle)
        val qtSamples = (samplesPerCycle * qtSec).toInt().coerceAtMost(samplesPerCycle)
        val tSamples = (qtSamples - qrsSamples - stSamples).coerceAtLeast(10)

        val baselineShift = 0f // Puedes usar electricalAxis / 180f si está disponible

        val rhythmFactor = when {
            heartRate < 60f -> 0.8f
            heartRate > 100f -> 1.2f
            else -> 1f
        }

        val tWaveLabel = when {
            qtcInterval < 340f -> "Inverted"
            qtcInterval < 360f -> "Flattened"
            qtcInterval < 440f -> "Normal"
            else -> "Peaked"
        }

        val tAmp = when (tWaveLabel) {
            "Peaked" -> 0.8f
            "Flattened" -> 0.2f
            "Inverted" -> -0.5f
            else -> 0.5f
        }

        for (cycle in 0 until numberOfCycles) {
            val base = cycle * samplesPerCycle

            for (i in 0 until prSamples) {
                val angle = (PI * i) / prSamples
                val y = (10f * rhythmFactor * sin(angle)).toFloat()
                points.add(Pair((base + i).toFloat(), y))
            }

            for (i in 0 until qrsSamples) {
                val x = i.toFloat() / qrsSamples
                val y = when {
                    x < 0.2f -> -1f + 5f * x
                    x < 0.5f -> 1f - 10f * (x - 0.2f)
                    else -> -2f + 4f * (x - 0.5f)
                }
                points.add(Pair((base + prSamples + i).toFloat(), y * 10f * rhythmFactor))
            }

            for (i in 0 until stSamples) {
                points.add(Pair((base + prSamples + qrsSamples + i).toFloat(), 1f * rhythmFactor))
            }

            for (i in 0 until tSamples) {
                val angle = (PI * i) / tSamples
                val y = (tAmp * sin(angle)).toFloat()
                points.add(Pair((base + prSamples + qrsSamples + stSamples + i).toFloat(), y * 10f * rhythmFactor))
            }

            val used = prSamples + qrsSamples + stSamples + tSamples
            val remaining = samplesPerCycle - used
            for (i in 0 until remaining) {
                points.add(Pair((base + used + i).toFloat(), 0f))
            }
        }

        ecgPoints = points.map { (x, y) -> Pair(x, y + baselineShift * 10f) }
    }


    fun resetAnimation() {
        progress = 0
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val w = width.toFloat()
        val h = height.toFloat()
        val scaleX = w / (samplesPerCycle * numberOfCycles)
        val scaleY = h / 2f
        val offsetY = h / 2f

        var lastX = 0f
        var lastY = offsetY

        for (i in 0 until progress.coerceAtMost(ecgPoints.size)) {
            val (x, y) = ecgPoints[i]
            val screenX = x * scaleX
            val screenY = offsetY - y * 0.01f * scaleY
            if (i > 0) {
                canvas.drawLine(lastX, lastY, screenX, screenY, paint)
            }
            lastX = screenX
            lastY = screenY
        }

        if (progress < ecgPoints.size) {
            progress += 15
            postInvalidateDelayed(16)
        } else {
            progress = 0
            postInvalidateDelayed(1000)
        }
    }

    fun regenerate(heart: Float, pr: Float, qrs: Float, st: Float, qtc: Float) {
        heartRate = heart
        prInterval = pr
        qrsDuration = qrs
        stSegment = st
        qtcInterval = qtc
        generateECG()  // ← vuelve a calcular los puntos
        resetAnimation() // ← reinicia el dibujo
    }

}