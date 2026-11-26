
const CLAVE_ADMIN = "Cancha2026*";
const CLAVE_RESERVAS = "canchafacil_reservas";
const PRECIO_HORA = 60000;

const login = document.getElementById("login");
const panel = document.getElementById("panel");
const formularioLogin = document.getElementById("form-login");
const campoClave = document.getElementById("clave");
const errorLogin = document.getElementById("error-login");

const lista = document.getElementById("lista");
const busqueda = document.getElementById("busqueda");

function obtenerReservas() {
    try {
        const datos = localStorage.getItem(CLAVE_RESERVAS);
        const reservas = datos ? JSON.parse(datos) : [];
        return Array.isArray(reservas) ? reservas : [];
    } catch (error) {
        console.error("Error leyendo reservas:", error);
        return [];
    }
}

function guardarReservas(reservas) {
    try {
        localStorage.setItem(
            CLAVE_RESERVAS,
            JSON.stringify(reservas)
        );
        return true;
    } catch (error) {
        alert("No fue posible guardar los cambios.");
        return false;
    }
}

function obtenerFechaLocal() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function formatearDinero(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearFecha(fecha) {
    if (!fecha) return "";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function convertirHora(hora) {
    if (!hora || !hora.includes(":")) return hora || "";

    const [horas, minutos] = hora.split(":").map(Number);
    const periodo = horas >= 12 ? "p. m." : "a. m.";
    const hora12 = horas % 12 || 12;

    return `${hora12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

formularioLogin.addEventListener("submit", function(evento) {
    evento.preventDefault();

    if (campoClave.value === CLAVE_ADMIN) {
        sessionStorage.setItem("canchafacil_admin", "activo");

        errorLogin.textContent = "";
        campoClave.value = "";

        mostrarPanel();
    } else {
        errorLogin.textContent = "Contraseña incorrecta.";
        campoClave.value = "";
        campoClave.focus();
    }
});

function mostrarPanel() {
    login.classList.add("oculto");
    panel.classList.remove("oculto");

    renderizarPanel();
}

function cerrarSesion() {
    sessionStorage.removeItem("canchafacil_admin");

    panel.classList.add("oculto");
    login.classList.remove("oculto");

    campoClave.value = "";
}

document.getElementById("salir").addEventListener("click", cerrarSesion);

// ==========================================
// PANEL Y ESTADÍSTICAS
// ==========================================

function renderizarPanel() {
    if (sessionStorage.getItem("canchafacil_admin") !== "activo") {
        cerrarSesion();
        return;
    }

    const reservas = obtenerReservas();
    const hoy = obtenerFechaLocal();

    const reservasHoy = reservas.filter(reserva => {
        return reserva.fecha === hoy;
    });

    const valorTotal = reservas.reduce((total, reserva) => {
        return total + Number(reserva.precio || PRECIO_HORA);
    }, 0);

    document.getElementById("total").textContent = reservas.length;
    document.getElementById("hoy").textContent = reservasHoy.length;
    document.getElementById("valor").textContent =
        formatearDinero(valorTotal);

    mostrarReservas();
}

// ==========================================
// LISTA DE RESERVAS
// ==========================================

function mostrarReservas() {
    const reservas = obtenerReservas();

    const texto = busqueda.value.trim().toLowerCase();

    const filtradas = reservas
        .filter(reserva => {
            const nombre = String(reserva.nombre || "").toLowerCase();
            const telefono = String(reserva.telefono || "").toLowerCase();

            return nombre.includes(texto) || telefono.includes(texto);
        })
        .sort((a, b) => {
            return (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
        });

    lista.innerHTML = "";

    if (filtradas.length === 0) {
        const vacio = document.createElement("p");
        vacio.textContent = "No hay reservas para mostrar.";
        lista.appendChild(vacio);
        return;
    }

    filtradas.forEach(reserva => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "reserva";

        const datos = document.createElement("div");
        datos.className = "datos";

        const nombre = document.createElement("h3");
        nombre.textContent = reserva.nombre || "Sin nombre";

        const telefono = document.createElement("p");
        telefono.textContent = "Teléfono: " + (reserva.telefono || "");

        const fecha = document.createElement("p");
        fecha.textContent = "Fecha: " + formatearFecha(reserva.fecha);

        const hora = document.createElement("p");
        hora.textContent = "Hora: " + convertirHora(reserva.hora);

        const precio = document.createElement("p");
        precio.textContent = "Valor: " +
            formatearDinero(Number(reserva.precio || PRECIO_HORA));

        datos.append(nombre, telefono, fecha, hora, precio);

        const acciones = document.createElement("div");
        acciones.className = "acciones";

        const imprimir = document.createElement("button");
        imprimir.className = "principal";
        imprimir.textContent = "Imprimir comprobante";

        imprimir.addEventListener("click", () => {
            imprimirComprobante(reserva.id);
        });

        const cancelar = document.createElement("button");
        cancelar.className = "cancelar";
        cancelar.textContent = "Cancelar";

        cancelar.addEventListener("click", () => {
            cancelarReserva(reserva.id);
        });

        acciones.append(imprimir, cancelar);
        tarjeta.append(datos, acciones);
        lista.appendChild(tarjeta);
    });
}

// ==========================================
// CANCELAR RESERVA
// ==========================================

function cancelarReserva(id) {
    const confirmar = confirm(
        "¿Estás seguro de que deseas cancelar esta reserva?"
    );

    if (!confirmar) return;

    const reservas = obtenerReservas();

    const nuevasReservas = reservas.filter(reserva => {
        return reserva.id !== id;
    });

    if (!guardarReservas(nuevasReservas)) return;

    renderizarPanel();

    alert("La reserva fue cancelada.");
}

// ==========================================
// IMPRIMIR COMPROBANTE
// ==========================================

function imprimirComprobante(id) {
    const reserva = obtenerReservas().find(item => item.id === id);

    if (!reserva) {
        alert("No encontramos esta reserva.");
        return;
    }

    const ventana = window.open("", "_blank", "width=700,height=750");

    if (!ventana) {
        alert("Permite las ventanas emergentes para imprimir.");
        return;
    }

    function escaparHTML(valor) {
        return String(valor).replace(/[&<>"']/g, caracter => {
            const entidades = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entidades[caracter];
        });
    }

    const contenido = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Comprobante CanchaFácil</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 30px;
                    color: #182018;
                }
                .comprobante {
                    max-width: 500px;
                    margin: auto;
                    padding: 35px;
                    border: 2px solid #83c900;
                    border-radius: 12px;
                }
                h1, .total {
                    color: #5b9200;
                    text-align: center;
                }
                .dato {
                    padding: 13px 0;
                    border-bottom: 1px solid #ddd;
                }
                .dato strong {
                    display: block;
                    margin-bottom: 5px;
                }
                .total {
                    font-size: 23px;
                    font-weight: bold;
                    margin-top: 25px;
                }
                .pie {
                    text-align: center;
                    margin-top: 30px;
                }
                button {
                    display: block;
                    margin: 25px auto;
                    padding: 13px 25px;
                    background: #83c900;
                    border: none;
                    cursor: pointer;
                }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="comprobante">
                <h1>⚽ CANCHAFÁCIL</h1>
                <p style="text-align:center">Comprobante de reserva</p>

                <div class="dato">
                    <strong>Cliente</strong>
                    ${escaparHTML(reserva.nombre)}
                </div>

                <div class="dato">
                    <strong>Teléfono</strong>
                    ${escaparHTML(reserva.telefono)}
                </div>

                <div class="dato">
                    <strong>Fecha del partido</strong>
                    ${escaparHTML(formatearFecha(reserva.fecha))}
                </div>

                <div class="dato">
                    <strong>Horario</strong>
                    ${escaparHTML(convertirHora(reserva.hora))}
                </div>

                <div class="dato">
                    <strong>Número de reserva</strong>
                    ${escaparHTML(reserva.id)}
                </div>

                <div class="total">
                    ${escaparHTML(formatearDinero(Number(reserva.precio || PRECIO_HORA)))}
                </div>

                <p class="pie">
                    Gracias por elegir CanchaFácil.<br>
                    ¡Nos vemos en la cancha!
                </p>

                <button onclick="window.print()">IMPRIMIR</button>
            </div>
        </body>
        </html>
    `;

    ventana.document.open();
    ventana.document.write(contenido);
    ventana.document.close();
}

// ==========================================
// EVENTOS
// ==========================================

busqueda.addEventListener("input", mostrarReservas);

document.getElementById("actualizar").addEventListener("click", () => {
    renderizarPanel();
});

// ==========================================
// INICIAR
// ==========================================

if (sessionStorage.getItem("canchafacil_admin") === "activo") {
    mostrarPanel();
}
