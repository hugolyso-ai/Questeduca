# Dados reais das escolas portuguesas extraídos dos ficheiros Excel oficiais
# Organizados por distrito para facilitar a seleção no registo

PORTUGUESE_DISTRICTS = [
    {"district_id": "1", "name": "Viana do Castelo", "color": "#4ade80"},
    {"district_id": "2", "name": "Braga", "color": "#a78bfa"},
    {"district_id": "3", "name": "Vila Real", "color": "#f472b6"},
    {"district_id": "4", "name": "Bragança", "color": "#ef4444"},
    {"district_id": "5", "name": "Porto", "color": "#fbbf24"},
    {"district_id": "6", "name": "Aveiro", "color": "#22d3ee"},
    {"district_id": "7", "name": "Viseu", "color": "#f9a8d4"},
    {"district_id": "8", "name": "Guarda", "color": "#fb923c"},
    {"district_id": "9", "name": "Coimbra", "color": "#4ade80"},
    {"district_id": "10", "name": "Castelo Branco", "color": "#60a5fa"},
    {"district_id": "11", "name": "Leiria", "color": "#ef4444"},
    {"district_id": "12", "name": "Santarém", "color": "#a16207"},
    {"district_id": "13", "name": "Lisboa", "color": "#fbbf24"},
    {"district_id": "14", "name": "Setúbal", "color": "#fb923c"},
    {"district_id": "15", "name": "Portalegre", "color": "#a78bfa"},
    {"district_id": "16", "name": "Évora", "color": "#86efac"},
    {"district_id": "17", "name": "Beja", "color": "#f9a8d4"},
    {"district_id": "18", "name": "Faro", "color": "#fbbf24"},
    {"district_id": "19", "name": "Açores", "color": "#fb923c"},
    {"district_id": "20", "name": "Madeira", "color": "#ef4444"},
]

