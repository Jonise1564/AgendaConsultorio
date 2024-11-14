const createConnection = require('../config/configDb');
const Usuario = require('./usuariosModels'); // clase padre

class Medico extends Usuario {
    constructor(id, dni, nombre, apellido, nacimiento, email, password, id_rol, estado, especialidades, matriculas, telefonos) {
        super(id, dni, nombre, apellido, nacimiento, email, password, id_rol);
        this.estado = estado
        this.especialidades = especialidades
        this.matriculas = matriculas
        this.telefonos = telefonos
    }
    //Mostrar todos
    static async getAll() {
        console.log('Model: Get All medicos');
        let conn;
        try {
            conn = await createConnection();
            const [medicos] = await conn.query(`
                SELECT 
    u.id, 
    u.dni, 
    p.nombre, 
    p.apellido, 
    p.nacimiento, 
    u.email, 
    u.password, 
    u.id_rol, 
    m.estado, 
    GROUP_CONCAT(DISTINCT e.nombre SEPARATOR ', ') AS especialidades, 
    GROUP_CONCAT(DISTINCT me.matricula SEPARATOR ', ') AS matriculas, 
    GROUP_CONCAT(DISTINCT t.numero SEPARATOR ', ') AS telefonos, 
    GROUP_CONCAT(DISTINCT os.nombre SEPARATOR ', ') AS obras_sociales
FROM 
    medicos m 
JOIN 
    usuarios u ON m.id_usuario = u.id 
JOIN 
    personas p ON u.dni = p.dni 
LEFT JOIN 
    medico_especialidad me ON m.id_usuario = me.id_medico
LEFT JOIN 
    medico_obra_social mo ON m.id_usuario = mo.id_medico
LEFT JOIN 
    obras_sociales os ON mo.id_obra_social = os.id
LEFT JOIN 
    especialidades e ON me.id_especialidad = e.id 
LEFT JOIN 
    telefonos t ON u.id = t.id_usuario 
GROUP BY 
    u.id, 
    u.dni, 
    p.nombre, 
    p.apellido, 
    p.nacimiento, 
    u.email, 
    u.password, 
    u.id_rol, 
    m.estado;

            
            `);

            return medicos.map(medico => new Medico(
                medico.id,
                medico.dni,
                medico.nombre,
                medico.apellido,
                medico.nacimiento,
                medico.email,
                medico.password,
                medico.id_rol,
                medico.estado,
                medico.especialidades,
                medico.matriculas,
                medico.telefonos
            ));
        } catch (error) {
            console.error('Error fetching medicos:', error);
            throw new Error('Error al traer medicos desde el modelo');
        } finally {
            if (conn) conn.end();
        }
    }
    //insertar medico
    static async create({ id_usuario, estado, especialidades, telefonos, matricula }) {
        console.log('Model: Create medico');
        let conn;
        try {
            conn = await createConnection();
            await conn.beginTransaction();

            // Insertar en la tabla medicos
            const [resultMedicos] = await conn.query(`
                INSERT INTO medicos (id_usuario, estado)
                VALUES (?, ?)
            `, [id_usuario, estado]);

            if (resultMedicos.affectedRows === 0) {
                throw new Error('Error al insertar en la tabla medicos');
            }

            // Verificar si la matrícula ya existe en la tabla medico_especialidad
            const [resultMatriculas] = await conn.query(`
                SELECT matricula FROM medico_especialidad WHERE matricula = ?;
            `, [matricula]);

            if (resultMatriculas.length > 0) {
                console.error('Model: Matricula duplicada para medico', matricula);
                throw new Error('Matrícula duplicada');
            }

            // Insertar en la tabla medico_especialidades
            const [resultEspecialidades] = await conn.query(`
                INSERT INTO medico_especialidad (id_medico, id_especialidad, matricula)
                VALUES (?, ?, ?)
            `, [id_usuario, especialidades, matricula]);

            if (resultEspecialidades.affectedRows === 0) {
                throw new Error('Error al insertar en la tabla medico_especialidad');
            }

            // Insertar en la tabla telefonos
            const [resultTelefonos] = await conn.query(`
                INSERT INTO telefonos (id_usuario, numero)
                VALUES (?, ?)
            `, [id_usuario, telefonos]);

            if (resultTelefonos.affectedRows === 0) {
                throw new Error('Error al insertar en la tabla telefonos');
            }

            await conn.commit();
            return id_usuario;
        } catch (error) {
            if (conn) await conn.rollback();
            console.error('Error creating medico:', error);
            throw new Error('Error al crear medico');
        } finally {
            if (conn) conn.end();
        }
    }
    //Traer especialidades del medico por el dni
    static async getEspecialidadesById(dni) {
        let conn;
        try {
            conn = await createConnection();
            const [medico_especialidad] = await conn.query(`
                SELECT GROUP_CONCAT(DISTINCT me.id_especialidad SEPARATOR ', ') AS Id,
                 GROUP_CONCAT(DISTINCT e.nombre SEPARATOR ', ') AS especialidades, 
                GROUP_CONCAT(DISTINCT me.matricula SEPARATOR ', ') AS matriculas 
                FROM medico_especialidad me 
                LEFT JOIN especialidades e ON me.id_especialidad = e.id 
                JOIN usuarios u ON me.id_medico = u.id 
                WHERE u.dni = ? 
                GROUP BY u.dni;
            `, [dni]);

            return medico_especialidad;
        } catch (error) {
            console.error('Error fetching especialidades, matricula, and estado:', error);
            throw new Error('Error al traer especialidades, matrícula y estado desde el modelo');
        } finally {
            if (conn) conn.end();
        }
    }

