const Cartografias = (() => {
  const KEY = 'vestibular_bia_topics_v1';

  const DATA = {
    'Biologia': {
      icon: '🧬', color: '#10B981',
      anos: {
        '1º Ano': ['Conceitos básicos de ecologia','Dinâmica de populações','Ecologia trófica','Ciclos biogeoquímicos','Sucessão ecológica','Biomas','Evolução biológica','Especiação','Genética','Moléculas de herança (DNA/RNA)','Biotecnologia'],
        '2º Ano': ['Biomoléculas','Fisiologia: aspectos gerais','Fisiologia humana: respiração','Fisiologia humana: circulação e sangue','Fisiologia humana: digestão e filtração','Fisiologia vegetal: condução da água','Fisiologia vegetal: fotossíntese','Embriologia','Fisiologia humana: sistema endócrino','Fisiologia humana: sistema nervoso','Parasitoses humanas'],
        '3º Ano': ['Divisão celular','Taxonomia e nomenclatura','Diversidade de microrganismos','Diversidade animal','Diversidade vegetal','Reprodução humana','Resposta imunológica','Doenças e saúde pública','Biotecnologia e ética'],
        'Aprofundamento': ['Vitaminas','Histologia animal','Genética de populações','Histologia vegetal','Hormônios vegetais','Fotossíntese (avançado)']
      }
    },
    'Física': {
      icon: '⚛️', color: '#06B6D4',
      anos: {
        '1º Ano': ['Propagação de calor','Termometria','Calorimetria','Dilatação dos corpos','Reflexão de luz (óptica)','Refração de luz','Ótica da visão','Espelhos e lentes'],
        '2º Ano': ['MRU e MRUV','Lançamentos e vetores','Grandezas vetoriais','Leis de Newton','Trabalho e energia','Impulso e momento','Princípio de Arquimedes','Ondas e som','Eletrostática','Circuitos elétricos','Lei de Ohm'],
        '3º Ano': ['Gravitação Universal','Equilíbrio de um gás ideal','Primeira Lei da Termodinâmica','Lei de Coulomb','Campo elétrico','Associação de resistores','Potência elétrica','Força magnética','Campo magnético de fio','Indução eletromagnética','Física nuclear e radioatividade'],
        'Aprofundamento': ['Cálculo diferencial aplicado','Força elástica e amortecimento','Efeito Doppler','Interferência e difração','Física moderna e relatividade']
      }
    },
    'Química': {
      icon: '🧪', color: '#F59E0B',
      anos: {
        '1º Ano': ['Propriedades da matéria','Densidade','Separação de misturas','Temperatura de fusão e ebulição','Tabela periódica','Radioatividade','Ligações químicas','Geometria molecular'],
        '2º Ano': ['Propriedades das ligações covalentes','Forças intermoleculares','Reações inorgânicas','Cálculo estequiométrico','Funções inorgânicas','Soluções e concentração','Gases','Termodinâmica química'],
        '3º Ano': ['Teoria das colisões','Velocidade das reações','Equilíbrio químico','Equilíbrio ácido-base (pH)','Deslocamento de equilíbrio','Eletroquímica','Eletrólise','Funções orgânicas','Estrutura e isomeria orgânica','Polímeros','Reações orgânicas'],
        'Aprofundamento': ['Le Chatelier (cinética)','Reações orgânicas avançadas','Hidrólise salina','Equilíbrio de solubilidade','Sistema tampão','Eletroquímica quantitativa','Biomoléculas']
      }
    },
    'Matemática': {
      icon: '📐', color: '#4F46E5',
      anos: {
        '1º Ano': ['Porcentagem','Juros simples e compostos','Progressão Aritmética (PA)','Progressão Geométrica (PG)','Introdução às funções','Função Afim','Função Exponencial','Função Logarítmica','Funções Trigonométricas','Semelhança de triângulos','Trigonometria no triângulo retângulo','Trigonometria no triângulo obliquiângulo','Área de figuras planas','Círculo e circunferência','Polígonos regulares'],
        '2º Ano': ['Probabilidade','Estatística','Análise combinatória','Geometria: quadriláteros notáveis','Pontos notáveis do triângulo','Geometria Espacial: prismas e pirâmides','Geometria Espacial: cone e cilindro','Geometria Espacial: esfera'],
        '3º Ano': ['Trigonometria: adição de arcos','Trigonometria: duplicação de arcos','Equações algébricas','Sistemas de equações','Matrizes','Determinantes','Limites (introdução)'],
        'Aprofundamento': ['Inequações produto e 2º grau','Trigonometria avançada','Números complexos: forma algébrica']
      }
    },
    'História do Brasil': {
      icon: '🇧🇷', color: '#EF4444',
      anos: {
        '1º Ano': ['Pré-história brasileira','Formação colonial e questão social','Brasil: sociedade colonial e escravidão','Brasil: economia colonial','Revoltas coloniais','Brasil no mundo colonial'],
        '2º Ano': ['Brasil no século XX','Formação de regimes no Brasil','Abolição e pós-escravidão','Revoltas da Primeira República','Brasil: Período Vargas (1930–1945)','Era Vargas: Estado Novo'],
        '3º Ano': ['Brasil: Geopolítica e Estado','República dos Estados Unidos do Brasil','Era Vargas (1945–1964)','Ditadura Militar (1964–1985)','Redemocratização e Constituição de 1988'],
        'Temas Interdisciplinares': ['História afro-brasileira e povos originários','Questões de gênero na história','Movimentos sociais brasileiros']
      }
    },
    'História Geral': {
      icon: '🌍', color: '#F97316',
      anos: {
        '1º Ano': ['Pré-história e primeiras civilizações','Civilizações da Mesopotâmia e Egito','Grécia Antiga','Roma Antiga','Ásia Antiga: China, Índia, Pérsia','Renascimento Cultural e Científico'],
        '2º Ano': ['Neocolonialismo','Revoluções políticas (Francesa, Americana)','Liberalismo Econômico','Revolução Industrial','Imperialismo europeu','Primeira Guerra Mundial','Nazismo e fascismo','Segunda Guerra Mundial','Guerra Fria: EUA × URSS','Globalização'],
        '3º Ano': ['Europa pós-1945','Descolonização da África e Ásia','Genocídio Armênio','Imperialismo na Ásia','Terrorismo internacional','Conflitos Israel/Palestina','Crise da democracia contemporânea'],
        'Aprofundamento': ['Revolução Francesa (aprofundada)','Independências das Américas','Fascismo italiano: contexto e legado','Guerra Fria: cultura e sociedade']
      }
    },
    'Geografia': {
      icon: '🗺️', color: '#84CC16',
      anos: {
        '1º Ano': ['Linguagem e espaço geográfico','Formação geográfica e histórica do mundo','Território e territorialidade','Divisão do mundo (Norte/Sul, blocos)','Migrações e refugiados','Circuito de produção e globalização','Conflitos e relações internacionais','Neocolonialismo','Mudanças climáticas e meio ambiente'],
        '2º Ano': ['Geopolítica e globalização','Urbanização mundial','Industrialização e desindustrialização','Agricultura, agronegócio e agroecologia','Biomas e vegetação','Hidrografia','Relevo e solos'],
        '3º Ano': ['Geopolítica do Brasil','Urbanização brasileira e problemas urbanos','Nordeste: questão hídrica e semiárido','Agronegócio e questão ambiental no Brasil','Desigualdades regionais brasileiras','Amazônia: ocupação e desmatamento'],
        'Aprofundamento': ['Cartografia avançada','China e o poder global asiático','Geopolítica do Oriente Médio','Crise climática: acordos e perspectivas']
      }
    },
    'Filosofia': {
      icon: '🤔', color: '#8B5CF6',
      anos: {
        '2º Ano': ['Filosofia Antiga: Platão','Poder e Controle Social: Foucault','Existencialismo: Sartre','Atitude dogmática e crítica','Nascimento da filosofia','Iluminismo e razão','Gênero e filosofia'],
        '3º Ano': ['Pré-socráticos','Filosofia Antiga: Aristóteles','Filosofia Medieval (Agostinho, Tomás)','Revolução Científica','Filosofia Moderna: Descartes e Hume','Iluminismo: Rousseau, Locke, Voltaire','Fenomenologia: Husserl','Nietzsche: crítica à moral','Hannah Arendt: totalitarismo e política','Habermas: ética discursiva','Beauvoir: existencialismo e feminismo'],
        'Aprofundamento': ['Fenomenologia avançada','Estética e filosofia da arte','Ética e moral contemporânea','Heidegger: ser e tempo']
      }
    },
    'Português: Literatura': {
      icon: '📚', color: '#EC4899',
      anos: {
        '1º Ano': ['Crítica literária e teoria','Elementos estruturais da narrativa','Linguagem literária: poesia lírica','O papel da tradição','Trovadorismo e poesia medieval'],
        '2º Ano': ['Classicismo (Camões)','Barroco (Vieira, Gregório de Matos)','Neoclassicismo e Arcadismo','Romantismo','Realismo e Naturalismo','Linguagem visual: pintura e escultura','Intertextualidade','Literatura e sociedade (gênero, raça)','Parnasianismo'],
        '3º Ano': ['Pré-modernismo (Euclides, Lima Barreto)','Simbolismo','Modernismo: poesia da 1ª fase','Modernismo: prosa da 1ª fase','Modernismo: prosa regionalista','Vanguardas europeias','Prosa pós-45 no Brasil','Poesia contemporânea','Poesia e canção pós-45'],
        'Aprofundamento': ['Obras obrigatórias da FUVEST']
      }
    },
    'Português: Língua e Produção': {
      icon: '✍️', color: '#14B8A6',
      anos: {
        '1º Ano': ['Relações entre oralidade e escrita','Meios de sentido e conotação','Fatores condicionantes dos enunciados','Processos de formação de palavras','Figuras de linguagem','Funções da linguagem','Acentuação gráfica'],
        '2º Ano': ['Pronomes (indefinidos, interrogativos, relativos)','Substantivos e adjetivos','Advérbios','Conjugações verbais','Tempos verbais','Regência verbal e nominal','Formas nominais dos verbos','Estratégias argumentativas','Estrutura da dissertação'],
        '3º Ano': ['Crase (acento grave)','Função sintática do verbo "ser"','Objeto direto e indireto','Termos ligados ao nome','Oração subordinada adjetiva','Oração subordinada adverbial','Gêneros do Discurso','Formação de Palavras (avançado)'],
        'Aprofundamento': ['Funções da Linguagem (avançado)','Gêneros literários e discursivos','Redação ENEM: competências']
      }
    },
    'Inglês': {
      icon: '🇬🇧', color: '#6366F1',
      anos: {
        'Leitura e Compreensão': ['Ideia principal e implícita','Propósito e função de parágrafo','Reconhecimento de gênero textual','Contexto e inferência'],
        'Texto Multimodal': ['Charge, cartoon e tirinha','Cartaz e propaganda','Gráfico e tabela','Infográfico'],
        'Vocabulário e Gramática': ['Vocabulário em contexto','Falsos cognatos','Phrasal verbs','Expressões idiomáticas','Referência pronominal','Conectivos discursivos (though, while, however)','Passive voice']
      }
    }
  };

  const VESTIBULARES = [
    { nome: 'FUVEST', icon: '🎓', cor: '#4F46E5', descricao: 'Universidade de São Paulo (USP)', formato: '2 fases: 1ª Múltipla escolha + 2ª Dissertativa', datas: 'Jan/Fev (edital a partir de jul/ago)', peso: '60% FUVEST + 40% ENEM (algumas carreiras)' },
    { nome: 'UNICAMP', icon: '🔬', cor: '#10B981', descricao: 'Universidade Estadual de Campinas', formato: '2 fases: 1ª Múltipla escolha + 2ª Dissertativa', datas: 'Jan/Fev (edital a partir de jul/ago)', peso: 'Própria (SAS + questões UNICAMP)' },
    { nome: 'ENEM', icon: '📋', cor: '#F59E0B', descricao: 'Exame Nacional do Ensino Médio', formato: 'Dia 1: Linguagens, Ciências Humanas + Redação\nDia 2: Matemática, Ciências da Natureza', datas: 'Nov 2026: Dia 1 = 01/11 · Dia 2 = 08/11', peso: 'Base para SISU (universidades federais)' },
    { nome: 'UNIFESP', icon: '🏥', cor: '#06B6D4', descricao: 'Universidade Federal de São Paulo', formato: '2 fases: 1ª Testes + 2ª Dissertativa', datas: 'Jan/Fev', peso: '1ª fase (T) + 2ª fase (D) + Dissertação' },
    { nome: 'Einstein', icon: '⚕️', cor: '#8B5CF6', descricao: 'Faculdade Israelita Albert Einstein', formato: 'Baseado no ENEM', datas: 'Jan/Fev (usa nota ENEM)', peso: 'ENEM como base de seleção' },
    { nome: 'Santa Casa', icon: '🏨', cor: '#EC4899', descricao: 'Faculdade de Ciências Médicas (FCMSCSP)', formato: '2 fases + prova específica', datas: 'Jan/Fev', peso: '1ª e 2ª fase presenciais' },
    { nome: 'FGV', icon: '📊', cor: '#F97316', descricao: 'Fundação Getulio Vargas', formato: 'Múltipla escolha + Dissertativa', datas: 'Jan/Fev', peso: 'Própria (relevância: FUVEST e ENEM)' },
    { nome: 'VUNESP', icon: '🏫', cor: '#EF4444', descricao: 'UNESP, ABC e outras estaduais', formato: 'Múltipla escolha + Dissertativa', datas: 'Jan/Fev', peso: 'Depende da instituição (60–65%)' }
  ];

  // Vestibular classification per subject+year section
  // FUVEST: A = Nas duas fases · B = Apenas 2ª fase · C = Apenas 1ª fase
  // VUNESP: D = Frequente · E = Muito frequente
  // FGV:    F = Frequente · G = Muito frequente
  // ENEM:   H = Frequente · I = Muito frequente
  // null = não cobre / não se aplica
  // Section-level defaults (fallback when no topic-level override exists)
  // FUVEST: A = Nas duas fases · B = Apenas 2ª fase · C = Apenas 1ª fase
  // VUNESP: D = Frequente · E = Muito frequente
  // FGV:    F = Frequente · G = Muito frequente
  // ENEM:   H = Frequente · I = Muito frequente
  // null = não cobre / não se aplica
  const RELEVANCE = {
    'Biologia': {
      '1º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'D', FGV: null, ENEM: 'H' },
    },
    'Física': {
      '1º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
    },
    'Química': {
      '1º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'D', FGV: null, ENEM: 'H' },
    },
    'Matemática': {
      '1º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'D', FGV: 'G', ENEM: 'H' },
    },
    'História do Brasil': {
      '1º Ano':                   { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
      '2º Ano':                   { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '3º Ano':                   { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Temas Interdisciplinares': { FUVEST: 'B', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
    },
    'História Geral': {
      '1º Ano':          { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
    },
    'Geografia': {
      '1º Ano':          { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'D', FGV: null, ENEM: 'H' },
    },
    'Filosofia': {
      '2º Ano':          { FUVEST: 'A', VUNESP: null, FGV: 'G', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: null, FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: null, FGV: 'F', ENEM: 'H' },
    },
    'Português: Literatura': {
      '1º Ano':          { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'B', VUNESP: 'E', FGV: 'G', ENEM: 'H' },
    },
    'Português: Língua e Produção': {
      '1º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '2º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      '3º Ano':          { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Aprofundamento':  { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
    },
    'Inglês': {
      'Leitura e Compreensão':   { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      'Texto Multimodal':        { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
      'Vocabulário e Gramática': { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
    },
  };

  // Topic-level overrides — only entries that DIFFER from the section default above.
  // Structure: RELEVANCE_TOPICS[disciplina][ano][topico] = { FUVEST, VUNESP, FGV, ENEM }
  const RELEVANCE_TOPICS = {
    'Biologia': {
      '1º Ano': {
        'Biomas':              { FUVEST: 'C', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
        'Sucessão ecológica':  { FUVEST: 'C', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
      },
      'Aprofundamento': {
        'Vitaminas':                { FUVEST: null, VUNESP: null, FGV: null, ENEM: null },
        'Histologia animal':        { FUVEST: 'B',  VUNESP: 'D',  FGV: 'F',  ENEM: 'I'  },
        'Genética de populações':   { FUVEST: 'C',  VUNESP: null, FGV: 'F',  ENEM: 'I'  },
        'Histologia vegetal':       { FUVEST: null, VUNESP: 'D',  FGV: null, ENEM: null },
        'Hormônios vegetais':       { FUVEST: null, VUNESP: 'D',  FGV: null, ENEM: 'H'  },
        'Fotossíntese (avançado)':  { FUVEST: 'A',  VUNESP: 'D',  FGV: null, ENEM: 'H'  },
      },
    },
    'Física': {
      '1º Ano': {
        'Propagação de calor':  { FUVEST: 'C', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
        'Termometria':          { FUVEST: 'C', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
        'Calorimetria':         { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
        'Dilatação dos corpos': { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
        'Reflexão de luz (óptica)': { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
        'Refração de luz':      { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
        'Ótica da visão':       { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
        'Espelhos e lentes':    { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      },
    },
    'Química': {
      '1º Ano': {
        'Propriedades da matéria':           { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
        'Densidade':                          { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
        'Separação de misturas':              { FUVEST: 'C', VUNESP: 'E', FGV: 'F', ENEM: 'I' },
        'Temperatura de fusão e ebulição':    { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'H' },
        'Radioatividade':                     { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
      },
    },
    'Matemática': {
      '1º Ano': {
        'Porcentagem':        { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
        'Juros simples e compostos': { FUVEST: 'C', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
      },
      'Aprofundamento': {
        'Números complexos: forma algébrica': { FUVEST: 'B', VUNESP: null, FGV: null, ENEM: null },
      },
    },
    'História do Brasil': {
      '2º Ano': {
        'Brasil no século XX':               { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
        'Abolição e pós-escravidão':         { FUVEST: 'A', VUNESP: 'E', FGV: 'G', ENEM: 'I' },
        'Revoltas da Primeira República':    { FUVEST: 'C', VUNESP: 'D', FGV: 'F', ENEM: 'I' },
      },
    },
    'Português: Literatura': {
      '3º Ano': {
        'Obras obrigatórias da FUVEST': { FUVEST: 'B', VUNESP: null, FGV: null, ENEM: null },
      },
    },
  };

  // Persisted topic-level overrides (user-editable via Editar Mapa)
  const RELEVANCE_KEY = 'vestibular_bia_relevance_v1';
  let _liveRelevance = (() => {
    try {
      const s = localStorage.getItem(RELEVANCE_KEY);
      if (s) return JSON.parse(s);
    } catch(e) {}
    return JSON.parse(JSON.stringify(RELEVANCE_TOPICS)); // deep copy of hardcoded default
  })();
  function _persistRelevance() { localStorage.setItem(RELEVANCE_KEY, JSON.stringify(_liveRelevance)); }

  // Returns topic-level relevance if an override exists, otherwise falls back to section default.
  function getTopicRelevance(disc, ano, topic) {
    const override = _liveRelevance[disc]?.[ano]?.[topic];
    if (override !== undefined) return override;
    return RELEVANCE[disc]?.[ano] || {};
  }

  function setTopicRelevance(disc, ano, topic, rel) {
    if (!_liveRelevance[disc])      _liveRelevance[disc] = {};
    if (!_liveRelevance[disc][ano]) _liveRelevance[disc][ano] = {};
    _liveRelevance[disc][ano][topic] = rel;
    _persistRelevance();
  }

  // Rename also migrates relevance override if one exists
  function _migrateRelevance(disc, ano, oldName, newName) {
    const existing = _liveRelevance[disc]?.[ano]?.[oldName];
    if (existing !== undefined) {
      if (!_liveRelevance[disc])      _liveRelevance[disc] = {};
      if (!_liveRelevance[disc][ano]) _liveRelevance[disc][ano] = {};
      _liveRelevance[disc][ano][newName] = existing;
      delete _liveRelevance[disc][ano][oldName];
      _persistRelevance();
    }
  }

  function getRelevance(disc, ano) {
    return RELEVANCE[disc]?.[ano] || {};
  }

  // ── Persisted cartografia data (allows adding / editing / deleting topics) ──
  const DATA_KEY = 'vestibular_bia_carto_data_v1';
  let _liveData = (() => {
    try {
      const s = localStorage.getItem(DATA_KEY);
      if (s) return JSON.parse(s);
    } catch(e) {}
    return JSON.parse(JSON.stringify(DATA)); // deep copy of hardcoded default
  })();
  function _persistData() { localStorage.setItem(DATA_KEY, JSON.stringify(_liveData)); }

  function addTopic(disc, ano, name, position) {
    name = name.trim();
    if (!name || !_liveData[disc]?.anos[ano]) return false;
    if (_liveData[disc].anos[ano].includes(name)) return false;
    const topics = _liveData[disc].anos[ano];
    if (position !== undefined && position !== null && position >= 0 && position <= topics.length) {
      topics.splice(position, 0, name);
    } else {
      topics.push(name);
    }
    _persistData();
    return true;
  }

  function moveTopic(disc, ano, fromIdx, toIdx) {
    const topics = _liveData[disc]?.anos[ano];
    if (!topics) return false;
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= topics.length || toIdx >= topics.length || fromIdx === toIdx) return false;
    const [item] = topics.splice(fromIdx, 1);
    topics.splice(toIdx, 0, item);
    _persistData();
    return true;
  }

  function deleteTopic(disc, ano, name) {
    const topics = _liveData[disc]?.anos[ano];
    if (!topics) return false;
    const idx = topics.indexOf(name);
    if (idx === -1) return false;
    topics.splice(idx, 1);
    const prog = _loadProgress();
    delete prog[_key(disc, ano, name)];
    _saveProgress(prog);
    _persistData();
    return true;
  }

  function renameTopic(disc, ano, oldName, newName) {
    newName = newName.trim();
    if (!newName || oldName === newName) return false;
    const topics = _liveData[disc]?.anos[ano];
    if (!topics) return false;
    const idx = topics.indexOf(oldName);
    if (idx === -1 || topics.includes(newName)) return false;
    topics[idx] = newName;
    const prog = _loadProgress();
    const ok = _key(disc, ano, oldName), nk = _key(disc, ano, newName);
    if (prog[ok]) { prog[nk] = prog[ok]; delete prog[ok]; }
    _saveProgress(prog);
    _persistData();
    _migrateRelevance(disc, ano, oldName, newName);
    return true;
  }

  // Topic progress tracking
  function _loadProgress() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }
  function _saveProgress(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  function _key(disc, ano, topic) { return `${disc}||${ano}||${topic}`; }

  function getStatus(disc, ano, topic) { return _loadProgress()[_key(disc, ano, topic)] || 'pending'; }

  function setStatus(disc, ano, topic, status) {
    const d = _loadProgress(); d[_key(disc, ano, topic)] = status; _saveProgress(d);
  }

  function toggleStatus(disc, ano, topic) {
    const cur = getStatus(disc, ano, topic);
    const next = cur === 'pending' ? 'studying' : cur === 'studying' ? 'done' : 'pending';
    setStatus(disc, ano, topic, next);
    return next;
  }

  function getSubjectProgress(disc) {
    const d = _liveData[disc]; if (!d) return { total: 0, done: 0, studying: 0 };
    let total = 0, done = 0, studying = 0;
    Object.entries(d.anos).forEach(([ano, topics]) => topics.forEach(t => {
      total++;
      const s = getStatus(disc, ano, t);
      if (s === 'done') done++; else if (s === 'studying') studying++;
    }));
    return { total, done, studying };
  }

  function getAll()          { return _liveData; }
  function getVestibulares() { return VESTIBULARES; }

  return { getAll, getVestibulares, getStatus, setStatus, toggleStatus, getSubjectProgress, getRelevance, getTopicRelevance, setTopicRelevance, addTopic, deleteTopic, renameTopic, moveTopic };
})();
