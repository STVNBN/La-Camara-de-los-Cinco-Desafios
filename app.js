const btnGetLocation      = document.getElementById('btn-get-location');
const btnReset            = document.getElementById('btn-reset');
const permissionStatusEl  = document.getElementById('permission-status');
const latitudeEl          = document.getElementById('latitude');
const longitudeEl         = document.getElementById('longitude');
const mapLatEl            = document.getElementById('map-lat');
const mapLngEl            = document.getElementById('map-lng');
const messageEl           = document.getElementById('message');
const btnAvanzarN2Wrapper = document.getElementById('btn-avanzar-n2-wrapper');
const btnAvanzarN2        = document.getElementById('btn-avanzar-n2');
const seccionNivel2       = document.getElementById('seccion-nivel2');
const btnDrawMap          = document.getElementById('btn-draw-map');
const btnClearMap         = document.getElementById('btn-clear-map');
const cartographyCanvas   = document.getElementById('cartography-canvas');
const level2MapMessage    = document.getElementById('level2-map-message');
const btnAvanzarN3Wrapper = document.getElementById('btn-avanzar-n3-wrapper');
const btnStartCamera      = document.getElementById('btn-start-camera');
const btnCapturePhoto     = document.getElementById('btn-capture-photo');
const videoStream         = document.getElementById('video-stream');
const photoCanvas         = document.getElementById('photo-canvas');
const photoPreview        = document.getElementById('photo-preview');
const photoPlaceholder    = document.getElementById('photo-placeholder');
const cameraErrorEl       = document.getElementById('camera-error');
const btnAvanzarN4Wrapper = document.getElementById('btn-avanzar-n4-wrapper');
const btnAvanzarN4        = document.getElementById('btn-avanzar-n4');

// Estado
let level1Completed = false;
let currentPosition = null;
let localStream = null;

// Permisos
function updatePermissionStatus() {
  if (!navigator.permissions) {
    permissionStatusEl.textContent = 'El navegador no soporta la API de permisos. Usa el botón para solicitar acceso.';
    permissionStatusEl.className = 'alert alert-warning small';
    return;
  }
  navigator.permissions.query({ name: 'geolocation' })
    .then((status) => {
      permissionStatusEl.textContent = `Estado de permisos: ${status.state}`;
      permissionStatusEl.className = 'alert alert-info small';
      status.onchange = () => {
        permissionStatusEl.textContent = `Estado de permisos: ${status.state}`;
      };
    })
    .catch(() => {
      permissionStatusEl.textContent = 'No se pudo comprobar el estado de permisos.';
      permissionStatusEl.className = 'alert alert-warning small';
    });
}

function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = `alert alert-${type}`;
  messageEl.classList.remove('d-none');
}

function clearMessage() {
  messageEl.className = 'alert d-none';
  messageEl.textContent = '';
}

// Geolocalización
function handleLocationError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      showMessage('Permiso denegado. No puedes avanzar sin permitir el acceso a tu ubicación.', 'danger');
      break;
    case error.POSITION_UNAVAILABLE:
      showMessage('Ubicación no disponible. Intenta nuevamente más tarde.', 'warning');
      break;
    case error.TIMEOUT:
      showMessage('Tiempo de espera agotado al obtener la ubicación.', 'warning');
      break;
    default:
      showMessage('Ocurrió un error al obtener la ubicación.', 'danger');
  }
}

