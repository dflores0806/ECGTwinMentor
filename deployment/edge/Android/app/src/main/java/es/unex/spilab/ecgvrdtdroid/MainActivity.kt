package es.unex.spilab.ecgvrdtdroid

import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import es.unex.spilab.ecgvrdtdroid.ui.theme.ECGVRDTDroidTheme
import org.tensorflow.lite.Interpreter
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.Close
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ECGVRDTDroidTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    ECGTwinMentorScreen()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ECGTwinMentorScreen() {
    val context = LocalContext.current

    // ECG Parameters
    var heartRate by remember { mutableStateOf("") }
    var prInterval by remember { mutableStateOf("") }
    var qrsDuration by remember { mutableStateOf("") }
    var stSegment by remember { mutableStateOf("") }
    var qtcInterval by remember { mutableStateOf("") }
    var axis by remember { mutableStateOf("") }

    // Dropdowns
    val rhythms = listOf("Sinus", "Bradycardia", "Tachycardia", "Atrial Fibrillation")
    val tWaves = listOf("Normal", "Inverted", "Peaked", "Flattened")
    val diagnoses = listOf(
        "Select...",
        "Normal",
        "Bradycardia",
        "Tachycardia",
        "Atrial Fibrillation",
        "Myocardial Infarction",
        "Heart Block"
    )

    var selectedRhythm by remember { mutableStateOf(rhythms[0]) }
    var selectedTWave by remember { mutableStateOf(tWaves[0]) }
    var selectedDiagnosis by remember { mutableStateOf(diagnoses[0]) }

    var selectedEvalDiagnosis by remember { mutableStateOf(diagnoses.first()) }
    var evalExpanded by remember { mutableStateOf(false) }

    var rhythmExpanded by remember { mutableStateOf(false) }
    var tWaveExpanded by remember { mutableStateOf(false) }
    var diagnosisExpanded by remember { mutableStateOf(false) }

    var showECG by remember { mutableStateOf(false) }
    var modelUrl by remember { mutableStateOf("https://ecgtwinmentor.spilab.es/demo/models/tflite/download") }
    var predictionResult by remember { mutableStateOf("No prediction yet.") }
    var predictionConfidence by remember { mutableStateOf(0f) }
    var ecgKey by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text("ECGTwinMentor", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))

        // Two columns for inputs
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(Modifier.weight(1f)) {
                NumberField("Heart Rate", heartRate) { heartRate = it }
                NumberField("QRS Duration", qrsDuration) { qrsDuration = it }
                NumberField("QTc Interval", qtcInterval) { qtcInterval = it }
            }
            Column(Modifier.weight(1f)) {
                NumberField("PR Interval", prInterval) { prInterval = it }
                NumberField("ST Segment", stSegment) { stSegment = it }
                NumberField("Electrical Axis", axis) { axis = it }
            }
        }

        Spacer(Modifier.height(8.dp))

        DropdownField(
            "Rhythm",
            rhythms,
            selectedRhythm,
            rhythmExpanded,
            { rhythmExpanded = it }) { selectedRhythm = it }
        Spacer(Modifier.height(8.dp))
        DropdownField(
            "T Wave",
            tWaves,
            selectedTWave,
            tWaveExpanded,
            { tWaveExpanded = it }) { selectedTWave = it }
        Spacer(Modifier.height(8.dp))

        // Action Buttons
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    val rand = java.util.Random()
                    heartRate = (60 + rand.nextInt(41)).toString()
                    prInterval = (120 + rand.nextInt(81)).toString()
                    qrsDuration = (80 + rand.nextInt(41)).toString()
                    stSegment = String.format("%.2f", 0.8 + rand.nextDouble() * 0.4)
                    qtcInterval = (350 + rand.nextInt(101)).toString()
                    axis = (-30 + rand.nextInt(121)).toString()
                    selectedRhythm = rhythms[rand.nextInt(rhythms.size)]
                    selectedTWave = tWaves[rand.nextInt(tWaves.size)]
                    Toast.makeText(context, "Random example loaded", Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Blue,
                    contentColor = Color.White
                )
            ) {
                Text("Load Example")
            }

        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Dropdown para diagnosis
            ExposedDropdownMenuBox(
                expanded = evalExpanded,
                onExpandedChange = { evalExpanded = !evalExpanded },
                modifier = Modifier.weight(1f)
            ) {
                OutlinedTextField(
                    readOnly = true,
                    value = selectedEvalDiagnosis,
                    onValueChange = {},
                    label = { Text("Select diagnosis to evaluate") },
                    trailingIcon = {
                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = evalExpanded)
                    },
                    modifier = Modifier
                        .menuAnchor()
                        .fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = evalExpanded,
                    onDismissRequest = { evalExpanded = false }
                ) {
                    diagnoses.drop(1).forEach { diagnosis ->
                        DropdownMenuItem(
                            text = { Text(diagnosis) },
                            onClick = {
                                selectedEvalDiagnosis = diagnosis
                                evalExpanded = false
                            }
                        )
                    }
                }
            }

            // Botón Evaluate
            Button(
                onClick = {
                    try {
                        val inputStream = context.assets.open("ecg_dataset.csv")
                        val lines = inputStream.bufferedReader().readLines().drop(1)
                            .filter { it.contains(selectedEvalDiagnosis) }

                        if (lines.isNotEmpty()) {
                            val row = lines.random().split(",")

                            fun round(value: String): String {
                                return String.format(
                                    "%.2f",
                                    value.replace(",", ".").toFloatOrNull() ?: 0f
                                )
                            }

                            heartRate = round(row[0])
                            prInterval = round(row[1])
                            qrsDuration = round(row[2])
                            stSegment = round(row[3])
                            qtcInterval = round(row[4])
                            axis = round(row[5])
                            selectedRhythm = row[6]
                            selectedTWave = row[7]
                            selectedDiagnosis = row[8]
                            showECG = true
                        }

                    } catch (e: Exception) {
                        Toast.makeText(
                            context,
                            "Failed to evaluate: ${e.message}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                },
                modifier = Modifier.align(Alignment.CenterVertically),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Blue,
                    contentColor = Color.White
                )
            ) {
                Text("Evaluate")
            }
        }


        Spacer(Modifier.height(8.dp))

        Text("ECG Image", style = MaterialTheme.typography.labelMedium)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    ecgKey++
                    showECG = true
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFdd9700),
                    contentColor = Color.White
                )
            ) {
                Text("Generate ECG")
            }
        }

        if (showECG) {
            key(ecgKey) {
                AndroidView(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    factory = {
                        ECGView(it, null)
                    },
                    update = { view ->
                        view.regenerate(
                            heartRate.replace(",", ".").toFloatOrNull() ?: 75f,
                            prInterval.replace(",", ".").toFloatOrNull() ?: 160f,
                            qrsDuration.replace(",", ".").toFloatOrNull() ?: 90f,
                            stSegment.replace(",", ".").toFloatOrNull() ?: 1f,
                            qtcInterval.replace(",", ".").toFloatOrNull() ?: 380f
                        )
                    }
                )
            }
        }

        Text("Select your diagnosis", style = MaterialTheme.typography.labelMedium)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DropdownField(
                "Diagnosis",
                diagnoses,
                selectedDiagnosis,
                diagnosisExpanded,
                { diagnosisExpanded = it }) { selectedDiagnosis = it }


        }

        Spacer(Modifier.height(16.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    try {
                        if (heartRate.isBlank() || prInterval.isBlank() || qrsDuration.isBlank() ||
                            stSegment.isBlank() || qtcInterval.isBlank() || axis.isBlank()
                        ) {
                            Toast.makeText(context, "Please fill in all fields", Toast.LENGTH_SHORT)
                                .show()
                            return@Button
                        }

                        val hr = (heartRate.replace(",", ".").toFloat() - 30f) / (200f - 30f)
                        val pr = prInterval.replace(",", ".").toFloat() / 300f
                        val qrs = qrsDuration.replace(",", ".").toFloat() / 200f
                        val st = stSegment.replace(",", ".").toFloat() / 2f
                        val qt = qtcInterval.replace(",", ".").toFloat() / 600f
                        val ax = (axis.replace(",", ".").toFloat() + 180f) / 360f
                        val rhythmIndex =
                            rhythms.indexOf(selectedRhythm).toFloat() / (rhythms.size - 1)
                        val tWaveIndex = tWaves.indexOf(selectedTWave).toFloat() / (tWaves.size - 1)

                        val input = floatArrayOf(hr, pr, qrs, st, qt, ax, rhythmIndex, tWaveIndex)
                        val inputArray = arrayOf(input)
                        val output = Array(1) { FloatArray(6) }


                        val assetFileDescriptor = context.assets.openFd("ecg_model.tflite")
                        val inputStream = assetFileDescriptor.createInputStream()
                        val modelFile = File.createTempFile("model", ".tflite", context.cacheDir)
                        val outputStream = FileOutputStream(modelFile)
                        inputStream.copyTo(outputStream)
                        outputStream.close()


                        val interpreter = Interpreter(modelFile)
                        interpreter.run(inputArray, output)

                        val predictionIndex =
                            output[0].withIndex().maxByOrNull { it.value }?.index ?: -1
                        predictionConfidence = output[0][predictionIndex]
                        predictionResult = if (predictionIndex in 0..5) {
                            "Prediction: " + diagnoses[predictionIndex + 1]
                        } else {
                            "Prediction: Unknown"
                        }

                    } catch (e: Exception) {
                        predictionResult = "Prediction failed: ${e.message}"
                    }
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF13b400),
                    contentColor = Color.White
                )
            ) {
                Text("Predict")
            }
        }

        Spacer(Modifier.height(16.dp))

        // Result Card
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, contentDescription = "Prediction")
                    Spacer(Modifier.width(8.dp))
                    Text("Prediction Result", style = MaterialTheme.typography.titleMedium)
                }

                Spacer(Modifier.height(8.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = "Predicted Diagnosis")
                    Spacer(Modifier.width(8.dp))
                    Text(predictionResult, style = MaterialTheme.typography.bodyLarge)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Star, contentDescription = "Confidence")
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Confidence: ${String.format("%.2f", predictionConfidence * 100)}%",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                if (predictionResult.startsWith("Prediction:")) {
                    val predicted = predictionResult.removePrefix("Prediction: ").trim()
                    val isCorrect = predicted == selectedDiagnosis
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            if (isCorrect) Icons.Default.CheckCircle else Icons.Default.Close,
                            contentDescription = "Evaluation"
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(
                            if (isCorrect) " Correct diagnosis" else " Incorrect diagnosis",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = modelUrl,
            onValueChange = { modelUrl = it },
            label = { Text("Model update URL") },
            modifier = Modifier.fillMaxWidth()
        )
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val url = URL(modelUrl)
                            val conn = url.openConnection() as HttpURLConnection
                            conn.requestMethod = "GET"
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0")
                            conn.instanceFollowRedirects = true

                            if (conn.responseCode in 200..299) {
                                val modelFile = File(context.filesDir, "ecg_model.tflite")
                                conn.inputStream.use { input ->
                                    FileOutputStream(modelFile).use { output ->
                                        input.copyTo(output)
                                    }
                                }
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(context, "Model updated", Toast.LENGTH_SHORT)
                                        .show()
                                }
                            } else {
                                withContext(Dispatchers.Main) {
                                    Toast.makeText(
                                        context,
                                        "Failed: HTTP ${conn.responseCode}",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("ModelDownload", "Error downloading model", e)
                            withContext(Dispatchers.Main) {
                                Toast.makeText(
                                    context,
                                    "Failed to update model: ${e.localizedMessage ?: "unknown error"}",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        }
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Update Model")
            }


        }


    }
}

@Composable
fun NumberField(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(Modifier.height(8.dp))
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DropdownField(
    label: String,
    options: List<String>,
    selected: String,
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    onSelectedChange: (String) -> Unit
) {
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = onExpandedChange) {
        OutlinedTextField(
            readOnly = true,
            value = selected,
            onValueChange = {},
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { onExpandedChange(false) }) {
            options.forEach {
                DropdownMenuItem(text = { Text(it) }, onClick = {
                    onSelectedChange(it)
                    onExpandedChange(false)
                })
            }
        }
    }
}
