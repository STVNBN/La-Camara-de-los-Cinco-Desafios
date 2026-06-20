// worker-nivel5.js
self.onmessage = function(e) {
  const datos = e.data;
  const total = datos.length;
  const batchSize = 10000;
  let currentIndex = 0;

  // Accumulated results for valid records
  let validCount = 0;
  let sumTemp = 0;
  let sumHum = 0;
  let sumPres = 0;

  // Helper arrays for top 10 (sorted descending, max length 10)
  const topTemps = [];
  const topPressures = [];

  function insertIntoTop10(arr, val) {
    if (arr.length < 10) {
      arr.push(val);
      arr.sort((a, b) => b - a);
    } else if (val > arr[9]) {
      arr[9] = val;
      arr.sort((a, b) => b - a);
    }
  }

  function processNextBatch() {
    const end = Math.min(currentIndex + batchSize, total);

    for (let i = currentIndex; i < end; i++) {
      const record = datos[i];
      const t = record.temperatura;
      const h = record.humedad;
      const p = record.presion;

      // Filter negative values: a record is valid only if all fields are non-negative
      if (t >= 0 && h >= 0 && p >= 0) {
        validCount++;
        sumTemp += t;
        sumHum += h;
        sumPres += p;

        insertIntoTop10(topTemps, t);
        insertIntoTop10(topPressures, p);
      }
    }

    currentIndex = end;
    const porcentaje = Math.round((currentIndex / total) * 100);
    self.postMessage({ tipo: 'progreso', porcentaje: porcentaje });

    if (currentIndex < total) {
      // Yield execution to the browser's event loop to prevent blocking the worker's thread
      // and allow the main thread to handle messages smoothly
      setTimeout(processNextBatch, 10);
    } else {
      // Calculate averages
      const avgTemp = validCount > 0 ? (sumTemp / validCount) : 0;
      const avgHum = validCount > 0 ? (sumHum / validCount) : 0;
      const avgPres = validCount > 0 ? (sumPres / validCount) : 0;

      // Filter valid records for export
      const validRecords = datos.filter(d => d.temperatura >= 0 && d.humedad >= 0 && d.presion >= 0);

      // Stringify JSON in the worker thread to prevent freezing the main UI thread during download generation
      const resultadoJson = JSON.stringify({
        titulo: "Resultados - Nivel 5: El Portal Cuántico",
        fecha: new Date().toISOString(),
        resumen: {
          total_registros_simulados: total,
          registros_validos_procesados: validCount,
          registros_descartados_negativos: total - validCount,
          promedio_temperatura_c: avgTemp.toFixed(2),
          promedio_humedad_porcentaje: avgHum.toFixed(2),
          promedio_presion_hpa: avgPres.toFixed(2)
        },
        top_10_temperaturas_c: topTemps,
        top_10_presiones_hpa: topPressures,
        datos_validos: validRecords
      }, null, 2);

      self.postMessage({
        tipo: 'resultado',
        promedios: {
          temperatura: avgTemp.toFixed(2),
          humedad: avgHum.toFixed(2),
          presion: avgPres.toFixed(2)
        },
        top10Temperaturas: topTemps,
        top10Presiones: topPressures,
        validos: validCount,
        total: total,
        resultadoJson: resultadoJson
      });
    }
  }

  processNextBatch();
};
