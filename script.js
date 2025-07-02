
// Sistema de Gerenciamento de Caixa de Mercadinho

// Dados do sistema
let produtos = JSON.parse(localStorage.getItem('produtos')) || [];
let vendas = JSON.parse(localStorage.getItem('vendas')) || [];
let vendasHoje = JSON.parse(localStorage.getItem('vendasHoje')) || [];
let carrinhoAtual = [];
let caixaAberto = JSON.parse(localStorage.getItem('caixaAberto')) || false;
let dadosCaixa = JSON.parse(localStorage.getItem('dadosCaixa')) || {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarStatusCaixa();
    atualizarDashboard();
    atualizarListaProdutos();
    atualizarEstoque();
    
    // Event listeners
    document.getElementById('formProduto').addEventListener('submit', cadastrarProduto);
    document.getElementById('searchProdutos').addEventListener('input', buscarProdutos);
    document.getElementById('codigoVenda').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            adicionarItem();
        }
    });
    
    // Limpar vendas do dia anterior
    const hoje = new Date().toDateString();
    const ultimaData = localStorage.getItem('ultimaData');
    if (ultimaData !== hoje) {
        vendasHoje = [];
        localStorage.setItem('ultimaData', hoje);
        salvarVendasHoje();
    }
});

// Navegação entre páginas
function showPage(pageId) {
    // Remover classe active de todas as páginas e botões
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Adicionar classe active na página e botão selecionados
    document.getElementById(pageId).classList.add('active');
    event.target.classList.add('active');
    
    // Atualizar dados específicos da página
    if (pageId === 'dashboard') {
        atualizarDashboard();
    } else if (pageId === 'produtos') {
        atualizarListaProdutos();
    } else if (pageId === 'estoque') {
        atualizarEstoque();
    }
}

// Funções de Produtos
function cadastrarProduto(e) {
    e.preventDefault();
    
    const codigo = document.getElementById('codigoProduto').value;
    const nome = document.getElementById('nomeProduto').value;
    const preco = parseFloat(document.getElementById('precoProduto').value);
    const quantidade = parseInt(document.getElementById('quantidadeProduto').value);
    const categoria = document.getElementById('categoriaProduto').value;
    
    // Verificar se o código já existe
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
    salvarProdutos();
    atualizarListaProdutos();
    atualizarDashboard();
    
    // Limpar formulário
    document.getElementById('formProduto').reset();
    alert('Produto cadastrado com sucesso!');
}

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

function buscarProdutos() {
    const termo = document.getElementById('searchProdutos').value.toLowerCase();
    const tbody = document.getElementById('tabelaProdutos');
    tbody.innerHTML = '';
    
    const produtosFiltrados = produtos.filter(produto => 
        produto.nome.toLowerCase().includes(termo) || 
        produto.codigo.toLowerCase().includes(termo)
    );
    
    produtosFiltrados.forEach(produto => {
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
        salvarProdutos();
        atualizarListaProdutos();
        atualizarDashboard();
    }
}

// Funções de Vendas
function adicionarItem() {
    const codigo = document.getElementById('codigoVenda').value.trim();
    if (!codigo) return;
    
    const produto = produtos.find(p => 
        p.codigo.toLowerCase() === codigo.toLowerCase() || 
        p.nome.toLowerCase().includes(codigo.toLowerCase())
    );
    
    if (!produto) {
        alert('Produto não encontrado!');
        return;
    }
    
    if (produto.quantidade <= 0) {
        alert('Produto sem estoque!');
        return;
    }
    
    // Verificar se o item já está no carrinho
    const itemExistente = carrinhoAtual.find(item => item.id === produto.id);
    
    if (itemExistente) {
        if (itemExistente.quantidade < produto.quantidade) {
            itemExistente.quantidade++;
        } else {
            alert('Quantidade máxima em estoque atingida!');
            return;
        }
    } else {
        carrinhoAtual.push({
            id: produto.id,
            codigo: produto.codigo,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: 1
        });
    }
    
    atualizarCarrinho();
    document.getElementById('codigoVenda').value = '';
}

function atualizarCarrinho() {
    const container = document.getElementById('itensVenda');
    
    if (carrinhoAtual.length === 0) {
        container.innerHTML = '<p>Nenhum item adicionado</p>';
        document.getElementById('totalVenda').textContent = '0,00';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    
    carrinhoAtual.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        const div = document.createElement('div');
        div.className = 'carrinho-item';
        div.innerHTML = `
            <div class="item-info">
                <strong>${item.nome}</strong><br>
                <small>R$ ${item.preco.toFixed(2)} cada</small>
            </div>
            <div class="item-quantidade">
                <button class="quantidade-btn" onclick="alterarQuantidade(${index}, -1)">-</button>
                <span>${item.quantidade}</span>
                <button class="quantidade-btn" onclick="alterarQuantidade(${index}, 1)">+</button>
            </div>
            <div class="item-subtotal">
                R$ ${subtotal.toFixed(2)}
            </div>
            <button class="btn-danger" onclick="removerItem(${index})">×</button>
        `;
        container.appendChild(div);
    });
    
    document.getElementById('totalVenda').textContent = total.toFixed(2);
}

