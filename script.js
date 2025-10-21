document.addEventListener('DOMContentLoaded', ()=>{

  const $ = id => document.getElementById(id);

  const views = {
    login: $('view-login'),
    signup: $('view-signup'),
    tasks: $('view-tasks'),
    detail: $('view-detail'),
    stats: $('view-stats')
  };

  function showView(name){
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[name].classList.add('active');
  }

  let currentUser = null;
  let tasks = [];
  let statsChart = null;
  let currentDetail = null;
  let creatingNew = false; // identifica se é uma tarefa nova

  function saveToStorage(){
    if(currentUser){
      localStorage.setItem('tasks_'+currentUser.email, JSON.stringify(tasks));
    }
  }
  function loadFromStorage(){
    if(currentUser){
      tasks = JSON.parse(localStorage.getItem('tasks_'+currentUser.email) || "[]");
    }
  }

  function renderTasks(){
    const list = $('task-list');
    list.innerHTML = '';
    if(tasks.length===0){
      list.innerHTML = '<p class="muted">Nenhuma tarefa ainda.</p>';
    }
    let done = 0;
    tasks.forEach(t=>{
      const item = document.createElement('div');
      item.className = 'task';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = t.done;
      cb.addEventListener('change', ()=>{
        t.done = cb.checked;
        saveToStorage();
        renderTasks();
      });

      const titleWrap = document.createElement('div');
      titleWrap.className = 'title-wrap';
      titleWrap.innerHTML = `<div>${t.title}</div><div class="muted">${t.priority || ''} ${t.date||''}</div>`;
      if(t.done) titleWrap.style.textDecoration='line-through';

      const btnView = document.createElement('button');
      btnView.className = 'btn-icon';
      btnView.textContent = '👁️';
      btnView.title = 'Ver detalhes';
      btnView.addEventListener('click', ()=> openDetail(t, false));

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-icon danger';
      btnDelete.textContent = '🗑️';
      btnDelete.title = 'Excluir tarefa';
      btnDelete.addEventListener('click', ()=>{
        if(confirm('Confirma exclusão da tarefa?')){
          tasks = tasks.filter(x => x.id !== t.id);
          saveToStorage();
          renderTasks();
        }
      });

      item.appendChild(cb);
      item.appendChild(titleWrap);
      item.appendChild(btnView);
      item.appendChild(btnDelete);
      list.appendChild(item);
      if(t.done) done++;
    });
    $('task-progress').textContent = `${done} / ${tasks.length} • ${tasks.length?Math.round(done/tasks.length*100):0}%`;
    saveToStorage();
  }

  function openDetail(t, isNew){
    creatingNew = isNew;
    currentDetail=t;
    $('detail-title').value=t.title || "";
    $('detail-desc').value=t.desc || "";
    $('detail-priority').value=t.priority || "Média";
    showView('detail');
  }

  function saveDetail(){
    if(currentDetail){
      currentDetail.title=$('detail-title').value || "Sem título";
      currentDetail.desc=$('detail-desc').value;
      currentDetail.priority=$('detail-priority').value;

      if(creatingNew){
        currentDetail.id = Date.now();
        currentDetail.date = new Date().toLocaleString();
        currentDetail.done = false;
        tasks.push(currentDetail);
      }

      saveToStorage();
      renderTasks();
      showView('tasks');
    }
  }

  function drawStats(){
    const done=tasks.filter(t=>t.done).length;
    const total=tasks.length;
    const ctx=$('statsChart').getContext('2d');
    if(statsChart){ statsChart.destroy(); }
    statsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Concluídas', 'Pendentes'],
        datasets: [{
          data: [done, total-done],
          backgroundColor: ['#1e9e8f', '#e25b5b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function fakeLogin(email,pass){
    let u = JSON.parse(localStorage.getItem('user_'+email));
    if(u && u.pass===pass) return u;
    return null;
  }
  function fakeRegister(name,email,pass){
    let u = {name,email,pass};
    localStorage.setItem('user_'+email,JSON.stringify(u));
    return u;
  }

  // elementos
  const btnLogin=$('btn-login'),
        loginEmail=$('login-email'),
        loginPass=$('login-pass'),
        goSignup=$('go-signup'),
        btnSignup=$('btn-signup'),
        btnCancelSignup=$('btn-cancel-signup'),
        signupName=$('signup-name'),
        signupEmail=$('signup-email'),
        signupPass=$('signup-pass'),
        signupPass2=$('signup-pass2'),
        btnAdd=$('btn-add'),
        logoutBtn=$('logout'),
        btnSaveDetail=$('btn-save-detail'),
        btnCancelDetail=$('btn-cancel-detail'),
        openStatsBtn=$('open-stats'),
        backStats=$('btn-back-stats'),
        forgotPass=$('forgot-pass');

  btnLogin.addEventListener('click', ()=>{
    const email=loginEmail.value.trim();
    const pass=loginPass.value;
    const u=fakeLogin(email,pass);
    if(!u){ alert('Credenciais inválidas'); return; }
    currentUser=u;
    loadFromStorage();
    renderTasks();
    showView('tasks');
  });

  if(goSignup) goSignup.addEventListener('click', ()=> showView('signup'));
  if(btnCancelSignup) btnCancelSignup.addEventListener('click', ()=> showView('login'));
  if(btnSignup) btnSignup.addEventListener('click', ()=>{
    const name=signupName.value.trim();
    const email=signupEmail.value.trim();
    const pass=signupPass.value;
    const pass2=signupPass2.value;
    if(!name||!email||!pass){ alert('Preencha todos os campos.'); return; }
    if(pass!==pass2){ alert('As senhas não coincidem.'); return; }
    currentUser=fakeRegister(name,email,pass);
    tasks=[];
    saveToStorage();
    renderTasks();
    showView('tasks');
  });

  if(btnAdd) btnAdd.addEventListener('click', ()=>{
    const newTask = { title:"", desc:"", priority:"Média" };
    openDetail(newTask, true);
  });

  if(logoutBtn) logoutBtn.addEventListener('click', ()=>{ currentUser=null; showView('login'); });
  if(btnSaveDetail) btnSaveDetail.addEventListener('click', saveDetail);
  if(btnCancelDetail) btnCancelDetail.addEventListener('click', ()=> showView('tasks'));

  if(openStatsBtn) openStatsBtn.addEventListener('click', ()=>{
    drawStats(); 
    showView('stats');
  });

  if(backStats) backStats.addEventListener('click', ()=> showView('tasks'));

  if(forgotPass){
    forgotPass.addEventListener('click', ()=>{
      alert('Função de recuperação de senha em construção.');
    });
  }

  showView('login');
});
