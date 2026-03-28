#!/usr/bin/env python3
"""
Script para processar os dados das escolas extraídos dos ficheiros Excel
e criar estrutura hierárquica: Distrito -> Concelho -> Localidade -> Escola
"""

# Dados reais das escolas portuguesas extraídos dos ficheiros Excel oficiais
# Organizados hierarquicamente para facilitar a seleção no registo

PORTUGUESE_DISTRICTS = [
    {"district_id": "1", "name": "Viana do Castelo"},
    {"district_id": "2", "name": "Braga"},
    {"district_id": "3", "name": "Vila Real"},
    {"district_id": "4", "name": "Bragança"},
    {"district_id": "5", "name": "Porto"},
    {"district_id": "6", "name": "Aveiro"},
    {"district_id": "7", "name": "Viseu"},
    {"district_id": "8", "name": "Guarda"},
    {"district_id": "9", "name": "Coimbra"},
    {"district_id": "10", "name": "Castelo Branco"},
    {"district_id": "11", "name": "Leiria"},
    {"district_id": "12", "name": "Santarém"},
    {"district_id": "13", "name": "Lisboa"},
    {"district_id": "14", "name": "Setúbal"},
    {"district_id": "15", "name": "Portalegre"},
    {"district_id": "16", "name": "Évora"},
    {"district_id": "17", "name": "Beja"},
    {"district_id": "18", "name": "Faro"},
    {"district_id": "19", "name": "Açores"},
    {"district_id": "20", "name": "Madeira"},
]

# Mapeamento de anos escolares para ciclos
SCHOOL_YEARS_BY_CYCLE = {
    "1": ["1", "2", "3", "4"],  # 1º Ciclo: 1º ao 4º ano
    "2": ["5", "6"],            # 2º Ciclo: 5º e 6º ano
    "3": ["7", "8", "9"],       # 3º Ciclo: 7º ao 9º ano
}

def get_cycle_from_year(year: str) -> str:
    """Obtém o ciclo a partir do ano escolar"""
    for cycle, years in SCHOOL_YEARS_BY_CYCLE.items():
        if year in years:
            return cycle
    return "1"

