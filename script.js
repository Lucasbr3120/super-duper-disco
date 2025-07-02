// Referências globais
let produtos = [];
let vendas = [];
let vendasHoje = [];
let caixaAberto = false;
let dadosCaixa = {};

// LOGIN
function fazerLoginFirebase() {
  const email = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;
  auth.signInWithEmailAndPassword(email, senha)
    .then(() => {
      document.getElementById('telaLogin').style.display = 'none';
      document.querySelector('header').style.display = '';
      document.querySelector('main').style.display = '';
      carregarDadosUsuario();
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

// Atualiza interface ao logar/deslogar
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

// SALVAR DADOS NO FIRESTORE
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

// CARREGAR DADOS DO FIRESTORE AO LOGIN
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
    atualizarListaProdutos();
    atualizarDashboard();
    atualizarEstoque();
  });
}

// CADASTRAR PRODUTO
document.getElementById('formProduto').addEventListener('submit', cadastrarProduto);

function cadastrarProduto(e) {
  e.preventDefault();
  const codigo = document.getElementById('codigoProduto').value;
  const nome = document.getElementById('nomeProduto').value;
  const preco = parseFloat(document.getElementById('precoProduto').value);
  const quantidade = parseInt(document.getElementById('quantidadeProduto').value);
  const categoria = document.getElementById('categoriaProduto').value;

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

// LISTAR PRODUTOS NA TABELA
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

// EXCLUIR PRODUTO
function excluirProduto(id) {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    produtos = produtos.filter(p => p.id !== id);
    salvarDadosUsuarioFirestore();
    atualizarListaProdutos();
    atualizarDashboard();
  }
}

// EXEMPLO DE FUNÇÕES DE ATUALIZAÇÃO DE DASHBOARD E ESTOQUE
function atualizarDashboard() {
  document.getElementById('totalProdutos').textContent = produtos.length;
  // Implemente os outros indicadores conforme seu sistema
}
function atualizarEstoque() {
  // Atualize o estoque conforme sua lógica
}

// Troque todas as funções que alteram dados (venda, estoque, caixa, etc) para chamar salvarDadosUsuarioFirestore()!

// Nunca mais use localStorage!