# Escolas reais portuguesas - dados extraídos dos ficheiros Excel oficiais
# Inclui escolas do 1º, 2º e 3º ciclos do ensino básico
PORTUGUESE_SCHOOLS = [
    # Lisboa - 1º Ciclo
    {"school_id": "lis001", "name": "Externato do Parque", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis002", "name": "Externato de S. José", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis003", "name": "Escola Raiz", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2"]},
    {"school_id": "lis004", "name": "Colégio Santo André", "district": "Lisboa", "municipality": "Venda do Pinheiro", "cycles": ["1", "2"]},
    {"school_id": "lis005", "name": "Colégio Arte & Manha", "district": "Lisboa", "municipality": "Mafra", "cycles": ["1"]},
    {"school_id": "lis006", "name": "Colégio Monte Flor", "district": "Lisboa", "municipality": "Carnaxide", "cycles": ["1"]},
    {"school_id": "lis007", "name": "Externato Santa Catarina", "district": "Lisboa", "municipality": "Cruz Quebrada-Dafundo", "cycles": ["1"]},
    {"school_id": "lis008", "name": "Externato A Palmeirinha", "district": "Lisboa", "municipality": "Oeiras", "cycles": ["1"]},
    {"school_id": "lis009", "name": "Externato Padre António Vieira", "district": "Lisboa", "municipality": "Linda a Velha", "cycles": ["1", "2"]},
    {"school_id": "lis010", "name": "Externato Nova Oeiras", "district": "Lisboa", "municipality": "Oeiras", "cycles": ["1"]},
    {"school_id": "lis011", "name": "Colégio São Francisco de Assis", "district": "Lisboa", "municipality": "Porto Salvo", "cycles": ["1"]},
    {"school_id": "lis012", "name": "Colégio da Torre", "district": "Lisboa", "municipality": "Paço de Arcos", "cycles": ["1", "2"]},
    {"school_id": "lis013", "name": "Colégio da Fonte", "district": "Lisboa", "municipality": "Porto Salvo", "cycles": ["1"]},
    {"school_id": "lis014", "name": "Colégio Pedro Arrupe", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis015", "name": "Colégio Integrado Monte Maior", "district": "Lisboa", "municipality": "Loures", "cycles": ["1", "2"]},
    {"school_id": "lis016", "name": "Colégio Oriente", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2"]},
    {"school_id": "lis017", "name": "Colégio Bartolomeu Dias", "district": "Lisboa", "municipality": "Santa Iria de Azóia", "cycles": ["1", "2"]},
    {"school_id": "lis018", "name": "Colégio Militar", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis019", "name": "Colégio Manuel Bernardes", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis020", "name": "Colégio Luso-Suíço", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis021", "name": "Colégio do Sagrado Coração de Maria", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis022", "name": "Colégio do Bom Sucesso", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis023", "name": "Colégio de São João de Brito", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis024", "name": "Colégio de Santa Maria", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis025", "name": "Colégio São Tomás - Quinta das Conchas", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis026", "name": "Academia de Música de Santa Cecília", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2"]},
    {"school_id": "lis027", "name": "Colégio Valsassina", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis028", "name": "Colégio São Tomás - Sete Rios", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis029", "name": "Salesianos de Lisboa - Colégio Oficinas de São José", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis030", "name": "PaRK International School - Restelo", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis031", "name": "Colégio Moderno", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis032", "name": "Colégio Mira Rio", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis033", "name": "Externato Marista de Lisboa", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis034", "name": "Real Colégio de Portugal", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis035", "name": "Escola Básica Raul Lino", "district": "Lisboa", "municipality": "Cascais", "cycles": ["1"]},
    {"school_id": "lis036", "name": "Escola Básica de Cascais", "district": "Lisboa", "municipality": "Cascais", "cycles": ["1", "2"]},
    {"school_id": "lis037", "name": "Escola Básica Ibn Mucana", "district": "Lisboa", "municipality": "Alcabideche", "cycles": ["2", "3"]},
    {"school_id": "lis038", "name": "Escola Básica de São João do Estoril", "district": "Lisboa", "municipality": "Estoril", "cycles": ["1", "2"]},
    {"school_id": "lis039", "name": "Escola Básica José Cardoso Pires", "district": "Lisboa", "municipality": "Amadora", "cycles": ["2", "3"]},
    {"school_id": "lis040", "name": "Escola Básica de Alfornelos", "district": "Lisboa", "municipality": "Amadora", "cycles": ["2", "3"]},
    {"school_id": "lis041", "name": "Escola Básica Almeida Garrett", "district": "Lisboa", "municipality": "Amadora", "cycles": ["2", "3"]},
    {"school_id": "lis042", "name": "Escola Básica Padre Alberto Neto", "district": "Lisboa", "municipality": "Rio de Mouro", "cycles": ["2", "3"]},
    {"school_id": "lis043", "name": "Escola Básica Alto dos Moinhos", "district": "Lisboa", "municipality": "Sintra", "cycles": ["2", "3"]},
    {"school_id": "lis044", "name": "Escola Básica Rainha D. Leonor de Lencastre", "district": "Lisboa", "municipality": "São Marcos", "cycles": ["2", "3"]},
    {"school_id": "lis045", "name": "Escola Básica n.º 72 de Lisboa", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis046", "name": "Escola Básica Josefa de Óbidos", "district": "Lisboa", "municipality": "Lisboa", "cycles": ["2", "3"]},
    {"school_id": "lis047", "name": "Escola Básica do Carregado", "district": "Lisboa", "municipality": "Alenquer", "cycles": ["1", "2"]},
    {"school_id": "lis048", "name": "Escola Básica Pêro de Alenquer", "district": "Lisboa", "municipality": "Alenquer", "cycles": ["2", "3"]},
    {"school_id": "lis049", "name": "Escola Básica António Bento Franco", "district": "Lisboa", "municipality": "Ericeira", "cycles": ["2", "3"]},
    {"school_id": "lis050", "name": "Escola Básica do Bom Sucesso", "district": "Lisboa", "municipality": "Alverca do Ribatejo", "cycles": ["1", "2"]},
    
    # Porto - 1º, 2º e 3º Ciclos
    {"school_id": "por001", "name": "Escola Básica Clara de Resende", "district": "Porto", "municipality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por002", "name": "Escola Básica Rodrigues de Freitas", "district": "Porto", "municipality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por003", "name": "Escola Básica de Miragaia", "district": "Porto", "municipality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por004", "name": "Escola Básica Alexandre Herculano", "district": "Porto", "municipality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por005", "name": "Escola Básica Dr. Augusto César Pires de Lima", "district": "Porto", "municipality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por006", "name": "Escola Básica de Águas Santas", "district": "Porto", "municipality": "Maia", "cycles": ["2", "3"]},
    {"school_id": "por007", "name": "Escola Básica Anes de Cernache", "district": "Porto", "municipality": "Vila Nova de Gaia", "cycles": ["2", "3"]},
    {"school_id": "por008", "name": "Escola Básica Adriano Correia de Oliveira", "district": "Porto", "municipality": "Avintes", "cycles": ["2", "3"]},
    {"school_id": "por009", "name": "Escola Básica de Valongo", "district": "Porto", "municipality": "Valongo", "cycles": ["1"]},
    {"school_id": "por010", "name": "Escola Básica de Ermesinde", "district": "Porto", "municipality": "Ermesinde", "cycles": ["1"]},
    {"school_id": "por011", "name": "Escola Básica de Caxinas", "district": "Porto", "municipality": "Vila do Conde", "cycles": ["1"]},
    {"school_id": "por012", "name": "Escola Básica Júlio Saúl Dias", "district": "Porto", "municipality": "Vila do Conde", "cycles": ["1"]},
    {"school_id": "por013", "name": "Escola Básica de Azurara", "district": "Porto", "municipality": "Vila do Conde", "cycles": ["1"]},
    {"school_id": "por014", "name": "Escola Manuel António Pina", "district": "Porto", "municipality": "Vila Nova de Gaia", "cycles": ["1"]},
    {"school_id": "por015", "name": "Escola Básica Professor Doutor Marques dos Santos", "district": "Porto", "municipality": "Vila Nova de Gaia", "cycles": ["1"]},
    {"school_id": "por016", "name": "Escola Básica dos Carvalhos", "district": "Porto", "municipality": "Vila Nova de Gaia", "cycles": ["1"]},
    {"school_id": "por017", "name": "Escola Básica de Canelas", "district": "Porto", "municipality": "Vila Nova de Gaia", "cycles": ["1", "2", "3"]},
    {"school_id": "por018", "name": "Escola Básica de Penafiel", "district": "Porto", "municipality": "Penafiel", "cycles": ["1"]},
    {"school_id": "por019", "name": "Escola Básica de Paço de Sousa", "district": "Porto", "municipality": "Penafiel", "cycles": ["1"]},
    {"school_id": "por020", "name": "Colégio Alemão do Porto", "district": "Porto", "municipality": "Porto", "cycles": ["1", "2", "3"]},
    
    # Braga
    {"school_id": "brg001", "name": "Escola Básica Santos Simões", "district": "Braga", "municipality": "Guimarães", "cycles": ["2", "3"]},
    {"school_id": "brg002", "name": "Escola Básica de Abação", "district": "Braga", "municipality": "Guimarães", "cycles": ["2"]},
    {"school_id": "brg003", "name": "Escola Básica de Arões - Santa Cristina", "district": "Braga", "municipality": "Fafe", "cycles": ["2"]},
    {"school_id": "brg004", "name": "Escola Básica de Forjães", "district": "Braga", "municipality": "Esposende", "cycles": ["2"]},
    {"school_id": "brg005", "name": "Escola Básica António Rodrigues Sampaio", "district": "Braga", "municipality": "Esposende", "cycles": ["2", "3"]},
    {"school_id": "brg006", "name": "Colégio D. Diogo de Sousa", "district": "Braga", "municipality": "Braga", "cycles": ["1", "2", "3"]},
    {"school_id": "brg007", "name": "Externato Infante D. Henrique", "district": "Braga", "municipality": "Braga", "cycles": ["1", "2", "3"]},
    {"school_id": "brg008", "name": "Colégio Teresiano", "district": "Braga", "municipality": "Braga", "cycles": ["1", "2", "3"]},
    
    # Aveiro
    {"school_id": "ave001", "name": "Escola Básica de Aradas", "district": "Aveiro", "municipality": "Aveiro", "cycles": ["2"]},
    {"school_id": "ave002", "name": "Escola Básica Rio Novo do Príncipe", "district": "Aveiro", "municipality": "Aveiro", "cycles": ["2"]},
    {"school_id": "ave003", "name": "Escola Básica Castro Matoso", "district": "Aveiro", "municipality": "Oliveirinha", "cycles": ["2"]},
    {"school_id": "ave004", "name": "Escola Básica de Eixo", "district": "Aveiro", "municipality": "Eixo", "cycles": ["2"]},
    {"school_id": "ave005", "name": "Escola Básica João Afonso", "district": "Aveiro", "municipality": "Aveiro", "cycles": ["2", "3"]},
    {"school_id": "ave006", "name": "Escola Básica Dr. Jaime Magalhães Lima", "district": "Aveiro", "municipality": "Aveiro", "cycles": ["2", "3"]},
    {"school_id": "ave007", "name": "Escola Básica de São João de Loure", "district": "Aveiro", "municipality": "Albergaria-a-Velha", "cycles": ["2"]},
    {"school_id": "ave008", "name": "Escola Básica de Albergaria-a-Velha", "district": "Aveiro", "municipality": "Albergaria-a-Velha", "cycles": ["2"]},
    {"school_id": "ave009", "name": "Escola Básica de Branca", "district": "Aveiro", "municipality": "Albergaria-a-Velha", "cycles": ["2"]},
    {"school_id": "ave010", "name": "Escola Básica Fernando Caldeira", "district": "Aveiro", "municipality": "Águeda", "cycles": ["2", "3"]},
    {"school_id": "ave011", "name": "Escola Básica de Valongo do Vouga", "district": "Aveiro", "municipality": "Águeda", "cycles": ["2"]},
    {"school_id": "ave012", "name": "Escola Básica de Anadia", "district": "Aveiro", "municipality": "Anadia", "cycles": ["2", "3"]},
    {"school_id": "ave013", "name": "Escola Básica Oliveira Júnior", "district": "Aveiro", "municipality": "São João da Madeira", "cycles": ["2", "3"]},
    {"school_id": "ave014", "name": "Escola Básica Dr. Serafim Leite", "district": "Aveiro", "municipality": "São João da Madeira", "cycles": ["2", "3"]},
    {"school_id": "ave015", "name": "Escola Básica Ferreira de Castro", "district": "Aveiro", "municipality": "Oliveira de Azeméis", "cycles": ["2", "3"]},
    {"school_id": "ave016", "name": "Escola Básica Professor Doutor Egas Moniz", "district": "Aveiro", "municipality": "Estarreja", "cycles": ["2"]},
    {"school_id": "ave017", "name": "Escola Básica Padre Donaciano Abreu Freire", "district": "Aveiro", "municipality": "Estarreja", "cycles": ["2"]},
    {"school_id": "ave018", "name": "Escola Básica de Pardilhó", "district": "Aveiro", "municipality": "Estarreja", "cycles": ["2"]},
    {"school_id": "ave019", "name": "Escola Básica José Ferreira Pinto Basto", "district": "Aveiro", "municipality": "Ílhavo", "cycles": ["2"]},
    {"school_id": "ave020", "name": "Escola Básica de Gafanha da Encarnação", "district": "Aveiro", "municipality": "Ílhavo", "cycles": ["2"]},
    
    # Coimbra
    {"school_id": "coi001", "name": "Escola Básica de Ceira", "district": "Coimbra", "municipality": "Coimbra", "cycles": ["2"]},
    {"school_id": "coi002", "name": "Escola Básica Dr.ª Maria Alice Gouveia", "district": "Coimbra", "municipality": "Coimbra", "cycles": ["2", "3"]},
    {"school_id": "coi003", "name": "Escola Básica Rainha Santa Isabel", "district": "Coimbra", "municipality": "Coimbra", "cycles": ["2"]},
    {"school_id": "coi004", "name": "Escola Básica Eugénio de Castro", "district": "Coimbra", "municipality": "Coimbra", "cycles": ["2", "3"]},
    {"school_id": "coi005", "name": "Escola Básica Martim de Freitas", "district": "Coimbra", "municipality": "Coimbra", "cycles": ["2", "3"]},
    {"school_id": "coi006", "name": "Escola Básica de Condeixa-a-Nova", "district": "Coimbra", "municipality": "Condeixa-a-Nova", "cycles": ["2"]},
    {"school_id": "coi007", "name": "Escola Básica de Góis", "district": "Coimbra", "municipality": "Góis", "cycles": ["2"]},
    {"school_id": "coi008", "name": "Escola Básica de Mira", "district": "Coimbra", "municipality": "Mira", "cycles": ["2"]},
    {"school_id": "coi009", "name": "Escola Básica Infante D. Pedro", "district": "Coimbra", "municipality": "Penela", "cycles": ["2"]},
    {"school_id": "coi010", "name": "Colégio da Rainha Santa Isabel", "district": "Coimbra", "municipality": "Coimbra", "cycles": ["1", "2", "3"]},
    
    # Setúbal
    {"school_id": "set001", "name": "Escola Básica Maria do Carmo Serrote", "district": "Setúbal", "municipality": "Sesimbra", "cycles": ["1", "2"]},
    {"school_id": "set002", "name": "Escola Básica de Pegões", "district": "Setúbal", "municipality": "Montijo", "cycles": ["1", "2"]},
    {"school_id": "set003", "name": "Escola Básica D. Luís de Mendonça Furtado", "district": "Setúbal", "municipality": "Barreiro", "cycles": ["1", "2"]},
    {"school_id": "set004", "name": "Escola Básica Padre Abílio Mendes", "district": "Setúbal", "municipality": "Barreiro", "cycles": ["2", "3"]},
    {"school_id": "set005", "name": "Escola Básica da Trafaria", "district": "Setúbal", "municipality": "Almada", "cycles": ["1", "2"]},
    {"school_id": "set006", "name": "Escola Básica Elias Garcia", "district": "Setúbal", "municipality": "Almada", "cycles": ["1", "2"]},
    {"school_id": "set007", "name": "Escola Básica de Monte da Caparica", "district": "Setúbal", "municipality": "Almada", "cycles": ["1", "2"]},
    {"school_id": "set008", "name": "Escola Básica D. Nuno Álvares Pereira", "district": "Setúbal", "municipality": "Seixal", "cycles": ["2"]},
    {"school_id": "set009", "name": "Escola Básica de Miratejo", "district": "Setúbal", "municipality": "Seixal", "cycles": ["2"]},
    {"school_id": "set010", "name": "Escola Básica José Afonso", "district": "Setúbal", "municipality": "Seixal", "cycles": ["2"]},
    {"school_id": "set011", "name": "Escola Básica n.º 6 de Setúbal", "district": "Setúbal", "municipality": "Setúbal", "cycles": ["1"]},
    {"school_id": "set012", "name": "Escola Básica Luísa Todi", "district": "Setúbal", "municipality": "Setúbal", "cycles": ["1", "2", "3"]},
    {"school_id": "set013", "name": "Escola Básica da Moita", "district": "Setúbal", "municipality": "Moita", "cycles": ["1", "2"]},
    
    # Santarém
    {"school_id": "san001", "name": "Escola Básica José Relvas", "district": "Santarém", "municipality": "Alpiarça", "cycles": ["2", "3"]},
    {"school_id": "san002", "name": "Escola Básica Mem Ramires", "district": "Santarém", "municipality": "Santarém", "cycles": ["2"]},
    {"school_id": "san003", "name": "Escola Básica de Salvaterra de Magos", "district": "Santarém", "municipality": "Salvaterra de Magos", "cycles": ["1", "2", "3"]},
    {"school_id": "san004", "name": "Escola Básica de Caxarias", "district": "Santarém", "municipality": "Ourém", "cycles": ["1", "2"]},
    {"school_id": "san005", "name": "Escola Básica 4.º Conde de Ourém", "district": "Santarém", "municipality": "Ourém", "cycles": ["2", "3"]},
    {"school_id": "san006", "name": "Escola Básica Dr.ª Judite Andrade", "district": "Santarém", "municipality": "Sardoal", "cycles": ["1", "2", "3"]},
    {"school_id": "san007", "name": "Escola Básica Luís de Camões", "district": "Santarém", "municipality": "Constância", "cycles": ["2", "3"]},
    {"school_id": "san008", "name": "Escola Básica D. Sancho I", "district": "Santarém", "municipality": "Cartaxo", "cycles": ["2"]},
    {"school_id": "san009", "name": "Escola Básica D. Maria II", "district": "Santarém", "municipality": "Vila Nova da Barquinha", "cycles": ["2", "3"]},
    {"school_id": "san010", "name": "Escola Básica Dr. Solano de Abreu", "district": "Santarém", "municipality": "Abrantes", "cycles": ["2", "3"]},
    {"school_id": "san011", "name": "Escola Básica D. Miguel de Almeida", "district": "Santarém", "municipality": "Abrantes", "cycles": ["2", "3"]},
    {"school_id": "san012", "name": "Escola Básica de Porto Alto", "district": "Santarém", "municipality": "Benavente", "cycles": ["2"]},
    {"school_id": "san013", "name": "Escola Básica Duarte Lopes", "district": "Santarém", "municipality": "Benavente", "cycles": ["2", "3"]},
    {"school_id": "san014", "name": "Escola Básica Mestre Martins Correia", "district": "Santarém", "municipality": "Golegã", "cycles": ["2", "3"]},
    {"school_id": "san015", "name": "Escola Básica da Chamusca", "district": "Santarém", "municipality": "Chamusca", "cycles": ["2", "3"]},
    
    # Leiria
    {"school_id": "lei001", "name": "Escola Básica de Atouguia da Baleia", "district": "Leiria", "municipality": "Peniche", "cycles": ["1", "2"]},
    {"school_id": "lei002", "name": "Escola Básica da Batalha", "district": "Leiria", "municipality": "Batalha", "cycles": ["2", "3"]},
    {"school_id": "lei003", "name": "Escola Básica Dr. Correia Alexandre", "district": "Leiria", "municipality": "Leiria", "cycles": ["2"]},
    {"school_id": "lei004", "name": "Escola Básica de Santa Catarina da Serra", "district": "Leiria", "municipality": "Leiria", "cycles": ["2"]},
    {"school_id": "lei005", "name": "Escola Básica de Colmeias", "district": "Leiria", "municipality": "Leiria", "cycles": ["2"]},
    {"school_id": "lei006", "name": "Escola Básica Henrique Sommer", "district": "Leiria", "municipality": "Leiria", "cycles": ["2", "3"]},
    {"school_id": "lei007", "name": "Escola Básica n.º 2 de Marrazes", "district": "Leiria", "municipality": "Leiria", "cycles": ["2"]},
    {"school_id": "lei008", "name": "Escola Básica Padre Franklin", "district": "Leiria", "municipality": "Marinha Grande", "cycles": ["2"]},
    {"school_id": "lei009", "name": "Escola Básica Gualdim Pais", "district": "Leiria", "municipality": "Pombal", "cycles": ["2", "3"]},
    {"school_id": "lei010", "name": "Escola Básica da Benedita", "district": "Leiria", "municipality": "Alcobaça", "cycles": ["1", "2"]},
    {"school_id": "lei011", "name": "Escola Básica de Turquel", "district": "Leiria", "municipality": "Alcobaça", "cycles": ["1"]},
    {"school_id": "lei012", "name": "Escola Básica de Santa Catarina", "district": "Leiria", "municipality": "Caldas da Rainha", "cycles": ["1", "2"]},
    {"school_id": "lei013", "name": "Escola Básica Amadeu Gaudêncio", "district": "Leiria", "municipality": "Nazaré", "cycles": ["2", "3"]},
    {"school_id": "lei014", "name": "Escola Básica de Óbidos", "district": "Leiria", "municipality": "Óbidos", "cycles": ["1"]},
    {"school_id": "lei015", "name": "Escola Básica do Bombarral", "district": "Leiria", "municipality": "Bombarral", "cycles": ["1"]},
    
    # Castelo Branco
    {"school_id": "cas001", "name": "Escola Básica Professor Doutor António Sena Faria de Vasconcelos", "district": "Castelo Branco", "municipality": "Castelo Branco", "cycles": ["1", "2"]},
    {"school_id": "cas002", "name": "Escola Básica Cidade de Castelo Branco", "district": "Castelo Branco", "municipality": "Castelo Branco", "cycles": ["1", "2"]},
    {"school_id": "cas003", "name": "Escola Básica n.º 2 de Paúl", "district": "Castelo Branco", "municipality": "Covilhã", "cycles": ["2"]},
    {"school_id": "cas004", "name": "Escola Básica de Tortosendo", "district": "Castelo Branco", "municipality": "Covilhã", "cycles": ["1", "2"]},
    {"school_id": "cas005", "name": "Escola Básica Afonso de Paiva", "district": "Castelo Branco", "municipality": "Castelo Branco", "cycles": ["2", "3"]},
    {"school_id": "cas006", "name": "Escola Básica João Roiz de Castelo Branco", "district": "Castelo Branco", "municipality": "Castelo Branco", "cycles": ["2", "3"]},
    {"school_id": "cas007", "name": "Escola Básica Pêro da Covilhã", "district": "Castelo Branco", "municipality": "Covilhã", "cycles": ["2", "3"]},
    {"school_id": "cas008", "name": "Escola Básica Serra da Gardunha", "district": "Castelo Branco", "municipality": "Fundão", "cycles": ["2"]},
    {"school_id": "cas009", "name": "Escola Básica João Franco", "district": "Castelo Branco", "municipality": "Fundão", "cycles": ["2", "3"]},
    {"school_id": "cas010", "name": "Escola Básica Padre António Lourenço Farinha", "district": "Castelo Branco", "municipality": "Sertã", "cycles": ["2"]},
    
    # Guarda
    {"school_id": "gua001", "name": "Escola Básica da Sé", "district": "Guarda", "municipality": "Guarda", "cycles": ["2", "3"]},
    {"school_id": "gua002", "name": "Escola Básica Carolina Beatriz Ângelo", "district": "Guarda", "municipality": "Guarda", "cycles": ["2", "3"]},
    {"school_id": "gua003", "name": "Centro Educativo do Mondego", "district": "Guarda", "municipality": "Guarda", "cycles": ["1"]},
    {"school_id": "gua004", "name": "Escola Básica de Sequeira", "district": "Guarda", "municipality": "Guarda", "cycles": ["1"]},
    {"school_id": "gua005", "name": "Escola Básica de Manteigas", "district": "Guarda", "municipality": "Manteigas", "cycles": ["2", "3"]},
    {"school_id": "gua006", "name": "Escola Básica de Meda", "district": "Guarda", "municipality": "Meda", "cycles": ["2", "3"]},
    {"school_id": "gua007", "name": "Escola Básica de Figueira de Castelo Rodrigo", "district": "Guarda", "municipality": "Figueira de Castelo Rodrigo", "cycles": ["2"]},
    {"school_id": "gua008", "name": "Escola Básica Pedro Álvares Cabral", "district": "Guarda", "municipality": "Belmonte", "cycles": ["2", "3"]},
    
    # Viseu
    {"school_id": "vis001", "name": "Escola Básica n.º 3 de Mundão", "district": "Viseu", "municipality": "Viseu", "cycles": ["2"]},
    {"school_id": "vis002", "name": "Escola Básica Dr. Azeredo Perdigão", "district": "Viseu", "municipality": "Viseu", "cycles": ["2", "3"]},
    {"school_id": "vis003", "name": "Escola Básica D. Duarte", "district": "Viseu", "municipality": "Viseu", "cycles": ["2"]},
    {"school_id": "vis004", "name": "Escola Básica Mestre Arnaldo Malho", "district": "Viseu", "municipality": "Viseu", "cycles": ["1"]},
    {"school_id": "vis005", "name": "Escola Básica de Penalva do Castelo", "district": "Viseu", "municipality": "Penalva do Castelo", "cycles": ["2", "3"]},
    {"school_id": "vis006", "name": "Escola Básica de Ínsua", "district": "Viseu", "municipality": "Penalva do Castelo", "cycles": ["2"]},
    {"school_id": "vis007", "name": "Escola Básica de Campia", "district": "Viseu", "municipality": "Vouzela", "cycles": ["2"]},
    {"school_id": "vis008", "name": "Escola Básica de Vouzela", "district": "Viseu", "municipality": "Vouzela", "cycles": ["2"]},
    {"school_id": "vis009", "name": "Escola Básica de Santa Cruz da Trapa", "district": "Viseu", "municipality": "São Pedro do Sul", "cycles": ["2"]},
    {"school_id": "vis010", "name": "Escola Básica de Vila Nova de Paiva", "district": "Viseu", "municipality": "Vila Nova de Paiva", "cycles": ["1"]},
    {"school_id": "vis011", "name": "Escola Ana de Castro Osório", "district": "Viseu", "municipality": "Mangualde", "cycles": ["1"]},
    
    # Viana do Castelo
    {"school_id": "via001", "name": "Escola Básica Dr. Manuel da Costa Brandão", "district": "Viana do Castelo", "municipality": "Arcos de Valdevez", "cycles": ["1"]},
    {"school_id": "via002", "name": "Escola Básica Padre Himalaya", "district": "Viana do Castelo", "municipality": "Arcos de Valdevez", "cycles": ["1"]},
    {"school_id": "via003", "name": "Escola Prof. António Melo Machado", "district": "Viana do Castelo", "municipality": "Arcos de Valdevez", "cycles": ["1"]},
    {"school_id": "via004", "name": "Escola Básica do Vale do Âncora", "district": "Viana do Castelo", "municipality": "Caminha", "cycles": ["1", "2", "3"]},
    {"school_id": "via005", "name": "Escola Básica de Caminha", "district": "Viana do Castelo", "municipality": "Caminha", "cycles": ["1"]},
    {"school_id": "via006", "name": "Escola Básica de Melgaço", "district": "Viana do Castelo", "municipality": "Melgaço", "cycles": ["1"]},
    {"school_id": "via007", "name": "Escola Básica de Paredes de Coura", "district": "Viana do Castelo", "municipality": "Paredes de Coura", "cycles": ["1"]},
    {"school_id": "via008", "name": "Escola Básica Diogo Bernardes", "district": "Viana do Castelo", "municipality": "Ponte da Barca", "cycles": ["1"]},
    {"school_id": "via009", "name": "Escola Básica de Ponte de Lima", "district": "Viana do Castelo", "municipality": "Ponte de Lima", "cycles": ["1"]},
    {"school_id": "via010", "name": "Escola Básica de Freixo", "district": "Viana do Castelo", "municipality": "Ponte de Lima", "cycles": ["1", "2", "3"]},
    {"school_id": "via011", "name": "Escola Básica de Vila de Punhe", "district": "Viana do Castelo", "municipality": "Viana do Castelo", "cycles": ["1"]},
    {"school_id": "via012", "name": "Escola Educadora Zaida Garcez", "district": "Viana do Castelo", "municipality": "Viana do Castelo", "cycles": ["1"]},
    {"school_id": "via013", "name": "Escola Deu-la-Deu Martins", "district": "Viana do Castelo", "municipality": "Monção", "cycles": ["2"]},
    {"school_id": "via014", "name": "Escola Básica de Vale do Mouro", "district": "Viana do Castelo", "municipality": "Monção", "cycles": ["2"]},
    
    # Vila Real
    {"school_id": "vlr001", "name": "Escola Básica de Pinhão", "district": "Vila Real", "municipality": "Alijó", "cycles": ["1"]},
    {"school_id": "vlr002", "name": "Escola Básica de Vilar de Maçada", "district": "Vila Real", "municipality": "Alijó", "cycles": ["1"]},
    {"school_id": "vlr003", "name": "Escola Básica de Sanfins do Douro", "district": "Vila Real", "municipality": "Alijó", "cycles": ["1"]},
    {"school_id": "vlr004", "name": "Escola Básica de Alijó", "district": "Vila Real", "municipality": "Alijó", "cycles": ["1"]},
    {"school_id": "vlr005", "name": "Escola Gomes Monteiro", "district": "Vila Real", "municipality": "Boticas", "cycles": ["1"]},
    {"school_id": "vlr006", "name": "Escola Básica n.º 3 de Chaves", "district": "Vila Real", "municipality": "Chaves", "cycles": ["1"]},
    {"school_id": "vlr007", "name": "Escola Básica n.º 1 de Chaves", "district": "Vila Real", "municipality": "Chaves", "cycles": ["1"]},
    {"school_id": "vlr008", "name": "Escola Dr. Francisco Gonçalves Carneiro", "district": "Vila Real", "municipality": "Chaves", "cycles": ["1"]},
    {"school_id": "vlr009", "name": "Escola Básica de Vila Caiz", "district": "Vila Real", "municipality": "Amarante", "cycles": ["2"]},
    {"school_id": "vlr010", "name": "Escola Básica Amadeo de Souza Cardoso", "district": "Vila Real", "municipality": "Amarante", "cycles": ["2"]},
    {"school_id": "vlr011", "name": "Escola Básica da Sé", "district": "Vila Real", "municipality": "Lamego", "cycles": ["2", "3"]},
    
    # Bragança
    {"school_id": "bgc001", "name": "Escola Básica de Izeda", "district": "Bragança", "municipality": "Bragança", "cycles": ["2"]},
    {"school_id": "bgc002", "name": "Escola Básica Augusto Moreno", "district": "Bragança", "municipality": "Bragança", "cycles": ["2", "3"]},
    {"school_id": "bgc003", "name": "Escola Básica Miguel Torga", "district": "Bragança", "municipality": "Bragança", "cycles": ["2", "3"]},
    {"school_id": "bgc004", "name": "Escola Básica Luciano Cordeiro", "district": "Bragança", "municipality": "Mirandela", "cycles": ["2"]},
    {"school_id": "bgc005", "name": "Escola Básica de Torre de Dona Chama", "district": "Bragança", "municipality": "Mirandela", "cycles": ["2"]},
    
    # Faro
    {"school_id": "far001", "name": "Escola Básica Dr. António de Sousa Agostinho", "district": "Faro", "municipality": "Almancil", "cycles": ["2", "3"]},
    {"school_id": "far002", "name": "Escola Básica de Quarteira", "district": "Faro", "municipality": "Loulé", "cycles": ["2", "3"]},
    {"school_id": "far003", "name": "Escola Básica D. Afonso III", "district": "Faro", "municipality": "Faro", "cycles": ["2", "3"]},
    {"school_id": "far004", "name": "Escola Básica Poeta Emiliano da Costa", "district": "Faro", "municipality": "Albufeira", "cycles": ["2", "3"]},
    {"school_id": "far005", "name": "Escola Básica de Lagoa", "district": "Faro", "municipality": "Lagoa", "cycles": ["2", "3"]},
    {"school_id": "far006", "name": "Escola Básica Padre João Coelho Cabanita", "district": "Faro", "municipality": "Loulé", "cycles": ["2", "3"]},
    {"school_id": "far007", "name": "Escola Básica de Tavira", "district": "Faro", "municipality": "Tavira", "cycles": ["2", "3"]},
    {"school_id": "far008", "name": "Colégio Internacional de Vilamoura", "district": "Faro", "municipality": "Loulé", "cycles": ["1", "2", "3"]},
    
    # Évora
    {"school_id": "evo001", "name": "Escola Básica Conde de Vilalva", "district": "Évora", "municipality": "Évora", "cycles": ["2", "3"]},
    {"school_id": "evo002", "name": "Escola Básica André de Resende", "district": "Évora", "municipality": "Évora", "cycles": ["2", "3"]},
    {"school_id": "evo003", "name": "Escola Básica Santa Clara", "district": "Évora", "municipality": "Évora", "cycles": ["2", "3"]},
    {"school_id": "evo004", "name": "Escola Básica de Reguengos de Monsaraz", "district": "Évora", "municipality": "Reguengos de Monsaraz", "cycles": ["2", "3"]},
    {"school_id": "evo005", "name": "Escola Básica de Estremoz", "district": "Évora", "municipality": "Estremoz", "cycles": ["2", "3"]},
    
    # Beja
    {"school_id": "bej001", "name": "Escola Básica de Santiago Maior", "district": "Beja", "municipality": "Beja", "cycles": ["2", "3"]},
    {"school_id": "bej002", "name": "Escola Básica de Mértola", "district": "Beja", "municipality": "Mértola", "cycles": ["2", "3"]},
    {"school_id": "bej003", "name": "Escola Básica de Castro Verde", "district": "Beja", "municipality": "Castro Verde", "cycles": ["2", "3"]},
    {"school_id": "bej004", "name": "Escola Básica de Moura", "district": "Beja", "municipality": "Moura", "cycles": ["2", "3"]},
    {"school_id": "bej005", "name": "Escola Básica de Serpa", "district": "Beja", "municipality": "Serpa", "cycles": ["2", "3"]},
    
    # Portalegre
    {"school_id": "ptg001", "name": "Escola Básica José Régio", "district": "Portalegre", "municipality": "Portalegre", "cycles": ["2", "3"]},
    {"school_id": "ptg002", "name": "Escola Básica Cristóvão Falcão", "district": "Portalegre", "municipality": "Portalegre", "cycles": ["2", "3"]},
    {"school_id": "ptg003", "name": "Escola Básica de Nisa", "district": "Portalegre", "municipality": "Nisa", "cycles": ["2", "3"]},
    {"school_id": "ptg004", "name": "Escola Básica de Elvas", "district": "Portalegre", "municipality": "Elvas", "cycles": ["2", "3"]},
    {"school_id": "ptg005", "name": "Escola Básica de Campo Maior", "district": "Portalegre", "municipality": "Campo Maior", "cycles": ["2", "3"]},
    
    # Açores
    {"school_id": "aco001", "name": "Escola Básica Integrada de Lagoa", "district": "Açores", "municipality": "Lagoa", "cycles": ["1", "2", "3"]},
    {"school_id": "aco002", "name": "Escola Básica Integrada Roberto Ivens", "district": "Açores", "municipality": "Ponta Delgada", "cycles": ["1", "2", "3"]},
    {"school_id": "aco003", "name": "Escola Básica Integrada de Ribeira Grande", "district": "Açores", "municipality": "Ribeira Grande", "cycles": ["1", "2", "3"]},
    {"school_id": "aco004", "name": "Escola Básica Integrada de Angra do Heroísmo", "district": "Açores", "municipality": "Angra do Heroísmo", "cycles": ["1", "2", "3"]},
    {"school_id": "aco005", "name": "Escola Básica Integrada da Horta", "district": "Açores", "municipality": "Horta", "cycles": ["1", "2", "3"]},
    
    # Madeira
    {"school_id": "mad001", "name": "Escola Básica do 1º Ciclo com PE da Achada", "district": "Madeira", "municipality": "Funchal", "cycles": ["1"]},
    {"school_id": "mad002", "name": "Escola Básica dos 2º e 3º Ciclos Dr. Horácio Bento de Gouveia", "district": "Madeira", "municipality": "Funchal", "cycles": ["2", "3"]},
    {"school_id": "mad003", "name": "Escola Básica dos 2º e 3º Ciclos de Santo António", "district": "Madeira", "municipality": "Funchal", "cycles": ["2", "3"]},
    {"school_id": "mad004", "name": "Escola Básica Integrada de Câmara de Lobos", "district": "Madeira", "municipality": "Câmara de Lobos", "cycles": ["1", "2", "3"]},
    {"school_id": "mad005", "name": "Escola Básica dos 2º e 3º Ciclos de Machico", "district": "Madeira", "municipality": "Machico", "cycles": ["2", "3"]},
]

# Mapeamento de anos escolares para ciclos
SCHOOL_YEARS_BY_CYCLE = {
    "1": ["1", "2", "3", "4"],  # 1º Ciclo: 1º ao 4º ano
    "2": ["5", "6"],            # 2º Ciclo: 5º e 6º ano
    "3": ["7", "8", "9"],       # 3º Ciclo: 7º ao 9º ano
}

# Função auxiliar para obter o ciclo a partir do ano escolar
def get_cycle_from_year(year: str) -> str:
    for cycle, years in SCHOOL_YEARS_BY_CYCLE.items():
        if year in years:
            return cycle
    return "1"

# Função para filtrar escolas por ciclo
def get_schools_by_cycle(cycle: str):
    return [s for s in PORTUGUESE_SCHOOLS if cycle in s.get("cycles", [])]

# Função para filtrar escolas por distrito e ciclo
def get_schools_by_district_and_cycle(district: str, cycle: str):
    return [s for s in PORTUGUESE_SCHOOLS 
            if s["district"] == district and cycle in s.get("cycles", [])]

# Para compatibilidade com código existente
SAMPLE_SCHOOLS = PORTUGUESE_SCHOOLS
