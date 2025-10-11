
    // Rellena año del footer
    document.getElementById('y').textContent = new Date().getFullYear();

    // Manejo simple de formulario (solo front)
    function handleSubmit(e){
      e.preventDefault();
      const ok = document.getElementById('form-ok');
      ok.style.display = 'block';
      e.target.reset();
      return false;
    }
