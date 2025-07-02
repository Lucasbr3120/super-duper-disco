// Komilão + Firebase - Exemplo Base

let produtos = [];
let vendas = [];
let vendasHoje = [];
let caixaAberto = false;
let dadosCaixa = {};

// --------- SALVAR DADOS NO FIRESTORE ----------
function salvarDadosUsuarioFirestore() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).set({
    produtos,
    vendas,
    vendasHoje,
    caixaAberto,
    dadosCaixa
  }, { merge: true });
}

// --------- CARREGAR DADOS DO FIRESTORE AO LOGIN ----------
function carregarDadosUsuario() {
  const user = firebase.auth().currentUser;
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

// --------- AO LOGIN/LOGOUT, CHAME ---------
firebase.auth().onAuthStateChanged(user => {
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

// --------- EXEMPLO: CADASTRO DE PRODUTO ----------
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

// --------- EXEMPLO: LISTAGEM DE PRODUTOS ----------
function atualizarListaProdutos() {
  const tbody = document.getElementById('tabelaProdutos');
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

// --------- EXEMPLO: EXCLUIR PRODUTO ----------
function excluirProduto(id) {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    produtos = produtos.filter(p => p.id !== id);
    salvarDadosUsuarioFirestore();
    atualizarListaProdutos();
    atualizarDashboard();
  }
}

// --------- ADAPTE AS FUNÇÕES DE VENDAS, CAIXA, ETC DA MESMA FORMA ----------
// Sempre que alterar vendas, caixa, vendasHoje, etc, chame salvarDadosUsuarioFirestore()!

// --------- ADAPTE AS OUTRAS FUNÇÕES NORMALMENTE, SÓ NÃO USE MAIS localStorage! ----------