    static async getEspecialidadesByDni(dni) {
        let conn;
        try {
            conn = await createConnection();
            const [medico_especialidad] = await conn.query(`
               SELECT 
                    me.id_especialidad AS Id,
                    e.nombre AS nombreEsp,
                    GROUP_CONCAT(me.matricula) AS matricula,
                    me.id_medico AS idmedico,
                    me.estado
                FROM 
                    medico_especialidad me 
                LEFT JOIN 
                    especialidades e ON me.id_especialidad = e.id 
                JOIN 
                    usuarios u ON me.id_medico = u.id 
                WHERE 
                    u.dni = ?
                GROUP BY 
                    me.id_especialidad, e.nombre, me.estado,me.id_medico;
            `, [dni]);

            return medico_especialidad;
        } catch (error) {
            console.error('Error fetching especialidades, matricula, and estado:', error);
            throw new Error('Error al traer especialidades, matrícula y estado desde el modelo');
        } finally {
            if (conn) conn.end();
        }
    }


    static async getMedicoById(id) {
        console.log(`Model: getByDni medico id: ${id}`);
        try {
            const conn = await createConnection();
            console.log('Conexión a la base de datos establecida');

            const [medico] = await conn.query('SELECT * FROM medicos WHERE id_usuario = ?', [id]);
            if (!medico || medico.length === 0) {
                console.log('Model MEDICOS: No se encontró ningún medico');
                return null;
            }
            console.log('Model: Resultado de la consulta medico:', medico);
            return medico[0]; // Devolver el primer objeto del array
        } catch (error) {
            console.error('Error al obtener medico por id:', error);
            throw error;
        }
    }

    static async getAllMatriculas() {
        console.log('Model: matriculas getall');
        let conn;
        try {
            conn = await createConnection();
            const [matriculasData] = await conn.query(`
                SELECT p.nombre nombre, p.apellido apellido, me.matricula matricula, e.nombre nombreMat
                FROM medico_especialidad me
                JOIN usuarios u ON me.id_medico = u.id
                JOIN personas p ON u.dni = p.dni
                JOIN especialidades e ON me.id_especialidad = e.id 
            `);
            if (!matriculasData || matriculasData.length === 0) {
                console.log('Model agenda: No se encontró ninguna matricula');
                throw new Error('Ha ocurrido un error inesperado');
            }
            return matriculasData;
        } catch (error) {
            console.error('Error al obtener matriculas', error);
            throw new Error('Ha ocurrido un error al traer matriculas');
        } finally {
            if (conn) conn.end();
        }
    }
    
