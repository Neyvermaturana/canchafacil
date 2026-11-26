
// ==========================================
// CANCHAFÁCIL - SISTEMA DE RESERVAS
// ==========================================

const PRECIO_HORA = 60000;
const CLAVE_RESERVAS = "canchafacil_reservas";
const ANTICIPACION_MINIMA_CANCELACION_MS = 2 * 60 * 60 * 1000;

// ==========================================
// HORARIOS DISPONIBLES
// ==========================================

const HORARIOS = [
    "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00",
    "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00"
];

// ==========================================
// ELEMENTOS HTML
// ==========================================

const formulario = document.getElementById("reserva-form");
const campoNombre = document.getElementById("nombre");
const campoTelefono = document.getElementById("telefono");
const campoFecha = document.getElementById("fecha");
const campoHora = document.getElementById("hora");
const disponibilidad = document.getElementById("disponibilidad");
const listaReservas = document.getElementById("lista-reservas");
const totalReservas = document.getElementById("total-reservas");
const horariosOcupados = document.getElementById("horarios-ocupados");
const mensaje = document.getElementById("mensaje");

// ==========================================
// OBTENER RESERVAS GUARDADAS
// ==========================================

function obtenerReservas() {
    try {
        const datos = localStorage.getItem(CLAVE_RESERVAS);
        if (!datos) return [];

        const reservas = JSON.parse(datos);
        return Array.isArray(reservas) ? reservas : [];
    } catch (error) {
        console.error("Error leyendo reservas:", error);
        return [];
    }
}

// ==========================================
// GUARDAR RESERVAS
// ==========================================

function guardarReservas(reservas) {
    try {
        localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas));
        return true;
    } catch (error) {
        console.error("Error guardando reservas:", error);
        mostrarMensaje("No fue posible guardar la reserva.");
        return false;
    }
}

// ==========================================
// FECHA LOCAL
// ==========================================

function obtenerFechaLocal() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function puedeCancelarReserva(reserva) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reserva.fecha || "")) return false;
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(reserva.hora || "")) return false;

    const [anio, mes, dia] = reserva.fecha.split("-").map(Number);
    const [hora, minutos] = reserva.hora.split(":").map(Number);
    const fechaReserva = new Date(anio, mes - 1, dia, hora, minutos);

    if (
        fechaReserva.getFullYear() !== anio ||
        fechaReserva.getMonth() !== mes - 1 ||
        fechaReserva.getDate() !== dia
    ) {
        return false;
    }

    return fechaReserva.getTime() - Date.now() >=
        ANTICIPACION_MINIMA_CANCELACION_MS;
}

// ==========================================
// MOSTRAR MENSAJES
// ==========================================

let temporizadorMensaje;

function mostrarMensaje(texto) {
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.classList.add("show");

    clearTimeout(temporizadorMensaje);

    temporizadorMensaje = setTimeout(() => {
        mensaje.classList.remove("show");
    }, 3000);
}

// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(fecha) {
    if (!fecha) return "";

    const partes = fecha.split("-");
    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ==========================================
// FORMATEAR DINERO
// ==========================================

function formatearDinero(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(valor);
}

// ==========================================
// CONVERTIR HORA
// ==========================================

