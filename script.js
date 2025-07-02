// Komilão - Script Completo com Firebase Authentication + Firestore
// Requer scripts Firebase compat no HTML e const auth/db globais

// Variáveis globais dos dados
let produtos = [];
let vendas = [];
let vendasHoje = [];
let caixaAberto = false;
let dadosCaixa = {};

// --- LOGIN E CADASTRO ---
function fazerLoginFirebase() {
  const email = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;
  auth.signInWithEmailAndPassword(email, senha)
    .then(() => {
      document.getElementById('erroLogin').style.display = 'none';
    })
    .catch(e => {
      document.getElementById('erroLogin').style.display = 'block';
      document.getElementById('erroLogin').innerText = 'Login inválido: ' + e.message;
    });
}
function fazerCadastroUsuario() {
  const email = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;
  auth.createUserWithEmailAndPassword(email, senha)
    .then(() => {
      document.getElementById('erroLogin').style.display = 'block';
      document.getElementById('erroLogin').innerText = 'Usuário cadastrado! Agora faça o login.';
    })
    .catch(e => {
      document.getElementById('erroLogin').style.display = 'block';
      document.getElementById('erroLogin').innerText = 'Erro ao cadastrar: ' + e.message;
    });
}

// --- TROCA DE PÁGINAS ---
function showPage(page) {
  document.querySelectorAll('.page').forEach(sec => sec.classList.remove('active'));
  document.getElementById(page).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  [...document.querySelectorAll('.nav-btn')].find(btn => btn.textContent.toLowerCase().includes(page)).classList.add('active');
}

// --- FIRESTORE: SALVAR/CARREGAR ---
function salvarDadosUsuarioFirestore() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).set({
    produtos,
    vendas,
    vendasHoje,
    caixaAberto,
    dadosCaixa
  }, { merge: true });
}
function carregarDadosUsuario() {
  const user = auth.currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      produtos = data.produtos || [];
      vendas = data.vendas || [];
      vendasHoje = data.vendasHoje || [];
      caixaAberto = data.caixaAberto || false;
      dadosCaixa = data.dadosCaixa || {};
    } else {
      produtos = [];
      vendas = [];
      vendasHoje = [];
      caixaAberto = false;
      dadosCaixa = {};
    }
    atualizarDashboard();
    atualizarListaProdutos();
    atualizarEstoque();
    // Adicione outras funções de atualização se necessário
  });
}

// --- AUTENTICAÇÃO: CONTROLE DE EXIBIÇÃO ---
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('telaLogin').style.display = 'none';
    document.querySelector('header').style.display = '';
    document.querySelector('main').style.display = '';
    carregarDadosUsuario();
  } else {
    document.getElementById('telaLogin').style.display = 'block';
    document.querySelector('header').style.display = 'none';
    document.querySelector('main').style.display = 'none';
  }
});

// --- PRODUTOS: CADASTRAR/EXCLUIR/LISTAR ---
document.getElementById('formProduto').addEventListener('submit', cadastrarProduto);

function cadastrarProduto(e) {
  e.preventDefault();
  const codigo = document.getElementById('codigoProduto').value.trim();
  const nome = document.getElementById('nomeProduto').value.trim();
  const preco = parseFloat(document.getElementById('precoProduto').value);
  const quantidade = parseInt(document.getElementById('quantidadeProduto').value);
  const categoria = document.getElementById('categoriaProduto').value;

  if (!codigo || !nome || isNaN(preco) || isNaN(quantidade) || !categoria) {
    alert('Preencha todos os campos corretamente.');
    return;
  }
  if (produtos.find(p => p.codigo === codigo)) {
    alert('Código já existe! Use um código diferente.');
    return;
  }

  const produto = {
    id: Date.now(),
    codigo,
    nome,
    preco,
    quantidade,
    categoria,
    dataCadastro: new Date().toISOString()
  };

  produtos.push(produto);
  salvarDadosUsuarioFirestore();
  atualizarListaProdutos();
  atualizarDashboard();
  document.getElementById('formProduto').reset();
  alert('Produto cadastrado com sucesso!');
}

