/* =====================================================================
   Franpton - Tattoo Studio — configuração
   Único arquivo que precisa ser editado para o site sair do modo de
   demonstração e entrar no ar de verdade.
   ===================================================================== */

window.TV = {

  /* ---- Estúdio ------------------------------------------------------ */
  nome:       'Franpton - Tattoo Studio',
  slogan:     'Tattoo Studio · Salvador, BA',
  instagram:  'franptontattoo',
  artistaInstagram: 'davidfranpton_',

  // WhatsApp do estúdio em formato internacional, só dígitos.
  // A CONFIRMAR com o David: enquanto estiver vazio, os botões de contato
  // levam para o Direct do Instagram.
  whatsapp:        '',
  whatsappVisivel: '',

  // Endereço exato A CONFIRMAR. O Instagram só diz "Salvador - BA".
  endereco: {
    linha1: 'Franpton - Tattoo Studio',
    linha2: 'Salvador — BA',
    maps:   'https://www.google.com/maps/search/?api=1&query=Franpton+Tattoo+Studio+Salvador+BA',
    busca:  'Franpton Tattoo Studio, Salvador - BA'
  },

  /* ---- Supabase ---------------------------------------------------
     Enquanto estes dois campos estiverem vazios, o site roda em MODO
     DEMONSTRAÇÃO: o pedido funciona de verdade na tela, mas fica guardado
     só no navegador de quem está olhando.

     Para ligar de verdade:
       1. supabase.com  ->  New project (região: South America / São Paulo)
       2. SQL Editor    ->  cole e rode db/schema.sql inteiro
       3. Settings > API -> copie "Project URL" e a chave "anon public"
       4. cole abaixo e suba pro GitHub

     A chave anon é pública por natureza — ela aparece no código do site.
     Quem protege os dados é o RLS + as funções do schema.sql, não ela.
  ------------------------------------------------------------------ */
  supabaseUrl: '',
  supabaseKey: '',

  /* ---- Regras da agenda (espelham o db/schema.sql) ----------------
     Mudou aqui? Mude no banco também — o banco é quem manda de verdade.
  ------------------------------------------------------------------ */
  regras: {
    passoMin:        30,   // grade de meia em meia hora
    antecedenciaMin: 30,
    janelaDias:      30,   // até 30 dias à frente
    cancelamentoH:   2     // cancela sozinho até 2h antes
  },

  /* ---- Expediente (0 = domingo) ------------------------------------
     A CONFIRMAR: o Instagram não informa horário. Seg a Sáb, 10h às 19h,
     é só um ponto de partida para a demonstração funcionar.
  ------------------------------------------------------------------ */
  expediente: {
    0: { aberto: false },
    1: { aberto: true, abre: '10:00', fecha: '19:00' },
    2: { aberto: true, abre: '10:00', fecha: '19:00' },
    3: { aberto: true, abre: '10:00', fecha: '19:00' },
    4: { aberto: true, abre: '10:00', fecha: '19:00' },
    5: { aberto: true, abre: '10:00', fecha: '19:00' },
    6: { aberto: true, abre: '10:00', fecha: '19:00' }
  },

  /* ---- Dados usados no modo demonstração --------------------------
     No ar de verdade, artista e tipos de sessão vêm do banco, não daqui.
     Um artista só: a etapa "com quem" some sozinha do agendamento.
     (barbeirosDemo é o nome interno que o motor usa para "artistas".)
  ------------------------------------------------------------------ */
  barbeirosDemo: [
    { id:'david', slug:'david', nome:'David Franpton', foto:'', instagram:'davidfranpton_', cargo:'Tatuador' }
  ],

  // Tatuagem não tem preço fixo: tudo sai como "sob orçamento" (preco 0).
  // Durações A CONFIRMAR: servem só para reservar o tempo certo na agenda.
  servicosDemo: [
    { id:'orcamento',     nome:'Orçamento / avaliação', descricao:'Conversa de 30 min para ver a ideia, o local e o tamanho, e fechar valor e data.', preco_centavos:0, a_partir_de:false, duracao_min:30,  categoria:'Primeiro passo' },
    { id:'sessao-pequena', nome:'Sessão pequena',       descricao:'Peças delicadas e de traço fino, até uns 10 cm.',                                preco_centavos:0, a_partir_de:false, duracao_min:120, categoria:'Sessões' },
    { id:'sessao-media',   nome:'Sessão média',         descricao:'Antebraço, panturrilha, costela: peças com mais detalhe e sombra.',               preco_centavos:0, a_partir_de:false, duracao_min:240, categoria:'Sessões' },
    { id:'sessao-fechada', nome:'Sessão fechada',       descricao:'O dia inteiro reservado para projetos grandes, como fechamento de braço ou costas.', preco_centavos:0, a_partir_de:false, duracao_min:360, categoria:'Sessões' },
    { id:'retoque',        nome:'Retoque',              descricao:'Para tattoo já cicatrizada que precisa de um reforço.',                            preco_centavos:0, a_partir_de:false, duracao_min:60,  categoria:'Depois' }
  ],

  /* ---- Estilos que aparecem no pedido --------------------------------
     Tirados dos destaques e posts do Instagram. A CONFIRMAR com o David.
  ------------------------------------------------------------------ */
  estilos: ['Delicada / fineline', 'Realismo preto e cinza', 'Colorida', 'Ornamental / mandala', 'Traço / cartoon', 'Ainda não sei']
};

window.TV.modoDemo = !(window.TV.supabaseUrl && window.TV.supabaseKey);