    // update medico SIN USO NO DISPONIBLE
    static async updateMedico(id, updates) {
        console.log('Model: update medico');
        try {
            const conn = await createConnection();

            // Construir la consulta de actualización dinámica
            const fields = [];
            const values = [];
            for (const [key, value] of Object.entries(updates)) {
                fields.push(`${key} = ?`);
                values.push(value);
            }
            values.push(id); // Añadir el id al final para la cláusula WHERE

            const query = `UPDATE medicos SET ${fields.join(', ')} WHERE id = ?;`;
            const [result] = await conn.query(query, values);

            console.log('Model: Medico actualizado exitosamente');
            return result.affectedRows === 1;
        } catch (error) {
            console.error('Error al modificar Medico desde el modelo:', error);
            throw new Error('Error al modificar medico desde el modelo');
        }
    }
    // Delete logico
    //Inactivo
    static async inactivarMedico(id) {
        console.log('Model Medico: inactivar medico');
        try {
            const conn = await createConnection();
            const query = 'UPDATE medicos SET estado = 0 WHERE id_usuario = ?';
            const [result] = await conn.query(query, [id]);

            console.log('Resultado de la consulta SQL:', result);
            console.log('Filas afectadas:', result.affectedRows);

            if (result.affectedRows === 0) {
                throw new Error('No se encontró el médico con el id proporcionado');
            }

            console.log('Model: Médico inactivado exitosamente');
            return result.affectedRows === 1;
        } catch (error) {
            console.error('Error al inactivar médico desde el modelo:', error);
            throw new Error('Error al inactivar médico desde el modelo');
        }
    }

    //Activo
    static async activarMedico(id) {
        console.log('Model Medico: activar medico');
        try {
            const conn = await createConnection();
            const query = 'UPDATE medicos SET estado = 1 WHERE id_usuario = ?';
            const [result] = await conn.query(query, [id]);

            console.log('Resultado de la consulta SQL:', result);
            console.log('Filas afectadas:', result.affectedRows);

            if (result.affectedRows === 0) {
                throw new Error('No se encontró el médico con el id proporcionado');
            }

            console.log('Model: Médico activado exitosamente');
            return result.affectedRows === 1;
        } catch (error) {
            console.error('Error al activar médico desde el modelo:', error);
            throw new Error('Error al activar médico desde el modelo');
        }
    }
    static async activarEspecialidad(id) {
        console.log('Model Medico: activar Especialidad medico');
        try {
            const conn = await createConnection();
            const query = 'UPDATE medico_especialidad SET estado = 1 WHERE id_especialidad = ?';
            const [result] = await conn.query(query, [id]);  

            console.log('Resultado de la consulta SQL:', result);
            console.log('Filas afectadas:', result.affectedRows);

            if (result.affectedRows === 0) {
                throw new Error('No se encontró la especialidad con el id proporcionado');
            }

            console.log('Model: Especialidad activada exitosamente');
            return result.affectedRows === 1;
        } catch (error) {
            console.error('Error al activar especialidad desde el modelo:', error);
            throw new Error('Error al activar especialidad desde el modelo');
        }
    }
// static async inactivarEspecialidad(id) {
//     console.log('Model Medico: inactivar Especialidad Medico');
//     console.log(id);
//     try {    
//         const conn = await createConnection();
//         const query = 'UPDATE medico_especialidad SET estado = 0 WHERE id_especialidad = ?';
//         const [result] = await conn.query(query, [id]);  

//         console.log('Resultado de la consulta SQL:', result);    
//         console.log('Filas afectadas:', result.affectedRows);

//         if (result.affectedRows === 0) {    
//             throw new Error('No se encontró la especialidad con el id proporcionado');
//         }

//         console.log('Model: Especialidad inactivada exitosamente');
//         return result.affectedRows === 1;
//     } catch (error) {
//         console.error('Error al inactivar especialidad desde el modelo:', error);
//         throw new Error('Error al inactivar especialidad desde el modelo');
//     }   

//     }
static async inactivarEspecialidad(id_medico, id_especialidad) {
    console.log('Model Medico: inactivar Especialidad Medico');
    console.log(`id_medico: ${id_medico}, id_especialidad: ${id_especialidad}`);
    try {    
        const conn = await createConnection();
        const query = 'UPDATE medico_especialidad SET estado = 0 WHERE id_medico = ? AND id_especialidad = ?';
        const [result] = await conn.query(query, [id_medico, id_especialidad]);  

        console.log('Resultado de la consulta SQL:', result);    
        console.log('Filas afectadas:', result.affectedRows);

        if (result.affectedRows === 0) {    
            throw new Error('No se encontró la especialidad con el id proporcionado');
        }

        console.log('Model: Especialidad inactivada exitosamente');
        return result.affectedRows === 1;
    } catch (error) {
        console.error('Error al inactivar especialidad desde el modelo:', error);
        throw new Error('Error al inactivar especialidad desde el modelo');
    } finally {
        if (conn) conn.end();
    }
}

}
module.exports = Medico;



