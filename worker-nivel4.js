// worker-nivel4.js
self.onmessage = function(e) {
  const datos = e.data;
  const total = datos.length;

  let sumTemp = 0, sumHum = 0;
  let maxTemp = -Infinity, minTemp = Infinity;
  let maxHum  = -Infinity, minHum  = Infinity;

  for (let i = 0; i < total; i++) {
    const t = datos[i].temperatura;
    const h = datos[i].humedad;

    sumTemp += t;
    sumHum  += h;
    if (t > maxTemp) maxTemp = t;
    if (t < minTemp) minTemp = t;
    if (h > maxHum)  maxHum  = h;
    if (h < minHum)  minHum  = h;

    if (i % 2000 === 0) {
      self.postMessage({ tipo: 'progreso', porcentaje: Math.round((i / total) * 100) });
    }
  }

  self.postMessage({
    tipo: 'resultado',
    temperatura: {
      promedio: (sumTemp / total).toFixed(2),
      maximo:   maxTemp.toFixed(2),
      minimo:   minTemp.toFixed(2),
    },
    humedad: {
      promedio: (sumHum / total).toFixed(2),
      maximo:   maxHum.toFixed(2),
      minimo:   minHum.toFixed(2),
    },
    totalRegistros: total
  });
};