# Escolas reais portuguesas - dados extraídos dos ficheiros Excel oficiais
# Estrutura: name, district, municipality, locality, cycles
PORTUGUESE_SCHOOLS = [
    # ========== LISBOA ==========
    {"school_id": "lis001", "name": "Externato do Parque", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis002", "name": "Externato de S. José", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis003", "name": "Escola Raiz", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2"]},
    {"school_id": "lis004", "name": "Colégio Santo André", "district": "Lisboa", "municipality": "Mafra", "locality": "Venda do Pinheiro", "cycles": ["1", "2"]},
    {"school_id": "lis005", "name": "Colégio Arte & Manha", "district": "Lisboa", "municipality": "Mafra", "locality": "Mafra", "cycles": ["1"]},
    {"school_id": "lis006", "name": "Colégio Monte Flor", "district": "Lisboa", "municipality": "Oeiras", "locality": "Carnaxide", "cycles": ["1"]},
    {"school_id": "lis007", "name": "Externato Santa Catarina", "district": "Lisboa", "municipality": "Oeiras", "locality": "Cruz Quebrada-Dafundo", "cycles": ["1"]},
    {"school_id": "lis008", "name": "Externato A Palmeirinha", "district": "Lisboa", "municipality": "Oeiras", "locality": "Oeiras", "cycles": ["1"]},
    {"school_id": "lis009", "name": "Externato Padre António Vieira", "district": "Lisboa", "municipality": "Oeiras", "locality": "Linda a Velha", "cycles": ["1", "2"]},
    {"school_id": "lis010", "name": "Externato Nova Oeiras", "district": "Lisboa", "municipality": "Oeiras", "locality": "Oeiras", "cycles": ["1"]},
    {"school_id": "lis011", "name": "Colégio São Francisco de Assis", "district": "Lisboa", "municipality": "Oeiras", "locality": "Porto Salvo", "cycles": ["1"]},
    {"school_id": "lis012", "name": "Colégio da Torre", "district": "Lisboa", "municipality": "Oeiras", "locality": "Paço de Arcos", "cycles": ["1", "2"]},
    {"school_id": "lis013", "name": "Colégio da Fonte", "district": "Lisboa", "municipality": "Oeiras", "locality": "Porto Salvo", "cycles": ["1"]},
    {"school_id": "lis014", "name": "Colégio Pedro Arrupe", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis015", "name": "Colégio Integrado Monte Maior", "district": "Lisboa", "municipality": "Loures", "locality": "Loures", "cycles": ["1", "2"]},
    {"school_id": "lis016", "name": "Colégio Oriente", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2"]},
    {"school_id": "lis017", "name": "Colégio Bartolomeu Dias", "district": "Lisboa", "municipality": "Loures", "locality": "Santa Iria de Azóia", "cycles": ["1", "2"]},
    {"school_id": "lis018", "name": "Colégio Militar", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis019", "name": "Colégio Manuel Bernardes", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis020", "name": "Colégio Luso-Suíço", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis021", "name": "Colégio do Sagrado Coração de Maria", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis022", "name": "Colégio do Bom Sucesso", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis023", "name": "Colégio de São João de Brito", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis024", "name": "Colégio de Santa Maria", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis025", "name": "Colégio São Tomás - Quinta das Conchas", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis026", "name": "Academia de Música de Santa Cecília", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2"]},
    {"school_id": "lis027", "name": "Colégio Valsassina", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis028", "name": "Colégio São Tomás - Sete Rios", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis029", "name": "Salesianos de Lisboa - Colégio Oficinas de São José", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis030", "name": "PaRK International School - Restelo", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis031", "name": "Colégio Moderno", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis032", "name": "Colégio Mira Rio", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis033", "name": "Externato Marista de Lisboa", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis034", "name": "Real Colégio de Portugal", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1", "2", "3"]},
    {"school_id": "lis035", "name": "Escola Básica Raul Lino", "district": "Lisboa", "municipality": "Cascais", "locality": "Estoril", "cycles": ["1"]},
    {"school_id": "lis036", "name": "Escola Básica de Cascais", "district": "Lisboa", "municipality": "Cascais", "locality": "Cascais", "cycles": ["1", "2"]},
    {"school_id": "lis037", "name": "Escola Básica Ibn Mucana", "district": "Lisboa", "municipality": "Cascais", "locality": "Alcabideche", "cycles": ["2", "3"]},
    {"school_id": "lis038", "name": "Escola Básica de São João do Estoril", "district": "Lisboa", "municipality": "Cascais", "locality": "Estoril", "cycles": ["1", "2"]},
    {"school_id": "lis039", "name": "Escola Básica José Cardoso Pires", "district": "Lisboa", "municipality": "Amadora", "locality": "Amadora", "cycles": ["2", "3"]},
    {"school_id": "lis040", "name": "Escola Básica de Alfornelos", "district": "Lisboa", "municipality": "Amadora", "locality": "Amadora", "cycles": ["2", "3"]},
    {"school_id": "lis041", "name": "Escola Básica Almeida Garrett", "district": "Lisboa", "municipality": "Amadora", "locality": "Amadora", "cycles": ["2", "3"]},
    {"school_id": "lis042", "name": "Escola Básica Padre Alberto Neto", "district": "Lisboa", "municipality": "Sintra", "locality": "Rio de Mouro", "cycles": ["2", "3"]},
    {"school_id": "lis043", "name": "Escola Básica Alto dos Moinhos", "district": "Lisboa", "municipality": "Sintra", "locality": "Agualva-Cacém", "cycles": ["2", "3"]},
    {"school_id": "lis044", "name": "Escola Básica Rainha D. Leonor de Lencastre", "district": "Lisboa", "municipality": "Sintra", "locality": "São Marcos", "cycles": ["2", "3"]},
    {"school_id": "lis045", "name": "Escola Básica n.º 72 de Lisboa", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["1"]},
    {"school_id": "lis046", "name": "Escola Básica Josefa de Óbidos", "district": "Lisboa", "municipality": "Lisboa", "locality": "Lisboa", "cycles": ["2", "3"]},
    {"school_id": "lis047", "name": "Escola Básica do Carregado", "district": "Lisboa", "municipality": "Alenquer", "locality": "Carregado", "cycles": ["1", "2"]},
    {"school_id": "lis048", "name": "Escola Básica Pêro de Alenquer", "district": "Lisboa", "municipality": "Alenquer", "locality": "Alenquer", "cycles": ["2", "3"]},
    {"school_id": "lis049", "name": "Escola Básica António Bento Franco", "district": "Lisboa", "municipality": "Mafra", "locality": "Ericeira", "cycles": ["2", "3"]},
    {"school_id": "lis050", "name": "Escola Básica do Bom Sucesso", "district": "Lisboa", "municipality": "Vila Franca de Xira", "locality": "Alverca do Ribatejo", "cycles": ["1", "2"]},
    
    # ========== PORTO ==========
    {"school_id": "por001", "name": "Escola Básica Clara de Resende", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por002", "name": "Escola Básica Rodrigues de Freitas", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["2", "3"]},
    {"school_id": "por003", "name": "Escola do Falcão", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["1"]},
    {"school_id": "por004", "name": "Escola do Cerco", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["1"]},
    {"school_id": "por005", "name": "Escola de São Roque de Lameira", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["1"]},
    {"school_id": "por006", "name": "Escola Paulo da Gama", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["1"]},
    {"school_id": "por007", "name": "Escola Fernão de Magalhães", "district": "Porto", "municipality": "Porto", "locality": "Porto", "cycles": ["1"]},
    {"school_id": "por008", "name": "Escola Básica de Matosinhos", "district": "Porto", "municipality": "Matosinhos", "locality": "Matosinhos", "cycles": ["1"]},
    {"school_id": "por009", "name": "Escola Florbela Espanca", "district": "Porto", "municipality": "Matosinhos", "locality": "Matosinhos", "cycles": ["1"]},
    {"school_id": "por010", "name": "Escola da Barranha", "district": "Porto", "municipality": "Matosinhos", "locality": "Senhora da Hora", "cycles": ["1"]},
    {"school_id": "por011", "name": "Escola Básica de Caxinas", "district": "Porto", "municipality": "Vila do Conde", "locality": "Vila do Conde", "cycles": ["1"]},
    {"school_id": "por012", "name": "Escola Júlio Saúl Dias", "district": "Porto", "municipality": "Vila do Conde", "locality": "Vila do Conde", "cycles": ["1"]},
    {"school_id": "por013", "name": "Escola Básica de Azurara", "district": "Porto", "municipality": "Vila do Conde", "locality": "Azurara", "cycles": ["1"]},
    {"school_id": "por014", "name": "Escola Básica Nova de Valongo", "district": "Porto", "municipality": "Valongo", "locality": "Valongo", "cycles": ["1"]},
    {"school_id": "por015", "name": "Escola Básica Mirante dos Sonhos", "district": "Porto", "municipality": "Valongo", "locality": "Ermesinde", "cycles": ["1"]},
    {"school_id": "por016", "name": "Escola Básica de Sininhos", "district": "Porto", "municipality": "Póvoa de Varzim", "locality": "Póvoa de Varzim", "cycles": ["1"]},
    {"school_id": "por017", "name": "Escola do Desterro", "district": "Porto", "municipality": "Póvoa de Varzim", "locality": "Póvoa de Varzim", "cycles": ["1"]},
    {"school_id": "por018", "name": "Escola Básica de São José", "district": "Porto", "municipality": "Santo Tirso", "locality": "Refojos de Riba de Ave", "cycles": ["1"]},
    {"school_id": "por019", "name": "Escola Básica de Cedões", "district": "Porto", "municipality": "Trofa", "locality": "Trofa", "cycles": ["1"]},
    {"school_id": "por020", "name": "Escola Básica de Pena", "district": "Porto", "municipality": "Vila Nova de Gaia", "locality": "Vila Nova de Gaia", "cycles": ["1"]},
    
    # ========== BRAGA ==========
    {"school_id": "brg001", "name": "Escola Básica Santos Simões", "district": "Braga", "municipality": "Guimarães", "locality": "Guimarães", "cycles": ["2", "3"]},
    {"school_id": "brg002", "name": "Escola Básica de Abação", "district": "Braga", "municipality": "Guimarães", "locality": "Abação", "cycles": ["2"]},
    {"school_id": "brg003", "name": "Escola Básica de Arões - Santa Cristina", "district": "Braga", "municipality": "Fafe", "locality": "Arões", "cycles": ["2"]},
    {"school_id": "brg004", "name": "Escola Básica de Forjães", "district": "Braga", "municipality": "Esposende", "locality": "Forjães", "cycles": ["2"]},
    {"school_id": "brg005", "name": "Escola Básica António Rodrigues Sampaio", "district": "Braga", "municipality": "Esposende", "locality": "Esposende", "cycles": ["2", "3"]},
    {"school_id": "brg006", "name": "Colégio D. Diogo de Sousa", "district": "Braga", "municipality": "Braga", "locality": "Braga", "cycles": ["1", "2", "3"]},
    {"school_id": "brg007", "name": "Externato Infante D. Henrique", "district": "Braga", "municipality": "Braga", "locality": "Braga", "cycles": ["1", "2", "3"]},
    {"school_id": "brg008", "name": "Colégio Teresiano", "district": "Braga", "municipality": "Braga", "locality": "Braga", "cycles": ["1", "2", "3"]},
    
    # ========== AVEIRO ==========
    {"school_id": "ave001", "name": "Escola Básica de Aradas", "district": "Aveiro", "municipality": "Aveiro", "locality": "Aradas", "cycles": ["2"]},
    {"school_id": "ave002", "name": "Escola Básica Rio Novo do Príncipe", "district": "Aveiro", "municipality": "Aveiro", "locality": "Aveiro", "cycles": ["2"]},
    {"school_id": "ave003", "name": "Escola Básica Castro Matoso", "district": "Aveiro", "municipality": "Aveiro", "locality": "Oliveirinha", "cycles": ["2"]},
    {"school_id": "ave004", "name": "Escola Básica João Afonso", "district": "Aveiro", "municipality": "Aveiro", "locality": "Aveiro", "cycles": ["2", "3"]},
    {"school_id": "ave005", "name": "Escola Básica Fernando Caldeira", "district": "Aveiro", "municipality": "Águeda", "locality": "Águeda", "cycles": ["2", "3"]},
    {"school_id": "ave006", "name": "Escola Básica de Anadia", "district": "Aveiro", "municipality": "Anadia", "locality": "Anadia", "cycles": ["2", "3"]},
    {"school_id": "ave007", "name": "Escola Básica Oliveira Júnior", "district": "Aveiro", "municipality": "São João da Madeira", "locality": "São João da Madeira", "cycles": ["2", "3"]},
    {"school_id": "ave008", "name": "Escola Básica Ferreira de Castro", "district": "Aveiro", "municipality": "Oliveira de Azeméis", "locality": "Oliveira de Azeméis", "cycles": ["2", "3"]},
    
    # ========== COIMBRA ==========
    {"school_id": "coi001", "name": "Escola Básica de Ceira", "district": "Coimbra", "municipality": "Coimbra", "locality": "Ceira", "cycles": ["2"]},
    {"school_id": "coi002", "name": "Escola Básica Dr.ª Maria Alice Gouveia", "district": "Coimbra", "municipality": "Coimbra", "locality": "Coimbra", "cycles": ["2", "3"]},
    {"school_id": "coi003", "name": "Escola Básica Rainha Santa Isabel", "district": "Coimbra", "municipality": "Coimbra", "locality": "Coimbra", "cycles": ["2"]},
    {"school_id": "coi004", "name": "Escola Básica Eugénio de Castro", "district": "Coimbra", "municipality": "Coimbra", "locality": "Coimbra", "cycles": ["2", "3"]},
    {"school_id": "coi005", "name": "Escola Martim de Freitas", "district": "Coimbra", "municipality": "Coimbra", "locality": "Coimbra", "cycles": ["2", "3"]},
    {"school_id": "coi006", "name": "Escola Básica de Condeixa-a-Nova", "district": "Coimbra", "municipality": "Condeixa-a-Nova", "locality": "Condeixa-a-Nova", "cycles": ["2"]},
    {"school_id": "coi007", "name": "Escola Básica de Góis", "district": "Coimbra", "municipality": "Góis", "locality": "Góis", "cycles": ["2"]},
    {"school_id": "coi008", "name": "Colégio da Rainha Santa Isabel", "district": "Coimbra", "municipality": "Coimbra", "locality": "Coimbra", "cycles": ["1", "2", "3"]},
    {"school_id": "coi009", "name": "Escola Básica de Lousã", "district": "Coimbra", "municipality": "Lousã", "locality": "Lousã", "cycles": ["1", "2"]},
    {"school_id": "coi010", "name": "Escola Rui Martins", "district": "Coimbra", "municipality": "Figueira da Foz", "locality": "Figueira da Foz", "cycles": ["1"]},
    
    # ========== SETÚBAL ==========
    {"school_id": "set001", "name": "Escola Básica Maria do Carmo Serrote", "district": "Setúbal", "municipality": "Sesimbra", "locality": "Quinta do Conde", "cycles": ["1", "2"]},
    {"school_id": "set002", "name": "Escola Básica de Pegões", "district": "Setúbal", "municipality": "Montijo", "locality": "Pegões", "cycles": ["1", "2"]},
    {"school_id": "set003", "name": "Escola D. Luís de Mendonça Furtado", "district": "Setúbal", "municipality": "Barreiro", "locality": "Barreiro", "cycles": ["1", "2"]},
    {"school_id": "set004", "name": "Escola Básica Padre Abílio Mendes", "district": "Setúbal", "municipality": "Barreiro", "locality": "Barreiro", "cycles": ["2", "3"]},
    {"school_id": "set005", "name": "Escola Básica da Trafaria", "district": "Setúbal", "municipality": "Almada", "locality": "Trafaria", "cycles": ["1", "2"]},
    {"school_id": "set006", "name": "Escola Básica Elias Garcia", "district": "Setúbal", "municipality": "Almada", "locality": "Almada", "cycles": ["1", "2"]},
    {"school_id": "set007", "name": "Escola Básica de Monte da Caparica", "district": "Setúbal", "municipality": "Almada", "locality": "Monte da Caparica", "cycles": ["1", "2"]},
    {"school_id": "set008", "name": "Escola Básica Luísa Todi", "district": "Setúbal", "municipality": "Setúbal", "locality": "Setúbal", "cycles": ["1", "2", "3"]},
    
    # ========== SANTARÉM ==========
    {"school_id": "san001", "name": "Escola Básica José Relvas", "district": "Santarém", "municipality": "Alpiarça", "locality": "Alpiarça", "cycles": ["2", "3"]},
    {"school_id": "san002", "name": "Escola Básica Mem Ramires", "district": "Santarém", "municipality": "Santarém", "locality": "Santarém", "cycles": ["2"]},
    {"school_id": "san003", "name": "Escola Básica de Salvaterra de Magos", "district": "Santarém", "municipality": "Salvaterra de Magos", "locality": "Salvaterra de Magos", "cycles": ["1", "2", "3"]},
    {"school_id": "san004", "name": "Escola Básica de Caxarias", "district": "Santarém", "municipality": "Ourém", "locality": "Caxarias", "cycles": ["1", "2"]},
    {"school_id": "san005", "name": "Escola Básica 4.º Conde de Ourém", "district": "Santarém", "municipality": "Ourém", "locality": "Ourém", "cycles": ["2", "3"]},
    {"school_id": "san006", "name": "Escola Básica Dr.ª Judite Andrade", "district": "Santarém", "municipality": "Sardoal", "locality": "Sardoal", "cycles": ["1", "2", "3"]},
    {"school_id": "san007", "name": "Escola Básica Luís de Camões", "district": "Santarém", "municipality": "Constância", "locality": "Constância", "cycles": ["2", "3"]},
    {"school_id": "san008", "name": "Escola Básica D. Sancho I", "district": "Santarém", "municipality": "Cartaxo", "locality": "Cartaxo", "cycles": ["2"]},
    
    # ========== LEIRIA ==========
    {"school_id": "lei001", "name": "Escola Básica de Atouguia da Baleia", "district": "Leiria", "municipality": "Peniche", "locality": "Atouguia da Baleia", "cycles": ["1", "2"]},
    {"school_id": "lei002", "name": "Escola Básica da Batalha", "district": "Leiria", "municipality": "Batalha", "locality": "Batalha", "cycles": ["2", "3"]},
    {"school_id": "lei003", "name": "Escola Básica Dr. Correia Alexandre", "district": "Leiria", "municipality": "Leiria", "locality": "Leiria", "cycles": ["2"]},
    {"school_id": "lei004", "name": "Escola Básica Henrique Sommer", "district": "Leiria", "municipality": "Leiria", "locality": "Leiria", "cycles": ["2", "3"]},
    {"school_id": "lei005", "name": "Escola Básica Gualdim Pais", "district": "Leiria", "municipality": "Pombal", "locality": "Pombal", "cycles": ["2", "3"]},
    {"school_id": "lei006", "name": "Escola Básica da Benedita", "district": "Leiria", "municipality": "Alcobaça", "locality": "Benedita", "cycles": ["1", "2"]},
    {"school_id": "lei007", "name": "Escola Básica de Turquel", "district": "Leiria", "municipality": "Alcobaça", "locality": "Turquel", "cycles": ["1"]},
    {"school_id": "lei008", "name": "Escola Básica Amadeu Gaudêncio", "district": "Leiria", "municipality": "Nazaré", "locality": "Nazaré", "cycles": ["2", "3"]},
    
    # ========== CASTELO BRANCO ==========
    {"school_id": "cas001", "name": "Escola Básica Prof. Dr. António Sena Faria de Vasconcelos", "district": "Castelo Branco", "municipality": "Castelo Branco", "locality": "Castelo Branco", "cycles": ["1", "2"]},
    {"school_id": "cas002", "name": "Escola Básica Cidade de Castelo Branco", "district": "Castelo Branco", "municipality": "Castelo Branco", "locality": "Castelo Branco", "cycles": ["1", "2"]},
    {"school_id": "cas003", "name": "Escola Básica de Tortosendo", "district": "Castelo Branco", "municipality": "Covilhã", "locality": "Tortosendo", "cycles": ["1", "2"]},
    {"school_id": "cas004", "name": "Escola Básica Afonso de Paiva", "district": "Castelo Branco", "municipality": "Castelo Branco", "locality": "Castelo Branco", "cycles": ["2", "3"]},
    {"school_id": "cas005", "name": "Escola Básica Pêro da Covilhã", "district": "Castelo Branco", "municipality": "Covilhã", "locality": "Covilhã", "cycles": ["2", "3"]},
    
    # ========== GUARDA ==========
    {"school_id": "gua001", "name": "Escola Básica da Sé", "district": "Guarda", "municipality": "Guarda", "locality": "Guarda", "cycles": ["2", "3"]},
    {"school_id": "gua002", "name": "Escola Básica Carolina Beatriz Ângelo", "district": "Guarda", "municipality": "Guarda", "locality": "Guarda", "cycles": ["2", "3"]},
    {"school_id": "gua003", "name": "Centro Educativo do Mondego", "district": "Guarda", "municipality": "Guarda", "locality": "Guarda", "cycles": ["1"]},
    {"school_id": "gua004", "name": "Escola Básica de Sequeira", "district": "Guarda", "municipality": "Guarda", "locality": "Guarda", "cycles": ["1"]},
    {"school_id": "gua005", "name": "Escola Básica de Manteigas", "district": "Guarda", "municipality": "Manteigas", "locality": "Manteigas", "cycles": ["2", "3"]},
    
    # ========== VISEU ==========
    {"school_id": "vis001", "name": "Escola Básica Dr. Azeredo Perdigão", "district": "Viseu", "municipality": "Viseu", "locality": "Viseu", "cycles": ["2", "3"]},
    {"school_id": "vis002", "name": "Escola Básica D. Duarte", "district": "Viseu", "municipality": "Viseu", "locality": "Viseu", "cycles": ["2"]},
    {"school_id": "vis003", "name": "Escola Básica Mestre Arnaldo Malho", "district": "Viseu", "municipality": "Viseu", "locality": "Viseu", "cycles": ["1"]},
    {"school_id": "vis004", "name": "Escola Básica de Penalva do Castelo", "district": "Viseu", "municipality": "Penalva do Castelo", "locality": "Penalva do Castelo", "cycles": ["2", "3"]},
    
    # ========== VILA REAL ==========
    {"school_id": "vlr001", "name": "Escola Básica de Pinhão", "district": "Vila Real", "municipality": "Alijó", "locality": "Pinhão", "cycles": ["1"]},
    {"school_id": "vlr002", "name": "Escola Básica de Mesão Frio", "district": "Vila Real", "municipality": "Mesão Frio", "locality": "Mesão Frio", "cycles": ["1"]},
    {"school_id": "vlr003", "name": "Escola Básica de Chaves", "district": "Vila Real", "municipality": "Chaves", "locality": "Chaves", "cycles": ["1"]},
    {"school_id": "vlr004", "name": "Escola Básica Amadeo de Souza Cardoso", "district": "Vila Real", "municipality": "Amarante", "locality": "Amarante", "cycles": ["2"]},
    {"school_id": "vlr005", "name": "Escola Básica n.º 7 de Vila Real", "district": "Vila Real", "municipality": "Vila Real", "locality": "Vila Real", "cycles": ["1"]},
    
    # ========== VIANA DO CASTELO ==========
    {"school_id": "via001", "name": "Escola Básica Dr. Manuel da Costa Brandão", "district": "Viana do Castelo", "municipality": "Arcos de Valdevez", "locality": "Arcos de Valdevez", "cycles": ["1"]},
    {"school_id": "via002", "name": "Escola Básica do Vale do Âncora", "district": "Viana do Castelo", "municipality": "Caminha", "locality": "Vila Praia de Âncora", "cycles": ["1", "2", "3"]},
    {"school_id": "via003", "name": "Escola Básica de Melgaço", "district": "Viana do Castelo", "municipality": "Melgaço", "locality": "Melgaço", "cycles": ["1"]},
    {"school_id": "via004", "name": "Escola Básica Diogo Bernardes", "district": "Viana do Castelo", "municipality": "Ponte da Barca", "locality": "Ponte da Barca", "cycles": ["1"]},
    {"school_id": "via005", "name": "Escola Deu-la-Deu Martins", "district": "Viana do Castelo", "municipality": "Monção", "locality": "Monção", "cycles": ["2"]},
    
    # ========== BRAGANÇA ==========
    {"school_id": "bgc001", "name": "Escola Básica Augusto Moreno", "district": "Bragança", "municipality": "Bragança", "locality": "Bragança", "cycles": ["2", "3"]},
    {"school_id": "bgc002", "name": "Escola Básica Miguel Torga", "district": "Bragança", "municipality": "Bragança", "locality": "Bragança", "cycles": ["2", "3"]},
    {"school_id": "bgc003", "name": "Escola Básica Luciano Cordeiro", "district": "Bragança", "municipality": "Mirandela", "locality": "Mirandela", "cycles": ["2"]},
    
    # ========== FARO ==========
    {"school_id": "far001", "name": "Escola Básica Dr. António de Sousa Agostinho", "district": "Faro", "municipality": "Loulé", "locality": "Almancil", "cycles": ["2", "3"]},
    {"school_id": "far002", "name": "Escola Básica de Quarteira", "district": "Faro", "municipality": "Loulé", "locality": "Quarteira", "cycles": ["2", "3"]},
    {"school_id": "far003", "name": "Escola Básica D. Afonso III", "district": "Faro", "municipality": "Faro", "locality": "Faro", "cycles": ["2", "3"]},
    {"school_id": "far004", "name": "Escola Básica Poeta Emiliano da Costa", "district": "Faro", "municipality": "Albufeira", "locality": "Albufeira", "cycles": ["2", "3"]},
    {"school_id": "far005", "name": "Escola Básica de Lagoa", "district": "Faro", "municipality": "Lagoa", "locality": "Lagoa", "cycles": ["2", "3"]},
    {"school_id": "far006", "name": "Colégio Internacional de Vilamoura", "district": "Faro", "municipality": "Loulé", "locality": "Vilamoura", "cycles": ["1", "2", "3"]},
    
    # ========== ÉVORA ==========
    {"school_id": "evo001", "name": "Escola Básica Conde de Vilalva", "district": "Évora", "municipality": "Évora", "locality": "Évora", "cycles": ["2", "3"]},
    {"school_id": "evo002", "name": "Escola Básica André de Resende", "district": "Évora", "municipality": "Évora", "locality": "Évora", "cycles": ["2", "3"]},
    {"school_id": "evo003", "name": "Escola Básica Santa Clara", "district": "Évora", "municipality": "Évora", "locality": "Évora", "cycles": ["2", "3"]},
    {"school_id": "evo004", "name": "Escola Básica de Reguengos de Monsaraz", "district": "Évora", "municipality": "Reguengos de Monsaraz", "locality": "Reguengos de Monsaraz", "cycles": ["2", "3"]},
    
    # ========== BEJA ==========
    {"school_id": "bej001", "name": "Escola Básica de Santiago Maior", "district": "Beja", "municipality": "Beja", "locality": "Beja", "cycles": ["2", "3"]},
    {"school_id": "bej002", "name": "Escola Básica de Mértola", "district": "Beja", "municipality": "Mértola", "locality": "Mértola", "cycles": ["2", "3"]},
    {"school_id": "bej003", "name": "Escola Básica de Castro Verde", "district": "Beja", "municipality": "Castro Verde", "locality": "Castro Verde", "cycles": ["2", "3"]},
    
    # ========== PORTALEGRE ==========
    {"school_id": "ptg001", "name": "Escola Básica José Régio", "district": "Portalegre", "municipality": "Portalegre", "locality": "Portalegre", "cycles": ["2", "3"]},
    {"school_id": "ptg002", "name": "Escola Básica Cristóvão Falcão", "district": "Portalegre", "municipality": "Portalegre", "locality": "Portalegre", "cycles": ["2", "3"]},
    {"school_id": "ptg003", "name": "Escola Básica de Nisa", "district": "Portalegre", "municipality": "Nisa", "locality": "Nisa", "cycles": ["2", "3"]},
    {"school_id": "ptg004", "name": "Escola Básica de Elvas", "district": "Portalegre", "municipality": "Elvas", "locality": "Elvas", "cycles": ["2", "3"]},
    
    # ========== AÇORES ==========
    {"school_id": "aco001", "name": "Escola Básica Integrada de Lagoa", "district": "Açores", "municipality": "Lagoa", "locality": "Lagoa", "cycles": ["1", "2", "3"]},
    {"school_id": "aco002", "name": "Escola Básica Integrada Roberto Ivens", "district": "Açores", "municipality": "Ponta Delgada", "locality": "Ponta Delgada", "cycles": ["1", "2", "3"]},
    {"school_id": "aco003", "name": "Escola Básica Integrada de Ribeira Grande", "district": "Açores", "municipality": "Ribeira Grande", "locality": "Ribeira Grande", "cycles": ["1", "2", "3"]},
    {"school_id": "aco004", "name": "Escola Básica Integrada de Angra do Heroísmo", "district": "Açores", "municipality": "Angra do Heroísmo", "locality": "Angra do Heroísmo", "cycles": ["1", "2", "3"]},
    
    # ========== MADEIRA ==========
    {"school_id": "mad001", "name": "Escola Básica do 1º Ciclo com PE da Achada", "district": "Madeira", "municipality": "Funchal", "locality": "Funchal", "cycles": ["1"]},
    {"school_id": "mad002", "name": "Escola Básica Dr. Horácio Bento de Gouveia", "district": "Madeira", "municipality": "Funchal", "locality": "Funchal", "cycles": ["2", "3"]},
    {"school_id": "mad003", "name": "Escola Básica de Santo António", "district": "Madeira", "municipality": "Funchal", "locality": "Santo António", "cycles": ["2", "3"]},
    {"school_id": "mad004", "name": "Escola Básica Integrada de Câmara de Lobos", "district": "Madeira", "municipality": "Câmara de Lobos", "locality": "Câmara de Lobos", "cycles": ["1", "2", "3"]},
]

# ==================== FUNÇÕES AUXILIARES ====================

def get_unique_municipalities(district: str = None):
    """Obtém concelhos únicos, opcionalmente filtrados por distrito"""
    municipalities = set()
    for school in PORTUGUESE_SCHOOLS:
        if district is None or school["district"] == district:
            municipalities.add((school["district"], school["municipality"]))
    return sorted([{"district": d, "municipality": m} for d, m in municipalities], key=lambda x: x["municipality"])

def get_unique_localities(district: str = None, municipality: str = None):
    """Obtém localidades únicas, opcionalmente filtradas por distrito e concelho"""
    localities = set()
    for school in PORTUGUESE_SCHOOLS:
        match_district = district is None or school["district"] == district
        match_municipality = municipality is None or school["municipality"] == municipality
        if match_district and match_municipality:
            localities.add((school["district"], school["municipality"], school["locality"]))
    return sorted([{"district": d, "municipality": m, "locality": loc} for d, m, loc in localities], key=lambda x: x["locality"])

def get_schools_by_cycle(cycle: str):
    """Filtra escolas por ciclo"""
    return [s for s in PORTUGUESE_SCHOOLS if cycle in s.get("cycles", [])]

def get_schools_by_district_and_cycle(district: str, cycle: str):
    """Filtra escolas por distrito e ciclo"""
    return [s for s in PORTUGUESE_SCHOOLS 
            if s["district"] == district and cycle in s.get("cycles", [])]

def get_schools_by_filters(district: str = None, municipality: str = None, locality: str = None, cycle: str = None):
    """Filtra escolas por múltiplos critérios"""
    result = PORTUGUESE_SCHOOLS
    
    if district:
        result = [s for s in result if s["district"] == district]
    if municipality:
        result = [s for s in result if s["municipality"] == municipality]
    if locality:
        result = [s for s in result if s["locality"] == locality]
    if cycle:
        result = [s for s in result if cycle in s.get("cycles", [])]
    
    return result

# Para compatibilidade com código existente
SAMPLE_SCHOOLS = PORTUGUESE_SCHOOLS
