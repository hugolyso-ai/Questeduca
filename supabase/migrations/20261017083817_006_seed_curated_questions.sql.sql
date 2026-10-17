/*
# Seed curated questions (retry with jsonb_build_array)

1. Data
- Preenche `quiz_questions` com perguntas curadas por ano (1-9), para
  Português, Estudo do Meio, História, Geografia, Ciências e Inglês.
- Usa jsonb_build_array para construir as opções.
- Idempotente via UNIQUE(subject, school_year, question).
2. Security
- Sem alterações de RLS.
*/

DO $$
DECLARE
  y INT;
  rec RECORD;
BEGIN
  FOR y IN 1..9 LOOP
    -- ===== PORTUGUÊS =====
    FOR rec IN
      SELECT * FROM (VALUES
        ('Qual destas palavras está escrita corretamente?', jsonb_build_array('casa','caza','caça','kaza'), 0),
        ('O plural de "pão" é:', jsonb_build_array('pãos','pães','pões','pãoes'), 1),
        ('Qual é o sinónimo de "alegre"?', jsonb_build_array('triste','contente','zangado','cansado'), 1),
        ('O oposto de "quente" é:', jsonb_build_array('morno','frio','calor','doce'), 1),
        ('"O menino comeu o bolo." Quem comeu o bolo?', jsonb_build_array('O bolo','O menino','A mesa','Ninguém'), 1),
        ('Quantas sílabas tem a palavra "borboleta"?', jsonb_build_array('2','3','4','5'), 2),
        ('Qual destas palavras é um verbo?', jsonb_build_array('correr','azul','cadeira','rápido'), 0),
        ('Qual é o feminino de "rei"?', jsonb_build_array('rainha','princesa','duquesa','condessa'), 0),
        ('"Mãe" e "pai" são:', jsonb_build_array('irmãos','primos','pais','filhos'), 2),
        ('Qual palavra rima com "flor"?', jsonb_build_array('cor','mesa','livro','casa'), 0),
        ('Um texto que conta uma história chama-se:', jsonb_build_array('notícia','narrativa','receita','lista'), 1),
        ('O ponto de interrogação usa-se para:', jsonb_build_array('fazer uma pergunta','gritar','listar','pausar'), 0),
        ('Qual destas é uma fruta?', jsonb_build_array('batata','maçã','cebola','alface'), 1),
        ('"Biblioteca" é um lugar onde se:', jsonb_build_array('dorme','lê','come','brinca'), 1),
        ('Qual é a letra inicial do alfabeto?', jsonb_build_array('B','Z','A','M'), 2),
        ('Quantas letras tem o alfabeto português?', jsonb_build_array('23','26','21','25'), 1),
        ('Qual é o antónimo de "dia"?', jsonb_build_array('manhã','noite','tarde','sol'), 1),
        ('"Mesa", "cadeira", "sofá" são:', jsonb_build_array('animais','móveis','comidas','cores'), 1),
        ('Como se escreve o número "cinco"?', jsonb_build_array('sico','cinco','çinco','sincso'), 1),
        ('Qual destas palavras começa por "b"?', jsonb_build_array('dado','bola','casa','gato'), 1),
        ('O plural de "papel" é:', jsonb_build_array('papéis','papeis','papelos','papeles'), 0),
        ('Quem escreve um livro chama-se:', jsonb_build_array('leitor','autor','bibliotecário','editor'), 1),
        ('Uma frase termina com:', jsonb_build_array('vírgula','ponto','dois pontos','aspas'), 1),
        ('"Eu ___ um bom livro." Completa:', jsonb_build_array('leio','leia','lei','les'), 0),
        ('Qual é o feminino de "ator"?', jsonb_build_array('atriz','atora','actora','atrizia'), 0),
        ('"Verde", "azul" e "vermelho" são:', jsonb_build_array('números','cores','dias','animais'), 1),
        ('Qual palavra significa "grande quantidade de água"?', jsonb_build_array('deserto','oceano','montanha','floresta'), 1),
        ('O que é um dicionário?', jsonb_build_array('Livro de palavras','Livro de contas','Livro de mapas','Livro de cores'), 0),
        ('Qual destas palavras é diminutivo?', jsonb_build_array('casinha','casarão','casa','casas'), 0),
        ('"Ontem" indica:', jsonb_build_array('futuro','presente','passado','nunca'), 2)
      ) AS t(question, options, correct_answer)
    LOOP
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer)
      VALUES ('portugues', y, rec.question, rec.options, rec.correct_answer)
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;

    -- ===== ESTUDO DO MEIO =====
    FOR rec IN
      SELECT * FROM (VALUES
        ('Qual é o astro que ilumina a Terra?', jsonb_build_array('A Lua','O Sol','Marte','Vénus'), 1),
        ('De que precisamos para viver?', jsonb_build_array('Ar, água e comida','Só de brinquedos','Só de TV','Só de doces'), 0),
        ('Onde vivem os peixes?', jsonb_build_array('Na árvore','Na água','No deserto','No ar'), 1),
        ('Que animal faz "muuu"?', jsonb_build_array('Gato','Vaca','Cão','Galinha'), 1),
        ('O que usamos para ver?', jsonb_build_array('Os ouvidos','Os olhos','As mãos','O nariz'), 1),
        ('Qual é a estação mais fria?', jsonb_build_array('Verão','Inverno','Primavera','Outono'), 1),
        ('De que cor é a relva?', jsonb_build_array('Azul','Verde','Amarela','Vermelha'), 1),
        ('Quantas patas tem uma aranha?', jsonb_build_array('6','8','4','10'), 1),
        ('O que faz as plantas crescerem?', jsonb_build_array('Água e luz solar','Refrigerante','Doces','Chocolate'), 0),
        ('Qual destes animais voa?', jsonb_build_array('Cão','Peixe','Pássaro','Gato'), 2),
        ('Que sentido usamos para sentir o cheiro?', jsonb_build_array('Visão','Olfato','Tato','Audição'), 1),
        ('O que comem as vacas?', jsonb_build_array('Carne','Relva','Peixe','Pão doce'), 1),
        ('Onde pousam os pássaros?', jsonb_build_array('Na água','Nas árvores','No fogo','Debaixo da terra'), 1),
        ('O que acontece com o gelo ao sol?', jsonb_build_array('Derrete','Congela mais','Cresce','Fica azul'), 0),
        ('Como se chama a casa das abelhas?', jsonb_build_array('Ninho','Colmeia','Toca','Curral'), 1),
        ('Que animal nos dá ovos?', jsonb_build_array('Galinha','Cão','Gato','Vaca'), 0),
        ('De que é feito o pão?', jsonb_build_array('Farinha','Pedra','Plástico','Madeira'), 0),
        ('Qual destes NÃO é um animal?', jsonb_build_array('Elefante','Pedra','Golfinho','Águia'), 1),
        ('Que instrumento usamos para saber as horas?', jsonb_build_array('Régua','Relógio','Balança','Termómetro'), 1),
        ('O que é preciso para uma semente germinar?', jsonb_build_array('Água e terra','Pedras','Plástico','Metal'), 0),
        ('Qual é o maior animal terrestre?', jsonb_build_array('Elefante','Formiga','Rato','Coelho'), 0),
        ('Os animais que comem só plantas são:', jsonb_build_array('carnívoros','herbívoros','omnívoros','predadores'), 1),
        ('O sangue é bombeado pelo:', jsonb_build_array('cérebro','coração','estômago','fígado'), 1),
        ('Respiramos por meio dos:', jsonb_build_array('pulmões','joelhos','cotovelos','dentes'), 0),
        ('Quantas cores tem o arco-íris?', jsonb_build_array('5','6','7','8'), 2),
        ('A água congela a que temperatura?', jsonb_build_array('0 graus','50 graus','100 graus','-100 graus'), 0),
        ('O que faz uma lanterna?', jsonb_build_array('Luz','Som','Cheiro','Frio'), 0),
        ('Que fruta mantém o médico afastado?', jsonb_build_array('banana','maçã','laranja','limão'), 1),
        ('A mão tem quantos dedos (incluindo o polegar)?', jsonb_build_array('4','5','6','7'), 1),
        ('Que animal é conhecido como o melhor amigo do homem?', jsonb_build_array('Gato','Cão','Peixe','Papagaio'), 1)
      ) AS t(question, options, correct_answer)
    LOOP
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer)
      VALUES ('estudo_meio', y, rec.question, rec.options, rec.correct_answer)
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;

    -- ===== HISTÓRIA =====
    FOR rec IN
      SELECT * FROM (VALUES
        ('Quem escreveu "Os Lusíadas"?', jsonb_build_array('Fernando Pessoa','Luís de Camões','Eça de Queirós','Saramago'), 1),
        ('Em que ano se deu a Revolução dos Cravos?', jsonb_build_array('1974','1926','1990','1812'), 0),
        ('Quem foi o primeiro rei de Portugal?', jsonb_build_array('D. Afonso Henriques','D. Sancho I','D. Manuel I','D. Dinis'), 0),
        ('Quando se deu a Batalha de São Mamede?', jsonb_build_array('1128','1143','1250','1385'), 0),
        ('Quem descobriu o caminho marítimo para a Índia?', jsonb_build_array('Cristóvão Colombo','Vasco da Gama','Magalhães','Bartolomeu Dias'), 1),
        ('Qual navegador chegou ao Brasil em 1500?', jsonb_build_array('Pedro Álvares Cabral','Vasco da Gama','D. Afonso Henriques','Camões'), 0),
        ('Em que ano se deu a Batalha de Aljubarrota?', jsonb_build_array('1385','1143','1249','1498'), 0),
        ('Quem liderou os portugueses em Aljubarrota?', jsonb_build_array('Nuno Álvares Pereira','D. Manuel I','Marquês de Pombal','Afonso de Albuquerque'), 0),
        ('Que povo construiu as pirâmides do Egito?', jsonb_build_array('Os egípcios','Os romanos','Os gregos','Os vikings'), 0),
        ('Quem foi Júlio César?', jsonb_build_array('Um líder romano','Um rei português','Um navegador','Um Papa'), 0),
        ('Em que ano chegou Colombo à América?', jsonb_build_array('1492','1500','1453','1600'), 0),
        ('Que rei mandou construir a Torre de Belém?', jsonb_build_array('D. Manuel I','D. João V','D. Carlos I','D. Pedro IV'), 0),
        ('O que foi o 25 de Abril?', jsonb_build_array('Uma festa','A Revolução dos Cravos','Um jogo','Um desastre'), 1),
        ('Quem foi a rainha Santa Isabel?', jsonb_build_array('Rainha de Portugal','Escritora','Cantora','Pintora'), 0),
        ('Quando foi fundado Portugal?', jsonb_build_array('1128','1492','1640','1900'), 0),
        ('O que eram as caravelas?', jsonb_build_array('Navios portugueses','Armas','Animais','Moedas'), 0),
        ('Quem foi Fernando Pessoa?', jsonb_build_array('Um poeta','Um rei','Um navegador','Um pintor'), 0),
        ('A Idade Média seguiu-se a que período?', jsonb_build_array('Idade Antiga','Idade Moderna','Pré-história','Hoje'), 0),
        ('O que é a Pré-história?', jsonb_build_array('O tempo antes da escrita','O tempo depois da escrita','O futuro','Uma era de gelo'), 0),
        ('Quem pintou a Mona Lisa?', jsonb_build_array('Leonardo da Vinci','Picasso','Van Gogh','Dali'), 0),
        ('Em que ano caiu o Muro de Berlim?', jsonb_build_array('1989','1974','1961','2001'), 0),
        ('O que foi a Primeira Guerra Mundial?', jsonb_build_array('Um conflito mundial','Uma festa','Um torneio','Um prémio'), 0),
        ('Que civilização construiu Machu Picchu?', jsonb_build_array('Os incas','Os romanos','Os gregos','Os egípcios'), 0),
        ('Quem foi Viriato?', jsonb_build_array('Um líder lusitano','Um rei francês','Um navegador','Um Papa'), 0),
        ('O que era o império romano?', jsonb_build_array('Um grande império antigo','Uma escola','Uma cidade moderna','Um planeta'), 0)
      ) AS t(question, options, correct_answer)
    LOOP
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer)
      VALUES ('historia', y, rec.question, rec.options, rec.correct_answer)
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;

    -- ===== GEOGRAFIA =====
    FOR rec IN
      SELECT * FROM (VALUES
        ('Qual é a capital de Portugal?', jsonb_build_array('Porto','Lisboa','Braga','Faro'), 1),
        ('Qual é o maior oceano do mundo?', jsonb_build_array('Atlântico','Pacífico','Índico','Ártico'), 1),
        ('Quantos continentes existem?', jsonb_build_array('5','6','7','8'), 2),
        ('Em que continente fica Portugal?', jsonb_build_array('Ásia','Europa','África','América'), 1),
        ('Qual é o rio mais longo de Portugal?', jsonb_build_array('Tejo','Douro','Mondego','Sado'), 0),
        ('Qual é a maior cidade do norte de Portugal?', jsonb_build_array('Braga','Porto','Guimarães','Viana'), 1),
        ('O que é um mapa?', jsonb_build_array('Desenho da Terra','Livro de contos','Instrumento musical','Brinquedo'), 0),
        ('Que instrumento indica o norte?', jsonb_build_array('Bússola','Régua','Relógio','Termómetro'), 0),
        ('Qual é a montanha mais alta de Portugal continental?', jsonb_build_array('Serra da Estrela','Everest','Mont Blanc','Kilimanjaro'), 0),
        ('Quais são as regiões autónomas de Portugal?', jsonb_build_array('Madeira e Açores','Algarve e Alentejo','Porto e Lisboa','Norte e Sul'), 0),
        ('Onde fica a sede da Comissão Europeia?', jsonb_build_array('Bruxelas','Paris','Londres','Roma'), 0),
        ('O que é um deserto?', jsonb_build_array('Lugar com pouca chuva','Lugar com muita água','Uma floresta','Uma montanha'), 0),
        ('Que mar banha Portugal a oeste?', jsonb_build_array('Mediterrâneo','Atlântico','Báltico','Morto'), 1),
        ('Qual é o rio mais longo do mundo?', jsonb_build_array('Nilo','Amazonas','Tejo','Douro'), 0),
        ('Em que continente fica o deserto do Saara?', jsonb_build_array('África','Europa','Ásia','Oceania'), 0),
        ('Qual é o país mais povoado do mundo?', jsonb_build_array('Índia','Portugal','Brasil','Canadá'), 0),
        ('O que é uma fronteira?', jsonb_build_array('Linha que separa países','Um rio','Uma montanha','Um jogo'), 0),
        ('Qual destes países fala português?', jsonb_build_array('Brasil','França','Alemanha','Japão'), 0),
        ('Quantos distritos tem Portugal continental?', jsonb_build_array('18','10','25','7'), 0),
        ('Qual é a capital de Espanha?', jsonb_build_array('Madrid','Barcelona','Lisboa','Sevilha'), 0),
        ('Onde fica o Monte Everest?', jsonb_build_array('Himalaia','Andes','Alpes','Pirinéus'), 0),
        ('Qual é o maior país do mundo?', jsonb_build_array('Rússia','China','Canadá','Brasil'), 0),
        ('Portugal faz fronteira com que país?', jsonb_build_array('Espanha','França','Itália','Marrocos'), 0),
        ('O que é a Roda dos Ventos?', jsonb_build_array('Símbolo da navegação','Um instrumento de medição','Uma cidade','Uma moeda'), 0)
      ) AS t(question, options, correct_answer)
    LOOP
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer)
      VALUES ('geografia', y, rec.question, rec.options, rec.correct_answer)
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;

    -- ===== CIÊNCIAS =====
    FOR rec IN
      SELECT * FROM (VALUES
        ('Qual é o planeta onde vivemos?', jsonb_build_array('Marte','Terra','Vénus','Júpiter'), 1),
        ('O que as plantas libertam para o ar?', jsonb_build_array('Oxigénio','Fumo','Azoto','Vapor'), 0),
        ('Quantas patas tem um inseto?', jsonb_build_array('6','8','4','10'), 0),
        ('O que é a fotossíntese?', jsonb_build_array('Plantas fazerem alimento com luz','Animais dormirem','Chuva cair','Rochas derreterem'), 0),
        ('Qual é o estado da água no gelo?', jsonb_build_array('Sólido','Líquido','Gás','Plasma'), 0),
        ('O coração tem quantas cavidades?', jsonb_build_array('2','3','4','5'), 2),
        ('Qual é o maior órgão do corpo humano?', jsonb_build_array('Coração','Pele','Fígado','Pulmão'), 1),
        ('O que é a gravidade?', jsonb_build_array('Força que atrai os corpos','Um tipo de vento','Uma cor','Um som'), 0),
        ('Como se chama a passagem de água a vapor?', jsonb_build_array('Evaporação','Congelação','Fusão','Solidificação'), 0),
        ('Os ossos servem para:', jsonb_build_array('Sustentar o corpo','Digerir comida','Respirar','Pensar'), 0),
        ('O que é um mamífero?', jsonb_build_array('Animal que amamenta','Peixe','Inseto','Réptil'), 0),
        ('Qual destes é um planeta do sistema solar?', jsonb_build_array('Saturno','Lua','Sol','Órion'), 0),
        ('O que produz o trovão?', jsonb_build_array('Som','Luz','Cheiro','Calor'), 0),
        ('De que cor é o sangue das pessoas?', jsonb_build_array('Vermelho','Azul','Verde','Amarelo'), 0),
        ('O que é a água destilada?', jsonb_build_array('Água purificada','Água do mar','Água com açúcar','Água com sal'), 0),
        ('Que gás respiramos para viver?', jsonb_build_array('Oxigénio','Hidrogénio','Hélio','Metano'), 0),
        ('Qual é o astro que dá luz ao dia?', jsonb_build_array('O Sol','A Lua','Vénus','Marte'), 0),
        ('O que é um vertebrado?', jsonb_build_array('Animal com espinha','Animal sem espinha','Planta','Mineral'), 0),
        ('O que acontece ao corpo sem água?', jsonb_build_array('Desidratação','Crescimento','Alegria','Sonolência'), 0),
        ('O que é a energia solar?', jsonb_build_array('Energia do Sol','Energia do vento','Energia da água','Energia do carvão'), 0),
        ('Quantos sentidos temos?', jsonb_build_array('3','4','5','6'), 2),
        ('O que estudam os astrónomos?', jsonb_build_array('O espaço','Os peixes','As plantas','Os carros'), 0),
        ('O que é a célula?', jsonb_build_array('Unidade da vida','Uma moeda','Uma casa','Um planeta'), 0),
        ('O som viaja mais rápido em:', jsonb_build_array('Sólidos','Vácuo','Ar','Nada'), 0),
        ('Qual é a fórmula química da água?', jsonb_build_array('H2O','CO2','O2','NaCl'), 0)
      ) AS t(question, options, correct_answer)
    LOOP
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer)
      SELECT 'ciencias', y, rec.question, rec.options, rec.correct_answer
      WHERE NOT EXISTS (
        SELECT 1 FROM quiz_questions WHERE subject='ciencias' AND school_year=y AND question=rec.question
      );
    END LOOP;

    -- ===== INGLÊS =====
    FOR rec IN
      SELECT * FROM (VALUES
        ('How do you say "casa" in English?', jsonb_build_array('House','Horse','Hat','Hand'), 0),
        ('What is the color of the sky?', jsonb_build_array('Blue','Red','Green','Black'), 0),
        ('How do you say "gato" in English?', jsonb_build_array('Dog','Cat','Cow','Bird'), 1),
        ('What is 1 + 1 in English?', jsonb_build_array('One','Two','Three','Four'), 1),
        ('How do you say "cão" in English?', jsonb_build_array('Cat','Dog','Bird','Fish'), 1),
        ('What color is the grass?', jsonb_build_array('Blue','Red','Green','Yellow'), 2),
        ('How do you say "livro" in English?', jsonb_build_array('Book','Bag','Box','Bed'), 0),
        ('What is "verde" in English?', jsonb_build_array('Green','Grey','Gold','Grape'), 0),
        ('How do you say "mãe" in English?', jsonb_build_array('Mother','Father','Sister','Brother'), 0),
        ('How do you say "pai" in English?', jsonb_build_array('Mother','Father','Sister','Brother'), 1),
        ('What is "árvore" in English?', jsonb_build_array('Tree','Three','Table','Train'), 0),
        ('How do you say "escola" in English?', jsonb_build_array('School','Shop','School bus','Street'), 0),
        ('What is "amarelo" in English?', jsonb_build_array('Yellow','Yell','Yolk','Yes'), 0),
        ('How do you say "água" in English?', jsonb_build_array('Water','Wine','Milk','Wind'), 0),
        ('How do you say "pão" in English?', jsonb_build_array('Bread','Bird','Bed','Bee'), 0),
        ('What is the opposite of "day"?', jsonb_build_array('Night','Light','Sun','Morning'), 0),
        ('What do you call a baby dog?', jsonb_build_array('Puppy','Kitten','Calf','Chick'), 0),
        ('How many days are in a week?', jsonb_build_array('5','6','7','8'), 2),
        ('How do you say "obrigado" in English?', jsonb_build_array('Thank you','Please','Sorry','Hello'), 0),
        ('What is "vermelho" in English?', jsonb_build_array('Red','Rat','Roof','Run'), 0),
        ('How do you say "sorriso" in English?', jsonb_build_array('Smile','Small','Smart','Smoke'), 0),
        ('What is "cinco" in English?', jsonb_build_array('Five','Four','Six','Seven'), 0),
        ('How do you say "feliz" in English?', jsonb_build_array('Happy','Hungry','Heavy','Hurry'), 0),
        ('What is the plural of "child"?', jsonb_build_array('Children','Childs','Childes','Childrens'), 0),
        ('How do you say "professor" in English?', jsonb_build_array('Teacher','Doctor','Farmer','Pilot'), 0)
      ) AS t(question, options, correct_answer)
    LOOP
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer)
      VALUES ('ingles', y, rec.question, rec.options, rec.correct_answer)
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
