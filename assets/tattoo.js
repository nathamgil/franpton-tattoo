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

  /* ---- referências em imagem: até 5, reduzidas no navegador ----
     Cada imagem vira um JPEG de ~1280px (qualidade 0,8) antes de ser
     guardada. O motor recebe a lista por CFG.anexos() e grava junto
     com o pedido (localStorage na demo, Storage do Supabase no real). */
  var MAX_ANEXOS = 5, MAX_MB = 20, LADO = 1280;
  var anexos = [];   // [{ url: dataURL jpeg }]
  var TIPOS = /^image\/(jpe?g|png|webp|heic|heif)$/i, EXTS = /\.(jpe?g|png|webp|heic|heif)$/i;

  var boxAnexo = el('div', 'campo anexos');
  boxAnexo.id = 'pj-anexos';
  var rotAnexo = el('span', 'rotulo-campo', 'Imagens de referência ');
  rotAnexo.appendChild(el('small', null, '(opcional, até ' + MAX_ANEXOS + ')'));
  var zona = el('div', 'anexo-zona');
  var btnAnexo = el('button', 'btn btn-linha anexo-add');
  btnAnexo.type = 'button';
  btnAnexo.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="m21 15-5-5L5 21"/></svg><span>Adicionar referência</span>';
  var inputAnexo = el('input');
  inputAnexo.type = 'file'; inputAnexo.multiple = true; inputAnexo.hidden = true;
  inputAnexo.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
  var dicaAnexo = el('p', 'anexo-dica', 'Print, foto ou imagem salva: JPG, PNG, WEBP ou HEIC.');
  dicaAnexo.appendChild(el('span', 'so-desktop', ' Se preferir, arraste as imagens para cá.'));
  zona.appendChild(btnAnexo); zona.appendChild(dicaAnexo); zona.appendChild(inputAnexo);
  var listaAnexo = el('ul', 'anexo-lista');
  var msgAnexo = el('div', 'anexo-msg');
  msgAnexo.setAttribute('aria-live', 'polite');
  boxAnexo.appendChild(rotAnexo); boxAnexo.appendChild(zona);
  boxAnexo.appendChild(listaAnexo); boxAnexo.appendChild(msgAnexo);
  var campoIdeia = $('#pj-ideia').closest('.campo');
  campoIdeia.parentNode.insertBefore(boxAnexo, campoIdeia.nextSibling);

  function avisaAnexo(txt) {
    msgAnexo.innerHTML = '';
    if (txt) msgAnexo.appendChild(el('div', 'aviso aviso-erro', txt));
  }
  function pintaAnexos() {
    listaAnexo.innerHTML = '';
    anexos.forEach(function (a, i) {
      var li = el('li');
      var im = el('img'); im.src = a.url; im.alt = 'Referência ' + (i + 1);
      var x = el('button', 'anexo-tira');
      x.type = 'button'; x.setAttribute('aria-label', 'Remover referência ' + (i + 1));
      x.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      x.addEventListener('click', function () { anexos.splice(i, 1); avisaAnexo(''); pintaAnexos(); });
      li.appendChild(im); li.appendChild(x);
      listaAnexo.appendChild(li);
    });
    var cheio = anexos.length >= MAX_ANEXOS;
    btnAnexo.disabled = cheio;
    btnAnexo.lastChild.textContent = cheio ? 'Limite de ' + MAX_ANEXOS + ' imagens'
      : anexos.length ? 'Adicionar mais uma' : 'Adicionar referência';
  }

  // abre a imagem (inclusive HEIC no Safari) e devolve um JPEG reduzido
  function reduz(arquivo) {
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(arquivo), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, LADO / Math.max(w, h));
        var cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
        var cx = cv.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);   // PNG transparente não fica preto
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        ok(cv.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { URL.revokeObjectURL(url); falha(); };
      img.src = url;
    });
  }

  function recebe(arquivos) {
    arquivos = Array.prototype.slice.call(arquivos || []);
    if (!arquivos.length) return;
    var erros = [], vagas = MAX_ANEXOS - anexos.length;
    if (arquivos.length > vagas) {
      erros.push('Cabem até ' + MAX_ANEXOS + ' imagens. ' + (vagas > 0 ? 'Fiquei com as ' + vagas + ' primeiras.' : 'Remova uma para trocar.'));
      arquivos = arquivos.slice(0, Math.max(0, vagas));
    }
    var validos = arquivos.filter(function (f) {
      if (!TIPOS.test(f.type) && !EXTS.test(f.name)) { erros.push('"' + f.name + '" não é imagem. Use JPG, PNG, WEBP ou HEIC.'); return false; }
      if (f.size > MAX_MB * 1048576) { erros.push('"' + f.name + '" passa de ' + MAX_MB + ' MB. Tente um print da imagem.'); return false; }
      return true;
    });
    avisaAnexo(erros.join(' '));
    if (!validos.length) return;
    btnAnexo.disabled = true;
    btnAnexo.lastChild.textContent = 'Preparando…';
    validos.reduce(function (fila, f) {
      return fila.then(function () {
        return reduz(f).then(function (dataUrl) {
          if (anexos.length < MAX_ANEXOS) anexos.push({ url: dataUrl });
        }, function () {
          erros.push(/\.hei[cf]$/i.test(f.name) || /hei[cf]/i.test(f.type)
            ? 'Este navegador não abre a foto HEIC "' + f.name + '". Tire um print dela ou salve como JPG.'
            : 'Não consegui abrir "' + f.name + '". Tente outra imagem ou um print.');
        });
      });
    }, Promise.resolve()).then(function () { avisaAnexo(erros.join(' ')); pintaAnexos(); });
  }

  btnAnexo.addEventListener('click', function () { inputAnexo.click(); });
  inputAnexo.addEventListener('change', function () { recebe(this.files); this.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) {
    zona.addEventListener(t, function (ev) { ev.preventDefault(); zona.classList.add('arrastando'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    zona.addEventListener(t, function (ev) { ev.preventDefault(); zona.classList.remove('arrastando'); });
  });
  zona.addEventListener('drop', function (ev) { recebe(ev.dataTransfer && ev.dataTransfer.files); });
  pintaAnexos();

  function contaRef(n) { return n + (n === 1 ? ' imagem de referência anexada' : ' imagens de referência anexadas'); }

  /* ---- ganchos que o motor (agenda.js) chama ---- */
  CFG.anexos = function () { return anexos.map(function (a) { return a.url; }); };
  CFG.montaObs = function () {
    var p = projeto(), ref = $('#cli-obs').value.trim();
    return [
      'Estilo: ' + (p.estilo || 'não informado'),
      'Local: ' + (p.local || 'não informado'),
      'Tamanho: ' + p.tamanho
    ].concat(p.extras, [
      'Ideia: ' + (p.ideia || 'não informada'),
      anexos.length ? 'Referências: ' + contaRef(anexos.length) + ' ao pedido' : '',
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
    anexos = []; avisaAnexo(''); pintaAnexos();
    okAnexos.hidden = true;
  };

  /* ---- confirmação: avisa que as imagens já chegaram ao artista ----
     O link do WhatsApp não leva arquivo; as imagens vão pelo pedido.
     O motor devolve em a.anexos quantas conseguiu guardar. */
  var okAnexos = el('p', 'anexo-ok');
  okAnexos.hidden = true;
  $('#ok-linha').parentNode.insertBefore(okAnexos, $('#ok-linha').nextSibling);
  document.addEventListener('tv:agendado', function (ev) {
    var a = ev.detail || {}, pedidas = anexos.length, salvas = a.anexos == null ? pedidas : a.anexos;
    okAnexos.hidden = !pedidas;
    if (!pedidas) return;
    if (salvas >= pedidas) {
      okAnexos.className = 'anexo-ok';
      okAnexos.textContent = (pedidas === 1 ? 'Sua referência já foi enviada' : 'Suas ' + pedidas + ' referências já foram enviadas') + ' para o ' + a.barbeiro + '.';
      return;
    }
    // demo sem espaço no aparelho: não finge que foi; corrige o resumo
    okAnexos.className = 'anexo-ok anexo-falhou';
    okAnexos.textContent = salvas
      ? 'Só ' + salvas + ' de ' + pedidas + ' referências couberam no pedido. Mande as outras na conversa.'
      : 'Não deu para guardar as imagens de referência neste aparelho. Mande as imagens na conversa.';
    var antes = 'Referências: ' + contaRef(pedidas) + ' ao pedido';
    var depois = salvas ? 'Referências: ' + contaRef(salvas) + ' ao pedido (mando as outras aqui)' : 'Referências: mando as imagens aqui na conversa';
    CFG.ultimoResumo = (CFG.ultimoResumo || '').replace(antes, depois);
    var zap = $('#ok-zap');
    if (CFG.whatsapp && zap) zap.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(CFG.ultimoResumo);
  });

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
