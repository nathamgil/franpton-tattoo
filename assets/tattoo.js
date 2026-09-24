/* =====================================================================
   Peças da página de tatuagem — carrega ANTES de agenda.js.
   - monta os chips de estilo, sim/não e os cards de tipo de sessão
   - guarda os detalhes do projeto e entrega ao motor como observação
     (CFG.montaObs / CFG.resumoProjeto / CFG.limpaProjeto)
   - só deixa escolher o tipo de sessão depois de contar o projeto
   - copia o resumo pronto para colar no Direct quando não há WhatsApp
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.TV;
  function $(s) { return document.querySelector(s); }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function irAgendar() { $('#agendar').scrollIntoView({ behavior: 'smooth' }); }
  function duracao(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? String(m).padStart(2, '0') : '');
  }

  $('#ano').textContent = new Date().getFullYear();
  if (CFG.modoDemo) $('#faixa-demo').hidden = false;
  var contato = $('#link-contato');
  if (CFG.whatsapp && contato) {
    contato.href = 'https://wa.me/' + CFG.whatsapp;
    contato.textContent = CFG.whatsappVisivel ? 'WhatsApp ' + CFG.whatsappVisivel : 'Chamar no WhatsApp';
  }

  /* ---- estilos: vitrine + escolha no pedido ---- */
  var vitrine = $('#lista-estilos');
  var boxEstilo = $('#pj-estilo');
  (CFG.estilos || []).forEach(function (e) {
    if (vitrine && !/não sei/i.test(e)) vitrine.appendChild(el('span', null, e));
    var c = el('button', 'chip', e);
    c.type = 'button'; c.setAttribute('aria-pressed', 'false');
    boxEstilo.appendChild(c);
  });

  // países onde o artista também atende (só se houver a seção)
  var paises = $('#paises');
  if (paises) (CFG.viagens || []).forEach(function (p) { paises.appendChild(el('span', null, p)); });

  // chips: um escolhido por grupo (estilo, primeira tattoo, cobertura)
  function grupoDeChips(box) {
    box.addEventListener('click', function (ev) {
      var c = ev.target.closest('.chip'); if (!c) return;
      var ligado = c.getAttribute('aria-pressed') === 'true';
      Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (x) { x.setAttribute('aria-pressed', 'false'); });
      c.setAttribute('aria-pressed', ligado ? 'false' : 'true');
      box.classList.remove('falta');
    });
  }
  grupoDeChips(boxEstilo);
  Array.prototype.forEach.call(document.querySelectorAll('[data-grupo]'), grupoDeChips);

  function escolhido(box) {
    var c = box && box.querySelector('.chip[aria-pressed="true"]');
    return c ? c.textContent : '';
  }
  function projeto() {
    return {
      estilo:    escolhido(boxEstilo),
      local:     $('#pj-local').value,
      tamanho:   $('#pj-tamanho').value || 'Não sei ainda',
      ideia:     $('#pj-ideia').value.trim(),
      // perguntas de escolha única (primeira tattoo, cobertura...): cada grupo traz o próprio rótulo
      extras:    Array.prototype.map.call(document.querySelectorAll('[data-grupo]'), function (g) {
        var v = escolhido(g);
        return v ? g.getAttribute('data-rotulo') + ': ' + v : '';
      }).filter(Boolean)
    };
  }

  /* ---- ganchos que o motor (agenda.js) chama ---- */
  CFG.montaObs = function () {
    var p = projeto(), ref = $('#cli-obs').value.trim();
    return [
      'Estilo: ' + (p.estilo || 'não informado'),
      'Local: ' + (p.local || 'não informado'),
      'Tamanho: ' + p.tamanho
    ].concat(p.extras, [
      'Ideia: ' + (p.ideia || 'não informada'),
      ref ? 'Referência: ' + ref : ''
    ]).filter(Boolean).join('\n');
  };
  CFG.resumoProjeto = function () {
    var p = projeto();
    return ['Projeto', [p.estilo, p.local, p.tamanho].filter(Boolean).join(' · ')];
  };
  CFG.limpaProjeto = function () {
    Array.prototype.forEach.call(document.querySelectorAll('#projeto .chip'), function (x) { x.setAttribute('aria-pressed', 'false'); });
    $('#pj-local').value = ''; $('#pj-tamanho').value = ''; $('#pj-ideia').value = '';
    $('#msg-projeto').innerHTML = '';
  };

  /* ---- só passa para a data com o projeto contado ----
     Ouvinte em captura no contêiner: roda antes do clique do motor e
     segura o avanço se faltar estilo, local ou ideia. */
  $('#lista-servicos').addEventListener('click', function (ev) {
    if (!ev.target.closest('button')) return;
    var p = projeto(), falta = [];
    [[!p.estilo, $('#pj-estilo-box'), 'o estilo'],
     [!p.local, $('#pj-local'), 'o local do corpo'],
     [p.ideia.length < 8, $('#pj-ideia'), 'a sua ideia']].forEach(function (f) {
      f[1].classList.toggle('falta', f[0]);
      if (f[0]) falta.push(f[2]);
    });
    var msg = $('#msg-projeto');
    msg.innerHTML = '';
    if (!falta.length) return;
    ev.stopPropagation(); ev.preventDefault();
    msg.appendChild(el('div', 'aviso aviso-erro', 'Antes de escolher a sessão, conte ' + falta.join(', ') + '.'));
    $('#projeto').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, true);
  ['#pj-local', '#pj-ideia'].forEach(function (s) {
    $(s).addEventListener('input', function () { this.classList.remove('falta'); });
  });

  /* ---- cards de tipo de sessão + próxima avaliação livre ---- */
  function pintaTipos(servicos) {
    var alvo = $('#tipos');
    alvo.innerHTML = '';
    servicos.forEach(function (s, i) {
      var c = el('article', 'tipo' + (i === 0 ? ' destaque' : ''));
      c.appendChild(el('h3', null, s.nome));
      c.appendChild(el('p', null, s.descricao || ''));
      var meta = el('div', 'meta');
      meta.appendChild(el('span', null, 'reserva ' + duracao(s.duracao_min)));
      meta.appendChild(el('b', null, s.preco_centavos ? 'R$ ' + (s.preco_centavos / 100).toFixed(2).replace('.', ',') : 'Sob orçamento'));
      c.appendChild(meta);
      var b = el('button', 'btn btn-linha mini', i === 0 ? 'Começar por aqui' : 'Pedir orçamento');
      b.type = 'button'; b.style.marginTop = '.6rem';
      b.addEventListener('click', irAgendar);
      c.appendChild(b);
      alvo.appendChild(c);
    });
  }
  function pintaLivre(artistas, servicos) {
    var caixa = $('#livre-avaliacao');
    if (!caixa || !artistas.length || !servicos.length) return;
    CFG.proximoLivre(artistas[0], servicos[0]).then(function (p) {
      caixa.textContent = p
        ? 'Próxima avaliação livre: ' + CFG.diaRelativo(p.dia).replace(/, \d+ de .*/, '').toLowerCase() + ' às ' + p.hora
        : 'Agenda cheia nos próximos dias';
    }).catch(function () { caixa.hidden = true; });
  }
  var dados = null;
  document.addEventListener('tv:dados', function (ev) {
    dados = ev.detail;
    pintaTipos(dados.servicos);
    pintaLivre(dados.barbeiros, dados.servicos);
  });
  document.addEventListener('tv:agendado', function () { if (dados) pintaLivre(dados.barbeiros, dados.servicos); });

  /* ---- resumo pronto: copiar e, sem WhatsApp, colar no Direct ---- */
  function copia(avisoTxt) {
    var txt = CFG.ultimoResumo || '', saida = $('#ok-copiado');
    function ok() { saida.textContent = avisoTxt; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, function () { saida.textContent = txt; });
    } else { saida.textContent = txt; }
  }
  $('#ok-copiar').addEventListener('click', function () { copia('Resumo copiado. É só colar na conversa.'); });
  $('#ok-zap').addEventListener('click', function () {
    if (!CFG.whatsapp) copia('Resumo copiado. Cole no Direct que acabou de abrir.');
  });
})();
