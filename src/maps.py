import http.server
import socketserver
import json
import googlemaps # Debes instalarlo: pip install googlemaps
import sqlite3

# Tu API Key de Google Cloud
API_KEY = 'TU_API_KEY_AQUI'
gmaps = googlemaps.Client(key=API_KEY)

class GoogleMapsHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/calcular_ruta':
            content_length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(content_length))
            
            # 1. Obtener la ruta desde Google Maps API
            directions_result = gmaps.directions(data['origen'], data['destino'], mode="driving")
            
            # 2. Registrar automáticamente (Persistencia)
            self.guardar_en_bd(data['origen'], data['destino'], directions_result[0]['legs'][0]['distance']['text'])
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(directions_result).encode())

    def guardar_en_bd(self, ori, dest, dist):
        conn = sqlite3.connect('navegacion.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO rutas (origen, destino, distancia) VALUES (?, ?, ?)", (ori, dest, dist))
        conn.commit()
        conn.close()

with socketserver.TCPServer(("", 8000), GoogleMapsHandler) as httpd:
    print("Servidor corriendo en el puerto 8000...")
    httpd.serve_forever()