function alterarQuantidade(index, delta) {
    const item = carrinhoAtual[index];
    const produto = produtos.find(p => p.id === item.id);
    
    const novaQuantidade = item.quantidade + delta;
    
    if (novaQuantidade <= 0) {
        removerItem(index);
        return;
    }
    
    if (novaQuantidade > produto.quantidade) {
        alert('Quantidade máxima em estoque atingida!');
        return;
    }
    
    item.quantidade = novaQuantidade;
    atualizarCarrinho();
}

function removerItem(index) {
    carrinhoAtual.splice(index, 1);
    atualizarCarrinho();
}

function limparVenda() {
    if (carrinhoAtual.length > 0 && confirm('Tem certeza que deseja limpar a venda?')) {
        carrinhoAtual = [];
        atualizarCarrinho();
    }
}

let vendaAtual = null;
let formaPagamentoSelecionada = null;

function finalizarVenda() {
    if (!caixaAberto) {
        alert('Abra o caixa antes de realizar vendas!');
        return;
    }
    
    if (carrinhoAtual.length === 0) {
        alert('Adicione itens à venda primeiro!');
        return;
    }
    
    let total = 0;
    const itensVenda = [];
    
    // Calcular total e preparar itens
    carrinhoAtual.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        itensVenda.push({
            ...item,
            subtotal
        });
    });
    
    // Preparar venda para processamento
    vendaAtual = {
        id: Date.now(),
        data: new Date().toISOString(),
        itens: itensVenda,
        total: total
    };
    
    // Mostrar modal de pagamento
    mostrarModalPagamento(total);
}