function requestLocation() {
  if (!navigator.geolocation) {
    showMessage('Tu navegador no soporta geolocalización.', 'danger');
    return;
  }
  clearMessage();
  permissionStatusEl.textContent = 'Solicitando acceso a la ubicación...';
  permissionStatusEl.className = 'alert alert-info small';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      currentPosition = position.coords;
      latitudeEl.textContent = latitude.toFixed(6);
      longitudeEl.textContent = longitude.toFixed(6);
      showMessage('Ubicación obtenida correctamente. Nivel 1 completado.', 'success');
      permissionStatusEl.textContent = 'Permiso concedido. Puedes avanzar al Nivel 2.';
      permissionStatusEl.className = 'alert alert-success small';
      level1Completed = true;
      btnGetLocation.disabled = true;
      btnAvanzarN2Wrapper.classList.remove('d-none');
      mapLatEl.textContent = latitude.toFixed(6);
      mapLngEl.textContent = longitude.toFixed(6);
    },
    (error) => {
      handleLocationError(error);
      updatePermissionStatus();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// Avanzar Nivel 1 → 2 
btnAvanzarN2.addEventListener('click', () => {
  document.getElementById('seccion-nivel1').classList.add('d-none');
  seccionNivel2.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Canvas
function clearCanvas() {
  const ctx = cartographyCanvas.getContext('2d');
  ctx.clearRect(0, 0, cartographyCanvas.width, cartographyCanvas.height);
}

function drawMap() {
  if (!level1Completed || !currentPosition) return;

  const ctx   = cartographyCanvas.getContext('2d');
  const W     = cartographyCanvas.width;
  const H     = cartographyCanvas.height;

  ctx.clearRect(0, 0, W, H);

  // Fondo azul claro
  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(0, 0, W, H);

  // Rectángulo exterior con borde azul (área delimitada)
  const rx = 40, ry = 30, rw = W - 80, rh = H - 60;
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 3;
  ctx.strokeRect(rx, ry, rw, rh);

  // Cuadrícula interior — líneas verticales y horizontales (calles)
  const cols = 4, rows = 3;
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;

  for (let c = 1; c < cols; c++) {
    const x = rx + (rw / cols) * c;
    ctx.beginPath();
    ctx.moveTo(x, ry);
    ctx.lineTo(x, ry + rh);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    const y = ry + (rh / rows) * r;
    ctx.beginPath();
    ctx.moveTo(rx, y);
    ctx.lineTo(rx + rw, y);
    ctx.stroke();
  }

  // Indicador Norte
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('N', W - 28, ry + 16);
  ctx.font = '16px Arial';
  ctx.fillText('↑', W - 26, ry + 32);

  // Círculo rojo = ubicación actual
  const px = Math.min(Math.max(((currentPosition.longitude + 180) / 360) * rw + rx, rx + 15), rx + rw - 15);
  const py = Math.min(Math.max(((90 - currentPosition.latitude) / 180) * rh + ry, ry + 15), ry + rh - 15);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(px, py, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Tu Ubicación', px, py + 26);
  ctx.textAlign = 'left';

  level2MapMessage.innerHTML = '<div class="alert alert-success mt-2">Mapa dibujado y posición marcada. Nivel 2 completado.</div>';
  btnDrawMap.disabled = true;
  btnAvanzarN3Wrapper.classList.remove('d-none');
}

function showCameraError(text) {
  cameraErrorEl.textContent = text;
  cameraErrorEl.classList.remove('d-none');
}

function stopCamera() {
  if (!localStream) return;
  localStream.getTracks().forEach((track) => track.stop());
  localStream = null;
  videoStream.srcObject = null;
  btnStartCamera.disabled = false;
  btnCapturePhoto.disabled = true;
}

async function startCamera() {
  cameraErrorEl.classList.add('d-none');
  cameraErrorEl.textContent = '';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraError('Tu navegador no soporta el acceso a la cámara de video.');
    return;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    });

    videoStream.srcObject = localStream;
    btnCapturePhoto.disabled = false;
    btnStartCamera.disabled = true;
  } catch (error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      showCameraError('Permiso denegado. Debes permitir el acceso a la cámara para continuar.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      showCameraError('Cámara no encontrada. Asegúrate de conectar un dispositivo de video.');
    } else {
      showCameraError(`Error al acceder a la cámara: ${error.message}`);
    }
  }
}

function capturePhoto() {
  if (!localStream) {
    showCameraError('Inicia la cámara antes de capturar la foto.');
    return;
  }

  const width = videoStream.videoWidth || 640;
  const height = videoStream.videoHeight || 480;
  photoCanvas.width = width;
  photoCanvas.height = height;

  const ctx = photoCanvas.getContext('2d');
  ctx.drawImage(videoStream, 0, 0, width, height);

  const dataUrl = photoCanvas.toDataURL('image/png');
  photoPreview.src = dataUrl;
  photoPreview.classList.remove('d-none');
  photoPlaceholder.classList.add('d-none');
  btnAvanzarN4Wrapper.classList.remove('d-none');
  showMessage('Foto capturada con éxito. Nivel 3 completado.', 'success');
}

document.getElementById('btn-avanzar-n3').addEventListener('click', () => {
  document.getElementById('seccion-nivel2').classList.add('d-none');
  document.getElementById('seccion-nivel3').classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Eventos
btnGetLocation.addEventListener('click', requestLocation);
btnReset.addEventListener('click', () => {
  latitudeEl.textContent = '-';
  longitudeEl.textContent = '-';
  clearMessage();
  updatePermissionStatus();
  level1Completed = false;
  currentPosition = null;
  btnGetLocation.disabled = false;
  btnAvanzarN2Wrapper.classList.add('d-none');
});
btnDrawMap.addEventListener('click', drawMap);
btnClearMap.addEventListener('click', () => {
  clearCanvas();
  level2MapMessage.innerHTML = '';
  btnDrawMap.disabled = false;
  btnAvanzarN3Wrapper.classList.add('d-none');
});

btnStartCamera.addEventListener('click', startCamera);
btnCapturePhoto.addEventListener('click', capturePhoto);

// Init 
updatePermissionStatus();

// Init 
updatePermissionStatus();
// Avanzar Nivel 3 → 4
document.getElementById('btn-avanzar-n4').addEventListener('click', function () {
  stopCamera();
  document.getElementById('seccion-nivel3').classList.add('d-none');
  document.getElementById('seccion-nivel4').classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Nivel 4 — procesamiento con Web Worker
document.getElementById('btn-iniciar-n4').addEventListener('click', function () {
  const btn      = document.getElementById('btn-iniciar-n4');
  const wrapper  = document.getElementById('progreso-n4-wrapper');
  const barra    = document.getElementById('barra-n4');
  const statsDiv = document.getElementById('stats-n4');

  btn.disabled = true;
  wrapper.classList.remove('d-none');
  statsDiv.classList.add('d-none');

  // Generar 20,000 datos
  const datos = [];
  for (let i = 0; i < 20000; i++) {
    datos.push({
      temperatura: +(Math.random() * 60 - 10).toFixed(2),  // -10 a 50 °C
      humedad:     +(Math.random() * 100).toFixed(2),       // 0 a 100 %
    });
    }

  const worker = new Worker('worker-nivel4.js');
  worker.postMessage(datos);

  worker.onmessage = function (e) {
    const msg = e.data;
    if (msg.tipo === 'progreso') {
      barra.style.width = msg.porcentaje + '%';
      barra.textContent = msg.porcentaje + '%';
    }
    if (msg.tipo === 'resultado') {
      barra.style.width = '100%';
      barra.textContent = '100%';
      barra.classList.remove('progress-bar-animated', 'progress-bar-striped');
      barra.classList.add('bg-success');

      document.getElementById('n4-temp-prom').textContent = msg.temperatura.promedio + ' °C';
      document.getElementById('n4-temp-max').textContent  = msg.temperatura.maximo   + ' °C';
      document.getElementById('n4-temp-min').textContent  = msg.temperatura.minimo   + ' °C';
      document.getElementById('n4-hum-prom').textContent  = msg.humedad.promedio     + ' %';
      document.getElementById('n4-hum-max').textContent   = msg.humedad.maximo       + ' %';
      document.getElementById('n4-hum-min').textContent   = msg.humedad.minimo       + ' %';

      statsDiv.classList.remove('d-none');
      worker.terminate();
    }
  };
});

document.getElementById('btn-avanzar-n5').addEventListener('click', function () {
  document.getElementById('seccion-nivel4').classList.add('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});