window.onload = () => {
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const transcript = document.getElementById('transcript');
  const status = document.getElementById('status');
  const generateSummaryBtn = document.getElementById('generateSummaryBtn');
  const summaryOutput = document.getElementById('summaryOutput');
  const detailLevel = document.getElementById('detailLevel');
  const summaryStyle = document.getElementById('summaryStyle');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const exportSummaryBtn = document.getElementById('exportSummaryBtn');
  const wordCount = document.getElementById('wordCount');

  let recognitionStarted = false;
  let recognition;

  // 🎙️ Inicializar reconocimiento de voz
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript.value += event.results[i][0].transcript + ' ';
      }
    };

    recognition.onend = () => {
      recognitionStarted = false;
    };

    startBtn.onclick = () => {
      if (!recognitionStarted) {
        recognition.start();
        recognitionStarted = true;
        status.textContent = '🎙️ Grabando...';
      } else {
        status.textContent = '⚠️ Ya está grabando.';
      }
    };

    pauseBtn.onclick = () => {
      recognition.stop();
      status.textContent = '⏸️ Grabación pausada.';
    };

    stopBtn.onclick = () => {
      recognition.stop();
      status.textContent = '🛑 Grabación detenida.';
    };
  } else {
    alert('Tu navegador no soporta reconocimiento de voz.');
  }

  // 🧹 Limpiar campos
  clearBtn.onclick = () => {
    transcript.value = '';
    summaryOutput.value = '';
    wordCount.textContent = '';
    status.textContent = '🧹 Texto limpiado.';
  };

  // 🤖 Generar resumen usando backend
  generateSummaryBtn.onclick = async () => {
    const text = transcript.value.trim();
    const level = detailLevel.options[detailLevel.selectedIndex].value;
    const style = summaryStyle.options[summaryStyle.selectedIndex].value;

    if (!text) {
      alert('No hay texto para resumir.');
      return;
    }

    status.textContent = '🔄 Generando resumen...';

    try {
      const response = await fetch('http://localhost:3000/resumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, level, style })
      });

      const data = await response.json();
      const summary = data.summary || 'Resumen no disponible.';
      summaryOutput.value = summary;

      const originalWords = text.split(/\s+/).filter(Boolean).length;
      const summaryWords = summary.split(/\s+/).filter(Boolean).length;
      wordCount.textContent = `Original: ${originalWords} palabras | Resumen: ${summaryWords} palabras`;

      status.textContent = '✅ Resumen generado con éxito.';

      const history = JSON.parse(localStorage.getItem('resumenes')) || [];
      history.push({
        original: text,
        resumen: summary,
        estilo: style,
        nivel: level,
        fecha: new Date().toISOString()
      });
      localStorage.setItem('resumenes', JSON.stringify(history));
    } catch (error) {
      console.error('❌ Error al generar resumen:', error);
      status.textContent = '❌ Error al generar resumen.';
    }
  };

  // 📋 Copiar resumen
  copySummaryBtn.onclick = () => {
    if (summaryOutput.value.trim()) {
      navigator.clipboard.writeText(summaryOutput.value);
      status.textContent = '📋 Resumen copiado.';
    } else {
      status.textContent = '⚠️ No hay resumen para copiar.';
    }
  };

  // 📁 Exportar resumen como archivo .txt
  exportSummaryBtn.onclick = () => {
    if (summaryOutput.value.trim()) {
      const blob = new Blob([summaryOutput.value], { type: 'text/plain' });
      const link = document.createElement('a');
      const style = summaryStyle.options[summaryStyle.selectedIndex].value;
      const level = detailLevel.options[detailLevel.selectedIndex].value;
      link.href = URL.createObjectURL(blob);
      link.download = `resumen_${style}_${level}_${new Date().toISOString().slice(0,10)}.txt`;
      link.click();
      status.textContent = '📁 Archivo descargado.';
    } else {
      status.textContent = '⚠️ No hay resumen para exportar.';
    }
  };
};