function mostrarModalPagamento(total) {
    document.getElementById('totalVendaModal').textContent = total.toFixed(2);
    document.getElementById('modalPagamento').style.display = 'block';
    
    // Resetar seleções
    formaPagamentoSelecionada = null;
    document.querySelectorAll('.forma-pagamento-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById('campoDinheiro').style.display = 'none';
    document.getElementById('btnConfirmarPagamento').style.display = 'none';
    document.getElementById('valorRecebido').value = '';
    document.getElementById('troco').style.display = 'none';
}

function fecharModalPagamento() {
    document.getElementById('modalPagamento').style.display = 'none';
    vendaAtual = null;
    formaPagamentoSelecionada = null;
}

function processarPagamento(forma) {
    formaPagamentoSelecionada = forma;
    
    // Resetar seleções visuais
    document.querySelectorAll('.forma-pagamento-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Marcar forma selecionada
    event.target.closest('.forma-pagamento-btn').classList.add('selected');
    
    // Mostrar campos específicos
    if (forma === 'dinheiro') {
        document.getElementById('campoDinheiro').style.display = 'block';
        document.getElementById('valorRecebido').focus();
        
        // Calcular troco em tempo real
        document.getElementById('valorRecebido').oninput = function() {
            const valorRecebido = parseFloat(this.value) || 0;
            const total = vendaAtual.total;
            
            if (valorRecebido >= total) {
                const troco = valorRecebido - total;
                document.getElementById('valorTroco').textContent = troco.toFixed(2);
                document.getElementById('troco').style.display = 'block';
                document.getElementById('btnConfirmarPagamento').style.display = 'inline-block';
            } else {
                document.getElementById('troco').style.display = 'none';
                document.getElementById('btnConfirmarPagamento').style.display = 'none';
            }
        };
    } else {
        document.getElementById('campoDinheiro').style.display = 'none';
        document.getElementById('btnConfirmarPagamento').style.display = 'inline-block';
    }
}

function confirmarPagamento() {
    if (!formaPagamentoSelecionada || !vendaAtual) {
        alert('Selecione uma forma de pagamento!');
        return;
    }
    
    let dadosPagamento = {
        forma: formaPagamentoSelecionada
    };
    
    // Validações específicas por forma de pagamento
    if (formaPagamentoSelecionada === 'dinheiro') {
        const valorRecebido = parseFloat(document.getElementById('valorRecebido').value) || 0;
        
        if (valorRecebido < vendaAtual.total) {
            alert('Valor recebido é insuficiente!');
            return;
        }
        
        dadosPagamento.valorRecebido = valorRecebido;
        dadosPagamento.troco = valorRecebido - vendaAtual.total;
    }
    
    // Adicionar dados de pagamento à venda
    vendaAtual.pagamento = dadosPagamento;
    
    // Processar venda
    processarVendaFinal();
}

function processarVendaFinal() {
    // Atualizar estoque
    carrinhoAtual.forEach(item => {
        const produto = produtos.find(p => p.id === item.id);
        if (produto) {
            produto.quantidade -= item.quantidade;
        }
    });
    
    // Adicionar venda aos registros
    vendas.push(vendaAtual);
    vendasHoje.push(vendaAtual);
    
    // Salvar dados
    salvarProdutos();
    salvarVendas();
    salvarVendasHoje();
    
    // Mostrar mensagem de sucesso
    let mensagem = `Venda finalizada com sucesso!\nTotal: R$ ${vendaAtual.total.toFixed(2)}\nPagamento: ${getFormaPagamentoTexto(vendaAtual.pagamento.forma)}`;
    
    if (vendaAtual.pagamento.forma === 'dinheiro' && vendaAtual.pagamento.troco > 0) {
        mensagem += `\nTroco: R$ ${vendaAtual.pagamento.troco.toFixed(2)}`;
    }
    
    alert(mensagem);
    
    // Limpar carrinho e fechar modal
    carrinhoAtual = [];
    atualizarCarrinho();
    fecharModalPagamento();
    
    // Atualizar displays
    atualizarDashboard();
    atualizarEstoque();
}

function getFormaPagamentoTexto(forma) {
    const formas = {
        'dinheiro': 'Dinheiro',
        'pix': 'PIX',
        'debito': 'Cartão de Débito',
        'credito': 'Cartão de Crédito'
    };
    return formas[forma] || forma;
}

// Funções de Estoque
function atualizarEstoque() {
    atualizarAlertasEstoque();
    atualizarListaEstoque();
}

function atualizarAlertasEstoque() {
    const container = document.getElementById('alertasEstoque');
    const produtosBaixoEstoque = produtos.filter(p => p.quantidade <= 5);
    
    if (produtosBaixoEstoque.length === 0) {
        container.innerHTML = '<p>Nenhum alerta de estoque</p>';
        return;
    }
    
    container.innerHTML = '';
    produtosBaixoEstoque.forEach(produto => {
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.innerHTML = `
            <span><strong>${produto.nome}</strong> - Apenas ${produto.quantidade} unidades restantes</span>
            <button onclick="reabastecer(${produto.id})">Reabastecer</button>
        `;
        container.appendChild(div);
    });
}

function atualizarListaEstoque() {
    const tbody = document.getElementById('tabelaEstoque');
    tbody.innerHTML = '';
    
    produtos.forEach(produto => {
        let status = 'ok';
        let statusText = 'Normal';
        
        if (produto.quantidade <= 2) {
            status = 'critico';
            statusText = 'Crítico';
        } else if (produto.quantidade <= 5) {
            status = 'baixo';
            statusText = 'Baixo';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.codigo}</td>
            <td>${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td><span class="status-badge status-${status}">${statusText}</span></td>
            <td>
                <button onclick="reabastecer(${produto.id})">Reabastecer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function reabastecer(id) {
    const quantidade = prompt('Quantidade a adicionar:');
    if (quantidade && !isNaN(quantidade) && parseInt(quantidade) > 0) {
        const produto = produtos.find(p => p.id === id);
        if (produto) {
            produto.quantidade += parseInt(quantidade);
            salvarProdutos();
            atualizarEstoque();
            atualizarDashboard();
        }
    }
}

// Funções de Relatórios
function gerarRelatorio() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        alert('Selecione as datas de início e fim!');
        return;
    }
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59); // Incluir o dia todo
    
    const vendasFiltradas = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= inicio && dataVenda <= fim;
    });
    
    let totalVendas = 0;
    vendasFiltradas.forEach(venda => totalVendas += venda.total);
    
    const ticketMedio = vendasFiltradas.length > 0 ? totalVendas / vendasFiltradas.length : 0;
    
    // Atualizar resumo
    document.getElementById('relatorioTotal').textContent = `R$ ${totalVendas.toFixed(2)}`;
    document.getElementById('relatorioQuantidade').textContent = vendasFiltradas.length;
    document.getElementById('relatorioTicketMedio').textContent = `R$ ${ticketMedio.toFixed(2)}`;
    
    // Atualizar detalhes
    const container = document.getElementById('vendasDetalhes');
    
    if (vendasFiltradas.length === 0) {
        container.innerHTML = '<p>Nenhuma venda encontrada no período selecionado</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Itens</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    vendasFiltradas.forEach(venda => {
        const data = new Date(venda.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR');
        const quantidadeItens = venda.itens.reduce((sum, item) => sum + item.quantidade, 0);
        
        html += `
            <tr>
                <td>${dataFormatada}</td>
                <td>${horaFormatada}</td>
                <td>${quantidadeItens}</td>
                <td>R$ ${venda.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Dashboard
function atualizarDashboard() {
    // Vendas de hoje
    const totalHoje = vendasHoje.reduce((sum, venda) => sum + venda.total, 0);
    document.getElementById('vendasHoje').textContent = `R$ ${totalHoje.toFixed(2)}`;
    
    // Total de produtos
    document.getElementById('totalProdutos').textContent = produtos.length;
    
    // Produtos com estoque baixo
    const estoqueBaixo = produtos.filter(p => p.quantidade <= 5).length;
    document.getElementById('estoqueBaixo').textContent = estoqueBaixo;
    
    // Vendas do mês
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const vendasMes = vendas.filter(venda => new Date(venda.data) >= inicioMes);
    const totalMes = vendasMes.reduce((sum, venda) => sum + venda.total, 0);
    document.getElementById('vendasMes').textContent = `R$ ${totalMes.toFixed(2)}`;
    
    // Últimas vendas
    atualizarUltimasVendas();
}

function atualizarUltimasVendas() {
    const container = document.getElementById('ultimasVendas');
    const ultimasVendas = vendas.slice(-5).reverse();
    
    if (ultimasVendas.length === 0) {
        container.innerHTML = '<p>Nenhuma venda registrada</p>';
        return;
    }
    
    container.innerHTML = '';
    ultimasVendas.forEach(venda => {
        const data = new Date(venda.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR');
        const formaPagamento = venda.pagamento ? getFormaPagamentoTexto(venda.pagamento.forma) : 'N/A';
        
        const div = document.createElement('div');
        div.className = 'sale-item';
        div.innerHTML = `
            <div>
                <strong>${dataFormatada} ${horaFormatada}</strong><br>
                <small>${venda.itens.length} itens - ${formaPagamento}</small>
            </div>
            <div>
                <strong>R$ ${venda.total.toFixed(2)}</strong>
            </div>
        `;
        container.appendChild(div);
    });
}

// Funções de persistência
function salvarProdutos() {
    localStorage.setItem('produtos', JSON.stringify(produtos));
}

function salvarVendas() {
    localStorage.setItem('vendas', JSON.stringify(vendas));
}

function salvarVendasHoje() {
    localStorage.setItem('vendasHoje', JSON.stringify(vendasHoje));
}

// Funções de Caixa
function verificarStatusCaixa() {
    const statusElement = document.getElementById('statusCaixa');
    const btnAbrir = document.getElementById('btnAbrirCaixa');
    const btnFechar = document.getElementById('btnFecharCaixa');
    const infoCaixa = document.getElementById('infoCaixa');
    
    if (caixaAberto) {
        statusElement.innerHTML = '<span class="status-badge status-aberto">Aberto</span>';
        btnAbrir.style.display = 'none';
        btnFechar.style.display = 'inline-block';
        infoCaixa.style.display = 'block';
        
        if (dadosCaixa.valorInicial !== undefined) {
            document.getElementById('valorInicial').textContent = dadosCaixa.valorInicial.toFixed(2);
        }
        if (dadosCaixa.horarioAbertura) {
            document.getElementById('horarioAbertura').textContent = new Date(dadosCaixa.horarioAbertura).toLocaleString('pt-BR');
        }
    } else {
        statusElement.innerHTML = '<span class="status-badge status-fechado">Fechado</span>';
        btnAbrir.style.display = 'inline-block';
        btnFechar.style.display = 'none';
        infoCaixa.style.display = 'none';
    }
}

function abrirCaixa() {
    document.getElementById('modalAberturaCaixa').style.display = 'block';
    document.getElementById('valorInicialCaixa').focus();
}

function fecharModalAbertura() {
    document.getElementById('modalAberturaCaixa').style.display = 'none';
    document.getElementById('valorInicialCaixa').value = '';
}

function confirmarAberturaCaixa() {
    const valorInicial = parseFloat(document.getElementById('valorInicialCaixa').value) || 0;
    
    if (valorInicial < 0) {
        alert('O valor inicial não pode ser negativo!');
        return;
    }
    
    caixaAberto = true;
    dadosCaixa = {
        valorInicial: valorInicial,
        horarioAbertura: new Date().toISOString(),
        data: new Date().toDateString()
    };
    
    // Verificar se é um novo dia e limpar vendas antigas
    const hoje = new Date().toDateString();
    const ultimaData = localStorage.getItem('ultimaData');
    if (ultimaData !== hoje) {
        vendasHoje = [];
        localStorage.setItem('ultimaData', hoje);
    }
    
    salvarDadosCaixa();
    fecharModalAbertura();
    verificarStatusCaixa();
    
    alert(`Caixa aberto com sucesso!\nValor inicial: R$ ${valorInicial.toFixed(2)}`);
}

function fecharCaixa() {
    const totalVendasHoje = vendasHoje.reduce((sum, venda) => sum + venda.total, 0);
    const vendasDinheiro = vendasHoje
        .filter(venda => venda.pagamento && venda.pagamento.forma === 'dinheiro')
        .reduce((sum, venda) => sum + venda.total, 0);
    
    const valorEsperado = dadosCaixa.valorInicial + vendasDinheiro;
    
    // Preencher modal de fechamento
    document.getElementById('resumoValorInicial').textContent = dadosCaixa.valorInicial.toFixed(2);
    document.getElementById('resumoVendas').textContent = totalVendasHoje.toFixed(2);
    document.getElementById('resumoDinheiro').textContent = vendasDinheiro.toFixed(2);
    document.getElementById('valorEsperado').textContent = valorEsperado.toFixed(2);
    
    document.getElementById('modalFechamentoCaixa').style.display = 'block';
    
    // Calcular diferença em tempo real
    document.getElementById('valorRealCaixa').oninput = function() {
        const valorReal = parseFloat(this.value) || 0;
        const diferenca = valorReal - valorEsperado;
        
        document.getElementById('valorDiferenca').textContent = Math.abs(diferenca).toFixed(2);
        
        const diferencaElement = document.getElementById('diferenca');
        diferencaElement.style.display = 'block';
        
        if (diferenca > 0) {
            diferencaElement.className = 'diferenca-info sobra';
            diferencaElement.querySelector('h4').innerHTML = `Sobra: R$ <span id="valorDiferenca">${diferenca.toFixed(2)}</span>`;
        } else if (diferenca < 0) {
            diferencaElement.className = 'diferenca-info falta';
            diferencaElement.querySelector('h4').innerHTML = `Falta: R$ <span id="valorDiferenca">${Math.abs(diferenca).toFixed(2)}</span>`;
        } else {
            diferencaElement.className = 'diferenca-info conferido';
            diferencaElement.querySelector('h4').innerHTML = `Conferido: R$ <span id="valorDiferenca">0,00</span>`;
        }
    };
}

function fecharModalFechamento() {
    document.getElementById('modalFechamentoCaixa').style.display = 'none';
    document.getElementById('valorRealCaixa').value = '';
    document.getElementById('diferenca').style.display = 'none';
}

function confirmarFechamentoCaixa() {
    const valorReal = parseFloat(document.getElementById('valorRealCaixa').value);
    
    if (isNaN(valorReal)) {
        alert('Informe o valor real em caixa!');
        return;
    }
    
    const totalVendasHoje = vendasHoje.reduce((sum, venda) => sum + venda.total, 0);
    const vendasDinheiro = vendasHoje
        .filter(venda => venda.pagamento && venda.pagamento.forma === 'dinheiro')
        .reduce((sum, venda) => sum + venda.total, 0);
    
    const valorEsperado = dadosCaixa.valorInicial + vendasDinheiro;
    const diferenca = valorReal - valorEsperado;
    
    // Salvar fechamento
    const fechamento = {
        data: new Date().toISOString(),
        valorInicial: dadosCaixa.valorInicial,
        totalVendas: totalVendasHoje,
        vendasDinheiro: vendasDinheiro,
        valorEsperado: valorEsperado,
        valorReal: valorReal,
        diferenca: diferenca,
        horarioAbertura: dadosCaixa.horarioAbertura,
        horarioFechamento: new Date().toISOString()
    };
    
    let fechamentos = JSON.parse(localStorage.getItem('fechamentos')) || [];
    fechamentos.push(fechamento);
    localStorage.setItem('fechamentos', JSON.stringify(fechamentos));
    
    // Fechar caixa
    caixaAberto = false;
    dadosCaixa = {};
    salvarDadosCaixa();
    
    fecharModalFechamento();
    verificarStatusCaixa();
    
    let mensagem = `Caixa fechado com sucesso!\n`;
    mensagem += `Total de vendas: R$ ${totalVendas.toFixed(2)}\n`;
    mensagem += `Valor esperado: R$ ${valorEsperado.toFixed(2)}\n`;
    mensagem += `Valor real: R$ ${valorReal.toFixed(2)}\n`;
    
    if (diferenca > 0) {
        mensagem += `Sobra: R$ ${diferenca.toFixed(2)}`;
    } else if (diferenca < 0) {
        mensagem += `Falta: R$ ${Math.abs(diferenca).toFixed(2)}`;
    } else {
        mensagem += `Caixa conferido!`;
    }
    
    alert(mensagem);
}

function salvarDadosCaixa() {
    localStorage.setItem('caixaAberto', JSON.stringify(caixaAberto));
    localStorage.setItem('dadosCaixa', JSON.stringify(dadosCaixa));
}

// Função de Exportação PDF
function exportarPDF() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        alert('Selecione as datas de início e fim antes de exportar!');
        return;
    }
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59);
    
    const vendasFiltradas = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= inicio && dataVenda <= fim;
    });
    
    if (vendasFiltradas.length === 0) {
        alert('Nenhuma venda encontrada no período selecionado!');
        return;
    }
    
    // Criar conteúdo HTML para PDF
    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Relatório de Vendas</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .period { color: #666; margin-bottom: 20px; }
                .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .summary-item { display: flex; justify-content: space-between; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; background: #e8f4f8; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sistema de Caixa - Mercadinho</h1>
                <h2>Relatório de Vendas</h2>
                <div class="period">Período: ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}</div>
            </div>
    `;
    
    // Resumo
    let totalVendas = 0;
    let totalDinheiro = 0;
    let totalPix = 0;
    let totalDebito = 0;
    let totalCredito = 0;
    
    vendasFiltradas.forEach(venda => {
        totalVendas += venda.total;
        if (venda.pagamento) {
            switch(venda.pagamento.forma) {
                case 'dinheiro': totalDinheiro += venda.total; break;
                case 'pix': totalPix += venda.total; break;
                case 'debito': totalDebito += venda.total; break;
                case 'credito': totalCredito += venda.total; break;
            }
        }
    });
    
    const ticketMedio = totalVendas / vendasFiltradas.length;
    
    htmlContent += `
        <div class="summary">
            <h3>Resumo do Período</h3>
            <div class="summary-item"><span>Total de Vendas:</span><span>R$ ${totalVendas.toFixed(2)}</span></div>
            <div class="summary-item"><span>Número de Vendas:</span><span>${vendasFiltradas.length}</span></div>
            <div class="summary-item"><span>Ticket Médio:</span><span>R$ ${ticketMedio.toFixed(2)}</span></div>
            <br>
            <h4>Por Forma de Pagamento:</h4>
            <div class="summary-item"><span>Dinheiro:</span><span>R$ ${totalDinheiro.toFixed(2)}</span></div>
            <div class="summary-item"><span>PIX:</span><span>R$ ${totalPix.toFixed(2)}</span></div>
            <div class="summary-item"><span>Cartão Débito:</span><span>R$ ${totalDebito.toFixed(2)}</span></div>
            <div class="summary-item"><span>Cartão Crédito:</span><span>R$ ${totalCredito.toFixed(2)}</span></div>
        </div>
        
        <h3>Detalhamento das Vendas</h3>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Itens</th>
                    <th>Forma de Pagamento</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Detalhes das vendas
    vendasFiltradas.forEach(venda => {
        const data = new Date(venda.data);
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const horaFormatada = data.toLocaleTimeString('pt-BR');
        const quantidadeItens = venda.itens.reduce((sum, item) => sum + item.quantidade, 0);
        const formaPagamento = venda.pagamento ? getFormaPagamentoTexto(venda.pagamento.forma) : 'N/A';
        
        htmlContent += `
            <tr>
                <td>${dataFormatada}</td>
                <td>${horaFormatada}</td>
                <td>${quantidadeItens}</td>
                <td>${formaPagamento}</td>
                <td>R$ ${venda.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    htmlContent += `
            </tbody>
        </table>
        
        <p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            Relatório gerado em ${new Date().toLocaleString('pt-BR')}
        </p>
        </body>
        </html>
    `;
    
    // Criar e baixar arquivo
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-vendas-${dataInicio}-a-${dataFim}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Relatório HTML gerado! Você pode abrir o arquivo baixado em seu navegador e usar a função "Imprimir" para salvar como PDF.');
}

// Dados de exemplo (apenas na primeira execução)
if (produtos.length === 0) {
    produtos = [
        {
            id: 1,
            codigo: '001',
            nome: 'Coca-Cola 2L',
            preco: 8.50,
            quantidade: 24,
            categoria: 'bebidas',
            dataCadastro: new Date().toISOString()
        },
        {
            id: 2,
            codigo: '002',
            nome: 'Pão de Açúcar',
            preco: 6.90,
            quantidade: 15,
            categoria: 'alimenticios',
            dataCadastro: new Date().toISOString()
        },
        {
            id: 3,
            codigo: '003',
            nome: 'Detergente Ypê',
            preco: 2.95,
            quantidade: 8,
            categoria: 'limpeza',
            dataCadastro: new Date().toISOString()
        },
        {
            id: 4,
            codigo: '004',
            nome: 'Sabonete Dove',
            preco: 3.50,
            quantidade: 3,
            categoria: 'higiene',
            dataCadastro: new Date().toISOString()
        }
    ];
    salvarProdutos();
}
