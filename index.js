const express = require('express')
const bodyParser = require('body-parser')
const pug = require('pug')
const app = express()
const path = require('path');
const morgan = require('morgan')
const cors = require('cors');

const PORT = process.env.PORT ?? 3000

app.use(express.static(path.join(__dirname, 'public')));

const MedicosRouter = require('./routes/medicosRoutes');
const EspecialidadesRoutes = require('./routes/especialidadesRoutes');

const PacientesRouter = require('./routes/pacientesRoutes')
const AgendasRouter = require('./routes/agendasRoutes')
const TurnosRouter = require('./routes/turnosRoutes');
const obrasSocialesRouter = require('./routes/obrassocialesRoutes');


const Especialidad = require('./models/especialidadesModels');



app.set('view engine', 'pug')
app.set('views', 'views')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Configurar Morgan para registrar solicitudes en la consola
//usar 'combined', 'common', 'dev', 'short', 'tiny' según tus necesidades
app.use(morgan('dev'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors());
// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error status:', res.statusCode);
    console.error('Error message:', err.message);
    console.error('Stack trace:', err.stack);
    res.status(500).send('Something broke!');
});
// Ruta para la página de inicio
app.get('/', (req, res) => {
    res.render('principal/index'); 
  });

app.use('/medicos', MedicosRouter);
//Gestion especialidades
app.use('/especialidades', EspecialidadesRoutes);
//Gestion Pacientes
app.use('/pacientes', PacientesRouter)
//Gestion Agendas
app.use('/agendas', AgendasRouter)
//Gestion Turnos
app.use('/turnos', TurnosRouter)
//Gestion obras sociales
app.use('/obrassociales', obrasSocialesRouter)
  
app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`)
})