function atualizarListaProdutos() {
  const tbody = document.getElementById('tabelaProdutos');
  if (!tbody) return;
  tbody.innerHTML = '';
  produtos.forEach(produto => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto.codigo}</td>
      <td>${produto.nome}</td>
      <td>R$ ${produto.preco.toFixed(2)}</td>
      <td>${produto.quantidade}</td>
      <td>${produto.categoria}</td>
      <td>
        <button class="btn-danger" onclick="excluirProduto(${produto.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function excluirProduto(id) {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    produtos = produtos.filter(p => p.id !== id);
    salvarDadosUsuarioFirestore();
    atualizarListaProdutos();
    atualizarDashboard();
  }
}

// --- DASHBOARD: ATUALIZAÇÃO ---
function atualizarDashboard() {
  const vendasHojeSpan = document.getElementById('vendasHoje');
  const totalProdutosSpan = document.getElementById('totalProdutos');
  const estoqueBaixoSpan = document.getElementById('estoqueBaixo');
  const vendasMesSpan = document.getElementById('vendasMes');
  const ultimasVendasDiv = document.getElementById('ultimasVendas');
  if (totalProdutosSpan) totalProdutosSpan.textContent = produtos.length;
  if (estoqueBaixoSpan) estoqueBaixoSpan.textContent = produtos.filter(p=>p.quantidade<=5).length;
  if (vendasHojeSpan) vendasHojeSpan.textContent = "R$ " + (vendasHoje.reduce((s, v) => s + v.total, 0)).toFixed(2);
  if (vendasMesSpan) vendasMesSpan.textContent = "R$ " + (vendas.filter(v => (new Date(v.data)).getMonth() === (new Date()).getMonth()).reduce((s, v) => s + v.total, 0)).toFixed(2);
  if (ultimasVendasDiv) {
    ultimasVendasDiv.innerHTML = '';
    (vendas.slice(-5).reverse()).forEach(v => {
      const p = document.createElement('p');
      p.textContent = `${new Date(v.data).toLocaleDateString()} - R$ ${v.total.toFixed(2)}`;
      ultimasVendasDiv.appendChild(p);
    });
    if (ultimasVendasDiv.children.length === 0) ultimasVendasDiv.innerHTML = '<p>Nenhuma venda registrada</p>';
  }
}

// --- ESTOQUE: ATUALIZAÇÃO ---
function atualizarEstoque() {
  const tbody = document.getElementById('tabelaEstoque');
  if (!tbody) return;
  tbody.innerHTML = '';
  produtos.forEach(produto => {
    const tr = document.createElement('tr');
    const status = produto.quantidade <= 5 ? '<span style="color:red">Baixo</span>' : 'OK';
    tr.innerHTML = `
      <td>${produto.codigo}</td>
      <td>${produto.nome}</td>
      <td>${produto.quantidade}</td>
      <td>${status}</td>
      <td>
        <!-- Adapte para repor/excluir se quiser -->
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- PESQUISA DE PRODUTOS ---
document.getElementById('searchProdutos')?.addEventListener('input', function() {
  const termo = this.value.toLowerCase();
  const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = '';
  produtos.filter(p => 
    p.codigo.toLowerCase().includes(termo) ||
    p.nome.toLowerCase().includes(termo)
  ).forEach(produto => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto.codigo}</td>
      <td>${produto.nome}</td>
      <td>R$ ${produto.preco.toFixed(2)}</td>
      <td>${produto.quantidade}</td>
      <td>${produto.categoria}</td>
      <td>
        <button class="btn-danger" onclick="excluirProduto(${produto.id})">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
});

// --- ESTRUTURA PARA VENDAS, RELATÓRIOS ETC ---
// Implemente as funções de venda, fechamento de caixa, relatórios etc 
// SEMPRE atualizando o array correspondente (vendas, caixa, etc) 
// e chamando salvarDadosUsuarioFirestore() após qualquer alteração

// --- TROCA DE PÁGINAS PELOS BOTÕES ---
window.showPage = showPage;
window.fazerLoginFirebase = fazerLoginFirebase;
window.fazerCadastroUsuario = fazerCadastroUsuario;
window.excluirProduto = excluirProduto;

// Adapte e expanda conforme seu sistema!
