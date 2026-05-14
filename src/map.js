// Mostrar servicios cercanos (Gasolina, Parking, Comida)
function mostrarServicios(tipo) {
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: userLocation,
        radius: 2000,
        type: [tipo] // 'gas_station', 'restaurant', 'parking'
    }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach(place => {
                new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    icon: getIconoPersonalizado(tipo), // Usa tus iconos de Stitch
                    title: place.name
                });
            });
        }
    });
}