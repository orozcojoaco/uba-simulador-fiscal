// app.js - Script de conexión y manejo de gráficos

// URL del backend de Python
const BASE_URL = 'https://uba-fiscal-app.onrender.com';

const API_URL = `${BASE_URL}/simular`; 
const RESET_URL = `${BASE_URL}/reset`;

let anho = 1;
let chart;
let historial = [{ year: 0, pbi: 2.0, inflacion: 30.0, gini: 0.45 }]; // Estado inicial

// Función para actualizar el DOM con los nuevos datos
function updateUI(data) {
    document.getElementById('pbi-value').textContent = `${data.pbi}%`;
    document.getElementById('inflacion-value').textContent = `${data.inflacion}%`;
    document.getElementById('gini-value').textContent = data.gini.toFixed(2);
    
    // Aquí podrías añadir lógica de color (ej. PBI > 3.0 = verde, sino rojo)
    const pbiCardHeader = document.querySelector('#pbi-card .card-header');
    pbiCardHeader.className = data.pbi > 3.0 ? 'card-header bg-success text-white' : 'card-header bg-warning text-dark';
    
    // Añadir al historial
    historial.push({ year: anho, pbi: data.pbi, inflacion: data.inflacion, gini: data.gini });
    anho++;

    // Actualizar tabla de historial
    const tbody = document.getElementById('historial-body');
    const newRow = tbody.insertRow(-1);
    newRow.innerHTML = `<td>${historial[historial.length - 1].year}</td><td>${data.pbi}</td><td>${data.gini.toFixed(2)}</td>`;

    updateChart();
}

// Función para inicializar/actualizar el gráfico
function updateChart() {
    const ctx = document.getElementById('macroChart').getContext('2d');
    
    const years = historial.map(h => h.year === 0 ? 'Inicial' : `Año ${h.year}`);
    const pbiData = historial.map(h => h.pbi);
    const inflacionData = historial.map(h => h.inflacion);

    if (chart) {
        chart.data.labels = years;
        chart.data.datasets[0].data = pbiData;
        chart.data.datasets[1].data = inflacionData;
        chart.update();
        return;
    }
    
    // Inicializar el gráfico si es la primera vez
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'PBI Crecimiento (%)',
                data: pbiData,
                borderColor: '#0056B3', // Azul Primario
                tension: 0.1
            }, {
                label: 'Tasa de Inflación (%)',
                data: inflacionData,
                borderColor: '#DC3545', // Rojo Alerta
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}


// Evento principal al hacer clic en el botón 'Simular Año'
document.getElementById('simular-btn').addEventListener('click', async () => {
    // 1. Obtener las decisiones de los botones
    const gastoEl = document.querySelector('#gasto-buttons .active');
    const impuestoEl = document.querySelector('#impuesto-buttons .active');
    
    // 2. Crear el objeto de datos para enviar a Python
    const decisionData = {
        gasto: parseInt(gastoEl ? gastoEl.getAttribute('data-value') : 0),
        impuesto: parseInt(impuestoEl ? impuestoEl.getAttribute('data-value') : 0),
    };

    // 3. Enviar la petición POST al backend de Python
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(decisionData)
        });

        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        const data = await response.json();
        updateUI(data); // Actualizar la interfaz
        
    } catch (error) {
        console.error('Error al simular:', error);
        alert('Hubo un error al conectar con el servidor de simulación (Python).');
    }
});

// Evento para manejar la selección de botones
document.querySelectorAll('.btn-group .btn').forEach(button => {
    button.addEventListener('click', function() {
        // Desactivar todos los botones del mismo grupo
        this.closest('.btn-group').querySelectorAll('.btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('btn-success', 'btn-danger'); // Remover colores de estado
            btn.classList.add('btn-outline-secondary');
        });

        // Activar el botón clicado
        this.classList.add('active');
        this.classList.remove('btn-outline-secondary');
        
        // Aplicar color de estado
        const value = parseInt(this.getAttribute('data-value'));
        if (value === 1) {
            this.classList.add('btn-success');
        } else if (value === -1) {
            this.classList.add('btn-danger');
        }
    });
});

// Inicializar la interfaz y el gráfico al cargar la página
window.onload = () => {
    updateChart();
    // Añade aquí un botón o funcionalidad para resetear si deseas.
};