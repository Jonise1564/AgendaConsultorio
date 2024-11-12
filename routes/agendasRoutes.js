const express = require('express');
const AgendasRouter = express.Router()
const AgendasControllers = require('../controllers/agendasControllers');

// Index
AgendasRouter.get('/', AgendasControllers.get);

// redirigir a la vista crear
AgendasRouter.get('/create', AgendasControllers.create);

// Guardar nuevo agendas (POST para la ruta raíz, si es necesario)
AgendasRouter.post('/', AgendasControllers.store);

// Vista editar
AgendasRouter.get('/edit/:id', AgendasControllers.edit);

// Actualizar agendas
AgendasRouter.post('/update/:id', AgendasControllers.update);

// Eliminar agendas
//AgendasRouter.post('/activar/:dni', AgendasControllers.activar)
//inactivar
//AgendasRouter.post('/inactivar/:dni', AgendasControllers.inactivar);


module.exports = AgendasRouter