function convertirHora(hora) {
    const [horas, minutos] = hora.split(":").map(Number);
    const periodo = horas >= 12 ? "p. m." : "a. m.";
    const hora12 = horas % 12 || 12;

    return `${hora12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

// ==========================================
// CONFIGURAR FECHA MÍNIMA
// ==========================================

if (campoFecha) {
    campoFecha.min = obtenerFechaLocal();
}

// ==========================================
// CONSULTAR DISPONIBILIDAD
// ==========================================

function consultarDisponibilidad() {
    if (!campoFecha || !campoHora || !disponibilidad) return;

    const fecha = campoFecha.value;
    campoHora.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent = "Selecciona un horario";
    campoHora.appendChild(opcionInicial);

    if (!fecha) {
        disponibilidad.textContent =
            "Selecciona una fecha para consultar los horarios.";

        disponibilidad.className = "availability";
        return;
    }

    if (fecha < obtenerFechaLocal()) {
        disponibilidad.textContent =
            "No puedes seleccionar una fecha anterior a hoy.";

        disponibilidad.className = "availability error";
        return;
    }

    const reservas = obtenerReservas();

    const ocupadas = reservas
        .filter(reserva => reserva.fecha === fecha)
        .map(reserva => reserva.hora);

    const libres = HORARIOS.filter(hora => !ocupadas.includes(hora));

    if (libres.length === 0) {
        disponibilidad.textContent =
            "No hay horarios disponibles para esta fecha.";

        disponibilidad.className = "availability error";

        const opcion = document.createElement("option");
        opcion.textContent = "Día completamente ocupado";
        opcion.disabled = true;

        campoHora.appendChild(opcion);
        return;
    }

    libres.forEach(hora => {
        const opcion = document.createElement("option");
        opcion.value = hora;
        opcion.textContent = convertirHora(hora);
        campoHora.appendChild(opcion);
    });

    disponibilidad.textContent =
        `${libres.length} horarios disponibles para esta fecha.`;

    disponibilidad.className = "availability success";
}

// ==========================================
// REGISTRAR RESERVA
// ==========================================

if (formulario) {
    formulario.addEventListener("submit", function(evento) {
        evento.preventDefault();

        const nombre = campoNombre.value.trim();
        const telefono = campoTelefono.value.trim();
        const fecha = campoFecha.value;
        const hora = campoHora.value;

        if (!nombre || !telefono || !fecha || !hora) {
            mostrarMensaje("Completa todos los campos.");
            return;
        }

        const telefonoLimpio = telefono.replace(/[\s()+-]/g, "");

        if (!/^\d{7,15}$/.test(telefonoLimpio)) {
            mostrarMensaje("Escribe un teléfono válido.");
            campoTelefono.focus();
            return;
        }

        if (fecha < obtenerFechaLocal()) {
            mostrarMensaje("No puedes reservar fechas pasadas.");
            return;
        }

        if (!HORARIOS.includes(hora)) {
            mostrarMensaje("Selecciona un horario válido.");
            return;
        }

        const reservas = obtenerReservas();

        const horarioOcupado = reservas.some(reserva => {
            return reserva.fecha === fecha && reserva.hora === hora;
        });

        if (horarioOcupado) {
            mostrarMensaje("Este horario ya está reservado.");
            consultarDisponibilidad();
            return;
        }

        const nuevaReserva = {
            id: Date.now().toString() +
                Math.random().toString(36).slice(2, 8),
            nombre: nombre,
            telefono: telefonoLimpio,
            fecha: fecha,
            hora: hora,
            precio: PRECIO_HORA,
            fechaRegistro: new Date().toISOString()
        };

        reservas.push(nuevaReserva);

        if (!guardarReservas(reservas)) return;

        formulario.reset();
        consultarDisponibilidad();
        mostrarReservas();

        mostrarMensaje("¡Reserva registrada correctamente! ⚽");
    });
}

// ==========================================
// MOSTRAR RESERVAS
// ==========================================

function mostrarReservas() {
    if (!listaReservas) return;

    const reservas = obtenerReservas();

    reservas.sort((a, b) => {
        return (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
    });

    listaReservas.innerHTML = "";

    if (totalReservas) {
        totalReservas.textContent = reservas.length;
    }

    if (horariosOcupados) {
        horariosOcupados.textContent = reservas.length;
    }

    if (reservas.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "empty-state";

        const icono = document.createElement("span");
        icono.textContent = "📅";

        const titulo = document.createElement("h3");
        titulo.textContent = "Aún no hay reservas";

        const texto = document.createElement("p");
        texto.textContent =
            "Cuando registres una reserva aparecerá aquí.";

        vacio.append(icono, titulo, texto);
        listaReservas.appendChild(vacio);
        return;
    }

    reservas.forEach(reserva => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "reservation-item";

        const titulo = document.createElement("h3");
        titulo.textContent = reserva.nombre;

        const telefono = document.createElement("p");
        telefono.textContent = "Teléfono: " + reserva.telefono;

        const fecha = document.createElement("p");
        fecha.textContent =
            "Fecha: " + formatearFecha(reserva.fecha);

        const hora = document.createElement("p");
        hora.textContent =
            "Hora: " + convertirHora(reserva.hora);

        const precio = document.createElement("p");
        precio.textContent =
            "Precio: " +
            formatearDinero(Number(reserva.precio || PRECIO_HORA));

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "cancel-button";
        const cancelable = puedeCancelarReserva(reserva);
        boton.disabled = !cancelable;
        boton.textContent = cancelable
            ? "Cancelar reserva"
            : "No disponible (menos de 2 horas)";

        boton.addEventListener("click", () => {
            cancelarReserva(reserva.id);
        });

        tarjeta.append(
            titulo,
            telefono,
            fecha,
            hora,
            precio,
            boton
        );

        listaReservas.appendChild(tarjeta);
    });
}

// ==========================================
// CANCELAR RESERVA
// ==========================================

function cancelarReserva(id) {
    const reservas = obtenerReservas();
    const reserva = reservas.find(item => item.id === id);

    if (!reserva) {
        mostrarMensaje("No encontramos la reserva.");
        return;
    }

    if (!puedeCancelarReserva(reserva)) {
        mostrarMensaje("Solo puedes cancelar hasta 2 horas antes de la reserva.");
        mostrarReservas();
        return;
    }

    const confirmar = confirm(
        "¿Estás seguro de que deseas cancelar esta reserva?"
    );

    if (!confirmar) return;

    const nuevasReservas = reservas.filter(reserva => {
        return reserva.id !== id;
    });

    if (!guardarReservas(nuevasReservas)) return;

    mostrarReservas();
    consultarDisponibilidad();

    mostrarMensaje("La reserva fue cancelada.");
}

// ==========================================
// EVENTOS
// ==========================================

if (campoFecha) {
    campoFecha.addEventListener("change", consultarDisponibilidad);
}

// ==========================================
// INICIAR SISTEMA
// ==========================================

consultarDisponibilidad();
mostrarReservas();

console.log("CanchaFácil iniciado correctamente ⚽");


// ==========================================
// CANCHAFÁCIL - ORGANIZADOR DE PARTIDOS
// Módulo independiente: no modifica reservas.
// ==========================================

(() => {
    "use strict";

    const CLAVE_PARTIDOS = "canchafacil_partidos_v1";
    const CLAVE_PARTIDO_ACTIVO = "canchafacil_partido_activo_v1";

    const $ = id => document.getElementById(id);

    const nombreJugador = $("jugador-nombre");
    const botonAgregar = $("agregar-jugador");
    const listaJugadores = $("lista-jugadores");

    if (!nombreJugador || !botonAgregar || !listaJugadores) return;

    const botonIniciar = $("iniciar-partido");
    const botonReiniciar = $("reiniciar-partido");
    const botonGolA = $("gol-a");
    const botonGolB = $("gol-b");
    const botonFinalizar = $("finalizar-partido");
    const selectorAutorGol = $("autor-gol");

    let jugadores = [];
    let partido = null;
    let intervaloReloj = null;

    // ======================================
    // LEER DATOS GUARDADOS
    // ======================================

    function leerLista(clave) {
        try {
            const datos = JSON.parse(
                localStorage.getItem(clave) || "[]"
            );

            return Array.isArray(datos) ? datos : [];

        } catch (error) {
            console.error("Error leyendo partidos:", error);
            return [];
        }
    }

    // ======================================
    // GUARDAR PARTIDOS
    // ======================================

    function guardarPartidos(partidos) {
        try {
            localStorage.setItem(
                CLAVE_PARTIDOS,
                JSON.stringify(partidos)
            );

            return true;

        } catch (error) {
            alert("No fue posible guardar el resultado en este navegador.");
            console.error(error);
            return false;
        }
    }

    // ======================================
    // PROTEGER TEXTO HTML
    // ======================================

    function escaparHTML(valor) {
        return String(valor).replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    }

    // ======================================
    // OBTENER EQUIPOS
    // ======================================

    function obtenerEquipos() {
        return {
            nombreA: $("nombre-equipo-a").value.trim() || "Equipo A",
            nombreB: $("nombre-equipo-b").value.trim() || "Equipo B",
            formacionA: $("formacion-a").value,
            formacionB: $("formacion-b").value
        };
    }

    // ======================================
    // ACTUALIZAR AUTORES DE GOLES
    // ======================================

    function actualizarAutores() {
        const anterior = selectorAutorGol.value;

        selectorAutorGol.innerHTML =
            '<option value="">Sin especificar</option>' +
            jugadores.map(j =>
                `<option value="${j.id}">
                    ${escaparHTML(j.nombre)}
                    (${j.equipo === "A" ? "Equipo 1" : "Equipo 2"})
                </option>`
            ).join("");

        if (jugadores.some(j => j.id === anterior)) {
            selectorAutorGol.value = anterior;
        }
    }

    // ======================================
    // MOSTRAR JUGADORES
    // ======================================

    function renderJugadores() {
        if (!jugadores.length) {
            listaJugadores.innerHTML =
                '<p class="partidos-vacio">Todavía no has agregado jugadores.</p>';

        } else {
            listaJugadores.innerHTML = jugadores.map(j => `
                <div class="jugador-fila">
                    <strong>${escaparHTML(j.nombre)}</strong>

                    <select
                        data-equipo="${j.id}"
                        aria-label="Equipo de ${escaparHTML(j.nombre)}"
                        ${partido ? "disabled" : ""}
                    >
                        <option value="A" ${j.equipo === "A" ? "selected" : ""}>
                            Equipo 1
                        </option>

                        <option value="B" ${j.equipo === "B" ? "selected" : ""}>
                            Equipo 2
                        </option>
                    </select>

                    <button
                        type="button"
                        data-eliminar="${j.id}"
                        ${partido ? "disabled" : ""}
                    >
                        Quitar
                    </button>
                </div>
            `).join("");
        }

        listaJugadores.querySelectorAll("[data-equipo]").forEach(select => {
            select.addEventListener("change", () => {
                const jugador = jugadores.find(
                    j => j.id === select.dataset.equipo
                );

                if (jugador) jugador.equipo = select.value;

                actualizarAutores();
            });
        });

        listaJugadores.querySelectorAll("[data-eliminar]").forEach(boton => {
            boton.addEventListener("click", () => {
                jugadores = jugadores.filter(
                    j => j.id !== boton.dataset.eliminar
                );

                renderJugadores();
            });
        });

        actualizarAutores();
    }

    // ======================================
    // ACTUALIZAR MARCADOR
    // ======================================

    function actualizarMarcador() {
        if (!partido) return;

        $("marcador-nombre-a").textContent = partido.nombreA;
        $("marcador-nombre-b").textContent = partido.nombreB;

        $("marcador-formacion-a").textContent =
            "Formación " + partido.formacionA;

        $("marcador-formacion-b").textContent =
            "Formación " + partido.formacionB;

        $("marcador-a").textContent = partido.golesA;
        $("marcador-b").textContent = partido.golesB;
    }

    // ======================================
    // RELOJ DEL PARTIDO
    // ======================================

    function actualizarReloj() {
        if (!partido) return;

        const segundos = Math.max(
            0,
            Math.floor((Date.now() - partido.iniciadoEn) / 1000)
        );

        $("reloj-partido").textContent =
            `${String(Math.floor(segundos / 60)).padStart(2, "0")}:` +
            `${String(segundos % 60).padStart(2, "0")}`;
    }

    // ======================================
    // GUARDAR PARTIDO ACTIVO
    // ======================================

    function guardarActivo() {
        try {
            if (partido) {
                localStorage.setItem(
                    CLAVE_PARTIDO_ACTIVO,
                    JSON.stringify(partido)
                );
            } else {
                localStorage.removeItem(CLAVE_PARTIDO_ACTIVO);
            }

        } catch (error) {
            console.error("No se pudo guardar el partido activo:", error);
        }
    }

    // ======================================
    // INICIAR PARTIDO
    // ======================================

    function iniciarPartido() {
        if (partido) {
            return alert("Ya hay un partido en curso. Finalízalo primero.");
        }

        if (jugadores.length < 2) {
            return alert("Agrega al menos dos jugadores.");
        }

        if (
            !jugadores.some(j => j.equipo === "A") ||
            !jugadores.some(j => j.equipo === "B")
        ) {
            return alert("Asigna al menos un jugador a cada equipo.");
        }

        partido = {
            ...obtenerEquipos(),
            id: Date.now().toString(),
            jugadores: jugadores.map(j => ({ ...j })),
            golesA: 0,
            golesB: 0,
            goles: [],
            iniciadoEn: Date.now()
        };

        guardarActivo();

        $("estado-partido").textContent = "Partido en curso";

        [botonGolA, botonGolB, botonFinalizar].forEach(b => {
            b.disabled = false;
        });

        botonIniciar.disabled = true;

        [
            "nombre-equipo-a",
            "nombre-equipo-b",
            "formacion-a",
            "formacion-b"
        ].forEach(id => {
            $(id).disabled = true;
        });

        renderJugadores();
        actualizarMarcador();
        actualizarReloj();

        intervaloReloj = setInterval(actualizarReloj, 1000);
    }

    // ======================================
    // REGISTRAR GOL
    // ======================================

    function registrarGol(equipo) {
        if (!partido) return;

        if (equipo === "A") {
            partido.golesA++;
        } else {
            partido.golesB++;
        }

        const autor = partido.jugadores.find(
            j => j.id === selectorAutorGol.value
        );

        partido.goles.push({
            equipo,
            jugadorId: autor ? autor.id : null,
            jugador: autor ? autor.nombre : "No especificado",
            fecha: new Date().toISOString()
        });

        actualizarMarcador();
        guardarActivo();
    }

    // ======================================
    // FINALIZAR PARTIDO
    // ======================================

    function finalizarPartido() {
        if (!partido) return;

        const resultado = {
            ...partido,
            finalizadoEn: new Date().toISOString(),
            duracionSegundos: Math.max(
                0,
                Math.floor((Date.now() - partido.iniciadoEn) / 1000)
            )
        };

        const partidos = leerLista(CLAVE_PARTIDOS);
        partidos.unshift(resultado);

        if (!guardarPartidos(partidos)) return;

        partido = null;
        guardarActivo();

        clearInterval(intervaloReloj);
        intervaloReloj = null;

        $("estado-partido").textContent =
            "Resultado guardado correctamente";

        $("reloj-partido").textContent = "FINAL";

        [botonGolA, botonGolB, botonFinalizar].forEach(b => {
            b.disabled = true;
        });

        botonIniciar.disabled = false;

        [
            "nombre-equipo-a",
            "nombre-equipo-b",
            "formacion-a",
            "formacion-b"
        ].forEach(id => {
            $(id).disabled = false;
        });

        renderJugadores();
        renderEstadisticas();
    }

    // ======================================
    // REINICIAR MARCADOR
    // ======================================

    function reiniciarMarcador() {
        if (partido) {
            return alert("Finaliza el partido antes de reiniciar el marcador.");
        }

        $("marcador-a").textContent = "0";
        $("marcador-b").textContent = "0";
        $("reloj-partido").textContent = "00:00";
        $("estado-partido").textContent = "Marcador reiniciado";
    }

    // ======================================
    // ESTADÍSTICAS E HISTORIAL
    // ======================================

    function renderEstadisticas() {
        const partidos = leerLista(CLAVE_PARTIDOS);

        $("estadistica-partidos").textContent = partidos.length;

        $("estadistica-goles").textContent = partidos.reduce(
            (total, p) =>
                total + Number(p.golesA || 0) + Number(p.golesB || 0),
            0
        );

        $("estadistica-victorias").textContent =
            partidos.filter(p => p.golesA !== p.golesB).length;

        $("estadistica-empates").textContent =
            partidos.filter(p => p.golesA === p.golesB).length;

        $("historial-partidos").innerHTML = partidos.length
            ? partidos.slice(0, 8).map(p => {
                const fecha = p.finalizadoEn
                    ? new Date(p.finalizadoEn).toLocaleDateString("es-CO")
                    : "";

                return `
                    <article class="resultado-partido">
                        <div>
                            <strong>${escaparHTML(p.nombreA)}</strong>
                            <span>${p.golesA}</span>
                        </div>

                        <div>
                            <strong>${escaparHTML(p.nombreB)}</strong>
                            <span>${p.golesB}</span>
                        </div>

                        <small>
                            ${fecha} ·
                            ${p.golesA === p.golesB ? "Empate" : "Partido finalizado"}
                        </small>
                    </article>
                `;
            }).join("")
            : '<p class="partidos-vacio">Cuando finalices un partido, su resultado aparecerá aquí.</p>';
    }

    // ======================================
    // AGREGAR JUGADOR
    // ======================================

    botonAgregar.addEventListener("click", () => {
        const nombre = nombreJugador.value.trim();

        if (!nombre) return nombreJugador.focus();

        if (
            jugadores.some(
                j => j.nombre.toLowerCase() === nombre.toLowerCase()
            )
        ) {
            return alert("Ese jugador ya está en la lista.");
        }

        const a = jugadores.filter(j => j.equipo === "A").length;
        const b = jugadores.filter(j => j.equipo === "B").length;

        jugadores.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nombre,
            equipo: a <= b ? "A" : "B"
        });

        nombreJugador.value = "";

        renderJugadores();
        nombreJugador.focus();
    });

    nombreJugador.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            botonAgregar.click();
        }
    });

    // ======================================
    // CONECTAR BOTONES
    // ======================================

    botonIniciar.addEventListener("click", iniciarPartido);

    botonGolA.addEventListener("click", () => {
        registrarGol("A");
    });

    botonGolB.addEventListener("click", () => {
        registrarGol("B");
    });

    botonFinalizar.addEventListener("click", finalizarPartido);

    botonReiniciar.addEventListener("click", reiniciarMarcador);

    // ======================================
    // RECUPERAR PARTIDO ACTIVO
    // ======================================

    try {
        const guardado = JSON.parse(
            localStorage.getItem(CLAVE_PARTIDO_ACTIVO) || "null"
        );

        if (guardado && guardado.iniciadoEn) {
            partido = guardado;

            jugadores = Array.isArray(guardado.jugadores)
                ? guardado.jugadores
                : [];

            $("nombre-equipo-a").value = guardado.nombreA;
            $("nombre-equipo-b").value = guardado.nombreB;

            $("formacion-a").value = guardado.formacionA;
            $("formacion-b").value = guardado.formacionB;

            $("estado-partido").textContent =
                "Partido recuperado · en curso";

            [botonGolA, botonGolB, botonFinalizar].forEach(b => {
                b.disabled = false;
            });

            botonIniciar.disabled = true;

            [
                "nombre-equipo-a",
                "nombre-equipo-b",
                "formacion-a",
                "formacion-b"
            ].forEach(id => {
                $(id).disabled = true;
            });

            intervaloReloj = setInterval(actualizarReloj, 1000);
        }

    } catch (error) {
        console.error("No se pudo recuperar el partido activo:", error);
    }

    // ======================================
    // INICIAR ORGANIZADOR
    // ======================================

    renderJugadores();
    actualizarMarcador();

    if (partido) {
        actualizarReloj();
    }

    renderEstadisticas();

})();

