function startApp() {
    // Mostrar contenido principal
    document.getElementById('intro').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
  
    // Reproducir música
    const music = document.getElementById('introMusic');
    music.volume = 1;
    music.play().catch(() => {
      console.log("Autoplay bloqueado, necesita interacción del usuario.");
    });
  }
  
  function showRegister() {
    alert("Función de registro en construcción. ¡Próximamente!");
  }
  
  function showLogin() {
    alert("Función de inicio de sesión en construcción. ¡Próximamente!");
  }
  