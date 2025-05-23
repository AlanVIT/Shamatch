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

function startApp() {
  hideAll();
  document.getElementById('mainApp').classList.remove('hidden');
  const music = document.getElementById('introMusic');
  music.volume = 0.5;
  music.play().catch(() => {});
}

function register() {
  hideAll();
  document.getElementById('registerForm').classList.remove('hidden');
}

function login() {
  hideAll();
  document.getElementById('loginForm').classList.remove('hidden');
}

function backToMain() {
  hideAll();
  document.getElementById('mainApp').classList.remove('hidden');
}

function hideAll() {
  document.getElementById('intro')?.classList.add('hidden');
  document.getElementById('mainApp')?.classList.add('hidden');
  document.getElementById('registerForm')?.classList.add('hidden');
  document.getElementById('loginForm')?.classList.add('hidden');
  document.getElementById('app')?.classList.add('hidden');
}

async function submitRegister() {
  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const email = document.getElementById('emailRegister').value;
  const password = document.getElementById('passwordRegister').value;
  const nacimiento = document.getElementById('nacimiento').value;
  let grupo = document.getElementById('grupo').value;
  const genero = document.getElementById('genero').value;
  const descripcion = document.getElementById('descripcion').value;
  const fotoInput = document.getElementById('fotoPerfil');

  if (!nombre || !apellido || !email || !password || !nacimiento || !grupo || !genero || !fotoInput.files[0] || !descripcion) {
    alert("Completá todos los campos");
    return;
  }

  if (genero === "Mujer") {
    grupo = grupo === "Ruso" ? "Rusa" : "Turca";
  }

  const file = fotoInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = async function () {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 300;
      const scaleSize = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const fotoBase64 = canvas.toDataURL('image/jpeg', 0.7);

      try {
        await db.collection("usuarios").doc(email).set({
          nombre,
          apellido,
          email,
          password,
          nacimiento,
          grupo,
          genero,
          descripcion,
          foto: fotoBase64,
          creado: new Date(),
          matches: []
        });

        alert("¡Registro exitoso!");
        backToMain();
      } catch (e) {
        console.error("Error al registrar:", e);
        alert("Error al registrar en la base");
      }
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

async function submitLogin() {
  const email = document.getElementById('emailLogin').value;
  const password = document.getElementById('passwordLogin').value;

  try {
    const doc = await db.collection("usuarios").doc(email).get();
    if (!doc.exists) {
      alert("Usuario no registrado");
      return;
    }

    const userData = doc.data();
    if (userData.password === password) {
      localStorage.setItem('shamatch_email', email);
      localStorage.setItem('shamatch_login_time', Date.now());

      document.getElementById("loginForm").remove();
      document.getElementById("userHeader")?.classList.remove("hidden");
      const appHtml = document.getElementById("app");
      appHtml.classList = "";
      appHtml.innerHTML = `
        <div class="card-container" id="cardContainer">
          <div class="profile-card" id="profileCard">
            <img alt="Foto de perfil" src="" class="profile-pic"/>
            <h3 id="nombreUsuario"></h3>
            <p id="info"></p>
            <p id="descripcionTexto"></p>
            <div class="card-buttons">
              <button onclick="dislike()">❌</button>
              <button onclick="like()">❤️</button>
            </div>
          </div>
        </div>`;

      cargarPerfiles(userData.genero, email);
    } else {
      alert("Contraseña incorrecta");
    }
  } catch (e) {
    console.error("Error al iniciar sesión:", e);
    alert("Error al iniciar sesión");
  }
}

async function cargarPerfiles(generoActual, emailActual) {
  let perfilesFiltrados = [];
  const snapshot = await db.collection("usuarios").get();

  const usuarioDoc = await db.collection("usuarios").doc(emailActual).get();
  const data = usuarioDoc.data();
  const yaLikeados = [];

  const likeSnap = await db.collection("usuarios").doc(emailActual).collection("likes").get();
  likeSnap.forEach(doc => {
    if (doc.data().like) yaLikeados.push(doc.id);
  });

  snapshot.forEach(doc => {
    const u = doc.data();
    if (
      u.email !== emailActual &&
      u.genero !== generoActual &&
      !yaLikeados.includes(u.email)
    ) {
      perfilesFiltrados.push(u);
    }
  });

  if (perfilesFiltrados.length === 0) {
    document.getElementById("profileCard").innerHTML = "<p>No hay personas compatibles.</p>";
    return;
  }

  let indice = 0;
  mostrarSiguiente();

  function mostrarSiguiente() {
    if (indice >= perfilesFiltrados.length) {
      document.getElementById("profileCard").innerHTML = "<p>No hay más personas disponibles.</p>";
      return;
    }

    const persona = perfilesFiltrados[indice];
    document.getElementById("nombreUsuario").innerText = `${persona.nombre} ${persona.apellido}`;
    document.getElementById("info").innerText = `${calcularEdad(persona.nacimiento)} años • ${persona.grupo} • ${persona.genero}`;
    document.getElementById("descripcionTexto").innerText = persona.descripcion || '';
    document.querySelector(".profile-pic").src = persona.foto || "https://via.placeholder.com/300x300?text=Sin+foto";
  }

  window.like = async function () {
    const likedEmail = perfilesFiltrados[indice].email;

    await db.collection("usuarios").doc(emailActual).collection("likes").doc(likedEmail).set({ like: true });

    const match = await db.collection("usuarios").doc(likedEmail).collection("likes").doc(emailActual).get();
    if (match.exists && match.data().like) {
      alert(`💖 ¡Match con ${perfilesFiltrados[indice].nombre}!`);

      await db.collection("usuarios").doc(emailActual).update({
        matches: firebase.firestore.FieldValue.arrayUnion(likedEmail)
      });

      await db.collection("usuarios").doc(likedEmail).update({
        matches: firebase.firestore.FieldValue.arrayUnion(emailActual)
      });

      await db.collection("chats").add({
        usuarios: [emailActual, likedEmail],
        mensajes: [],
        creado: new Date()
      });
    }

    indice++;
    mostrarSiguiente();
  };

  window.dislike = async function () {
    const dislikedEmail = perfilesFiltrados[indice].email;
    await db.collection("usuarios").doc(emailActual).collection("likes").doc(dislikedEmail).set({ like: false });

    indice++;
    mostrarSiguiente();
  };

  function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
}

function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'index.html';
}
