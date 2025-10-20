const answer = {
    code: 200,
    message: '',
    body: {},
};

// Data
const data = {
    error: -1,
    distanciaCm: -1,
    nivelAguaCm: -1,
    porcentajeAgua: -1,
    lastUpdated: new Date().toISOString()
};

const errorResponse = {
    code: 500,
    message: ''
};

const getErrorMessage = (code) => {
    switch(code) {
        case 1:
            return "El tinaco esta destapado.";   
        case 2:
            return "Hay un desbordamiento.";
        case 3:
            return "No se detecto el sensor.";
        case 4:
            return "El tinaco esta completamente vacio.";
        default:
            return "Sin error reportado.";
    }
};

const setData = (newData) => {
   try {
        const { error, distanciaCm, nivelAguaCm, porcentajeAgua } = newData;

        // ** Validación básica de datos recibidos **
        if (typeof error === 'undefined' || typeof distanciaCm === 'undefined') {
            errorResponse.message = 'Faltan parámetros JSON requeridos.';
            return errorResponse;
        }

        //Set data
        data.error = parseInt(error);
        data.errorMessage = getErrorMessage(parseInt(error));
        data.distanciaCm = parseFloat(distanciaCm);
        data.nivelAguaCm = parseFloat(nivelAguaCm);
        data.porcentajeAgua = parseFloat(porcentajeAgua);
        data.lastUpdated = new Date().toISOString();

        answer.message = 'Datos establecidos correctamente.';
        answer.body = data;
        return answer;

   } catch (error) {
        console.error("Error al procesar POST /update:", error);
        errorResponse.message = 'Error interno del servidor: ' + error.message;
        return errorResponse;
   }
}

const getData = () => {
    try {
        const formattedData = {
            error: data.error,
            errorMessage: data.errorMessage,
            distanciaCm: data.distanciaCm + "cm",
            nivelAguaCm: data.nivelAguaCm + "cm",
            porcentajeAgua: data.porcentajeAgua + "%",
            lastUpdated: data.lastUpdated
        };

        answer.message = 'Data retrieved successfully';
        answer.body = formattedData;
        return answer;

    } catch (error) {
        console.error("Error al procesar GET /data:", error);
        errorResponse.message = 'Error al recuperar datos: ' + error.message;
        return errorResponse;
    }
}

module.exports = {
    setData,
    getData
};