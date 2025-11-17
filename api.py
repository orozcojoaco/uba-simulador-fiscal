# api.py - Backend en Python
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS # Necesario para la comunicación entre el HTML y Python

# 1. Configuración de la App Flask
app = Flask(__name__)
CORS(app) # Permite que el HTML (Frontend) haga peticiones a este servidor

# 2. Estado Económico Global (Se mantiene entre peticiones para simular años)
class EstadoEconomico:
    def __init__(self, pbi, inflacion, gini, confianza):
        self.PBI_Crecimiento_Anual = pbi
        self.Tasa_Inflacion = inflacion
        self.Coeficiente_Gini = gini
        self.Confianza_Mercado = confianza

# Estado Inicial del País
estado_actual = EstadoEconomico(
    pbi=2.0, 
    inflacion=30.0, 
    gini=0.45, 
    confianza=0.5
)

# --- FUNCIÓN CENTRAL: LA LÓGICA DEL SIMULADOR (Traducción del C++) ---
def simular_ajuste(estado, cambio_gasto, cambio_impuesto):
    
    # 1. Efecto del Gasto Público (G)
    if cambio_gasto == 1:
        estado.PBI_Crecimiento_Anual += 1.5
        estado.Tasa_Inflacion += 2.0
        estado.Confianza_Mercado -= 0.1
    elif cambio_gasto == -1:
        estado.PBI_Crecimiento_Anual -= 1.0
        estado.Tasa_Inflacion -= 1.5
        estado.Confianza_Mercado += 0.15
        
    # 2. Efecto del Impuesto a la Riqueza (T)
    if cambio_impuesto == 1:
        estado.Coeficiente_Gini -= 0.03
        estado.PBI_Crecimiento_Anual -= 0.5
        estado.Confianza_Mercado -= 0.1
    elif cambio_impuesto == -1:
        estado.Coeficiente_Gini += 0.01
        estado.Confianza_Mercado += 0.05
        
    # 3. Ajustes Finales (Interacciones)
    estado.PBI_Crecimiento_Anual += (estado.Confianza_Mercado - 0.5) * 1.0
    
    # Limitar y ajustar valores
    estado.Tasa_Inflacion = max(0.5, estado.Tasa_Inflacion)
    estado.Coeficiente_Gini = min(max(0.3, estado.Coeficiente_Gini), 0.6)
    estado.PBI_Crecimiento_Anual = min(6.0, estado.PBI_Crecimiento_Anual)


@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

# --- ENDPOINT WEB (La URL que llama el navegador) ---
@app.route('/simular', methods=['POST'])
def simular_anho():
    global estado_actual
    
    # Obtener las decisiones enviadas por el Frontend (index.html)
    data = request.json
    cambio_gasto = int(data.get('gasto', 0))
    cambio_impuesto = int(data.get('impuesto', 0))

    # Ejecutar la lógica del simulador
    simular_ajuste(estado_actual, cambio_gasto, cambio_impuesto)

    # Devolver los resultados al Frontend
    return jsonify({
        'pbi': round(estado_actual.PBI_Crecimiento_Anual, 2),
        'inflacion': round(estado_actual.Tasa_Inflacion, 2),
        'gini': round(estado_actual.Coeficiente_Gini, 2),
        'confianza': round(estado_actual.Confianza_Mercado, 2)
    })

# Ruta para reiniciar la simulación
@app.route('/reset', methods=['POST'])
def reset_simulacion():
    global estado_actual
    estado_actual = EstadoEconomico(pbi=2.0, inflacion=30.0, gini=0.45, confianza=0.5)
    return jsonify({'message': 'Simulación reiniciada', 'pbi': 2.0, 'gini': 0.45})


if __name__ == '__main__':
    # Ejecuta el servidor en http://127.0.0.1:5000
    app.run(debug=True)