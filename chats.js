const firebaseConfig = {
    apiKey: "AIzaSyAYQPLilbPwbwT8RJNtYZpLmWYPr45I1bs",
    authDomain: "shamatch-9c6d5.firebaseapp.com",
    projectId: "shamatch-9c6d5",
    storageBucket: "shamatch-9c6d5.firebasestorage.app",
    messagingSenderId: "1084374148655",
    appId: "1:1084374148655:web:b9c2b519cc927fce8ec8da"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const emailActual = localStorage.getItem('shamatch_email');
if (!emailActual) {
    alert("Iniciá sesión primero.");
    window.location.href = "index.html";
}

async function cargarChats() {
    const contenedor = document.getElementById("chatContainer");
    contenedor.innerHTML = "";

    const snapshot = await db.collection("chats").where("usuarios", "array-contains", emailActual).get();

    for (const doc of snapshot.docs) {
    const chat = doc.data();
    const chatId = doc.id;
    const otroEmail = chat.usuarios.find(u => u !== emailActual);

    const userDoc = await db.collection("usuarios").doc(otroEmail).get();
    const nombre = userDoc.exists ? userDoc.data().nombre : otroEmail;
    const descripcion = userDoc.exists ? userDoc.data().descripcion : "";

    const chatDiv = document.createElement("div");
    chatDiv.className = "chat";

    const mensajesHTML = (chat.mensajes || []).map(m =>
        `<div><strong>${m.remitente === emailActual ? 'Yo' : nombre}:</strong> ${m.texto}</div>`
    ).join('');

    chatDiv.innerHTML = `
        <h3>${nombre}</h3>
        <p>${descripcion}</p>
        <div class="messages">${mensajesHTML}</div>
        <input type="text" placeholder="Escribí un mensaje" />
        <button onclick="enviarMensaje('${chatId}', this.previousElementSibling)">Enviar</button>
    `;

    contenedor.appendChild(chatDiv);
    }
}

async function enviarMensaje(chatId, inputElem) {
    const texto = inputElem.value.trim();
    if (!texto) return;

    await db.collection("chats").doc(chatId).update({
    mensajes: firebase.firestore.FieldValue.arrayUnion({
        remitente: emailActual,
        texto,
        fecha: new Date()
    })
    });
    inputElem.value = "";
    cargarChats();
}

cargarChats();

function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'index.html';
}