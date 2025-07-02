// Controle simples de navegação entre páginas
function showPage(pageId) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelector(`button[onclick*="${pageId}"]`).classList.add('active');
  document.getElementById(pageId).classList.add('active');
}

// ========== AUTENTICAÇÃO ==========
function fazerLoginFirebase() {
  const email = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;
  auth.signInWithEmailAndPassword(email, senha)
    .then(() => {
      document.getElementById('telaLogin').style.display = 'none';
      document.querySelector('header').style.display = '';
      document.querySelector('main').style.display = '';
      carregarProdutos();
      carregarEstoque();
      atualizarDashboard();
    })
    .catch(err => {
      document.getElementById('erroLogin').innerText = 'Usuário ou senha inválidos!';
      document.getElementById('erroLogin').style.display = '';
    });
}

function fazerCadastroUsuario() {
  const email = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;
  auth.createUserWithEmailAndPassword(email, senha)
    .then(() => {
      alert('Usuário cadastrado! Faça login.');
    })
    .catch(err => {
      document.getElementById('erroLogin').innerText = 'Erro ao cadastrar: ' + (err.message || 'Verifique os dados.');
      document.getElementById('erroLogin').style.display = '';
    });
}

// Autologin ao recarregar se já estiver autenticado
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('telaLogin').style.display = 'none';
    document.querySelector('header').style.display = '';
    document.querySelector('main').style.display = '';
    carregarProdutos();
    carregarEstoque();
    atualizarDashboard();
  } else {
    document.getElementById('telaLogin').style.display = '';
    document.querySelector('header').style.display = 'none';
    document.querySelector('main').style.display = 'none';
  }
});

// ========== PRODUTOS ==========
function carregarProdutos() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    renderTabelaProdutos(produtos);
  });
}

function renderTabelaProdutos(produtos) {
  const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = '';
  produtos.forEach((prod, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${prod.codigo}</td>
      <td>${prod.nome}</td>
      <td>R$ ${Number(prod.preco).toFixed(2)}</td>
      <td>${prod.quantidade}</td>
      <td>${prod.categoria}</td>
      <td><button class="btn-danger" onclick="removerProduto(${idx})">Excluir</button></td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('formProduto').onsubmit = function(e) {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const codigo = document.getElementById('codigoProduto').value;
  const nome = document.getElementById('nomeProduto').value;
  const preco = parseFloat(document.getElementById('precoProduto').value);
  const quantidade = parseInt(document.getElementById('quantidadeProduto').value);
  const categoria = document.getElementById('categoriaProduto').value;

  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    produtos.push({ codigo, nome, preco, quantidade, categoria });
    db.collection('usuarios').doc(user.uid).set({ produtos }, { merge: true }).then(() => {
      carregarProdutos();
      this.reset();
    });
  });
};

function removerProduto(idx) {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    produtos.splice(idx, 1);
    db.collection('usuarios').doc(user.uid).set({ produtos }, { merge: true }).then(carregarProdutos);
  });
}

// Busca de produtos
document.getElementById('searchProdutos').oninput = function() {
  const termo = this.value.toLowerCase();
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    const filtrados = produtos.filter(prod =>
      prod.nome.toLowerCase().includes(termo) ||
      prod.codigo.toLowerCase().includes(termo) ||
      prod.categoria.toLowerCase().includes(termo)
    );
    renderTabelaProdutos(filtrados);
  });
};

// ========== ESTOQUE ==========
function carregarEstoque() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    renderTabelaEstoque(produtos);
  });
}

function renderTabelaEstoque(produtos) {
  const tbody = document.getElementById('tabelaEstoque');
  tbody.innerHTML = '';
  produtos.forEach((prod, idx) => {
    const status = prod.quantidade <= 2 ? 'Baixo' : 'OK';
    tbody.innerHTML += `
      <tr>
        <td>${prod.codigo}</td>
        <td>${prod.nome}</td>
        <td>${prod.quantidade}</td>
        <td>${status}</td>
        <td><button class="btn-danger" onclick="zerarEstoque(${idx})">Zerar</button></td>
      </tr>
    `;
  });
}

function zerarEstoque(idx) {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    if (produtos[idx]) produtos[idx].quantidade = 0;
    db.collection('usuarios').doc(user.uid).set({ produtos }, { merge: true }).then(carregarEstoque);
  });
}

// ========== DASHBOARD ==========
function atualizarDashboard() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    const data = doc.exists ? doc.data() : {};
    const produtos = data.produtos || [];
    document.getElementById('totalProdutos').innerText = produtos.length;

    // Simulação de vendas e estoque baixo
    document.getElementById('vendasHoje').innerText = "R$ 0,00";
    document.getElementById('vendasMes').innerText = "R$ 0,00";
    document.getElementById('estoqueBaixo').innerText = produtos.filter(p => p.quantidade <= 2).length;
    document.getElementById('ultimasVendas').innerText = "Funcionalidade a implementar";
  });
}
