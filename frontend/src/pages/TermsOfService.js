import React from 'react';
import { Link } from 'react-router-dom';
import { Castle, ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Castle className="h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              QUESTEDUCA
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft size={20} />
            Voltar
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Termos de Serviço
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <p className="text-slate-600">
              <strong>Última atualização:</strong> Março 2025
            </p>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-slate-600 leading-relaxed">
                Ao aceder e utilizar o QUESTEDUCA, concorda com estes Termos de Serviço. 
                Se não concordar com alguma parte destes termos, não deverá utilizar a plataforma.
                A utilização por menores deve ser autorizada e supervisionada pelos pais ou responsáveis legais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Descrição do Serviço</h2>
              <p className="text-slate-600 leading-relaxed">
                O QUESTEDUCA é uma plataforma educativa gamificada destinada a alunos do 1º ao 9º ano 
                do ensino básico português. O serviço inclui:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
                <li>Quizzes educativos baseados no currículo nacional</li>
                <li>Sistema de construção de cidade virtual</li>
                <li>Rankings e competições entre alunos</li>
                <li>Acompanhamento parental do progresso</li>
                <li>Relatórios de desempenho</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Contas de Utilizador</h2>
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">3.1 Tipos de Conta</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Conta de Pai/Mãe:</strong> Para adultos que gerem contas de filhos</li>
                <li><strong>Conta de Estudante:</strong> Criada pelos pais para os filhos</li>
                <li><strong>Conta de Associação:</strong> Para escolas e associações de pais</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">3.2 Responsabilidades</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Manter as credenciais de acesso seguras</li>
                <li>Fornecer informações verdadeiras no registo</li>
                <li>Supervisionar a utilização por menores</li>
                <li>Notificar-nos de acessos não autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Subscrições e Pagamentos</h2>
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">4.1 Planos</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Gratuito:</strong> Acesso básico com limitações</li>
                <li><strong>Premium Individual:</strong> €1.99/mês ou €21.49/ano</li>
                <li><strong>Premium Família:</strong> €4.99/mês ou €53.89/ano (até 4 filhos)</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">4.2 Renovação e Cancelamento</h3>
              <p className="text-slate-600 leading-relaxed">
                As subscrições renovam automaticamente. Pode cancelar a qualquer momento através 
                das definições da conta. O cancelamento entra em vigor no final do período de faturação atual.
              </p>
              
              <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-3">4.3 Reembolsos</h3>
              <p className="text-slate-600 leading-relaxed">
                Oferecemos reembolso total nos primeiros 14 dias após a compra, conforme a legislação 
                europeia de proteção do consumidor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Conduta do Utilizador</h2>
              <p className="text-slate-600 leading-relaxed mb-4">Ao utilizar o QUESTEDUCA, concorda em não:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Partilhar conteúdo ofensivo, abusivo ou ilegal</li>
                <li>Fazer batota ou manipular os rankings</li>
                <li>Criar múltiplas contas para obter vantagem</li>
                <li>Tentar aceder a dados de outros utilizadores</li>
                <li>Utilizar a plataforma para fins não educativos</li>
                <li>Fazer engenharia reversa ou copiar o nosso software</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Propriedade Intelectual</h2>
              <p className="text-slate-600 leading-relaxed">
                Todo o conteúdo do QUESTEDUCA, incluindo mas não limitado a texto, gráficos, 
                logótipos, ícones, imagens, clips de áudio e software, é propriedade do QUESTEDUCA 
                ou dos seus licenciadores e está protegido por leis de direitos de autor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">7. Conteúdo Educativo</h2>
              <p className="text-slate-600 leading-relaxed">
                O conteúdo educativo é baseado no currículo oficial do Ministério da Educação português.
                No entanto, o QUESTEDUCA é um complemento educativo e não substitui o ensino formal.
                Não garantimos que o conteúdo esteja sempre atualizado com as últimas alterações curriculares.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">8. Limitação de Responsabilidade</h2>
              <p className="text-slate-600 leading-relaxed">
                O QUESTEDUCA é fornecido "como está". Não garantimos que o serviço seja ininterrupto 
                ou livre de erros. Na máxima extensão permitida por lei, não seremos responsáveis por 
                danos indiretos, incidentais ou consequenciais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">9. Suspensão e Terminação</h2>
              <p className="text-slate-600 leading-relaxed">
                Reservamo-nos o direito de suspender ou terminar contas que violem estes termos, 
                sem aviso prévio. Em caso de terminação por violação, não haverá direito a reembolso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">10. Alterações aos Termos</h2>
              <p className="text-slate-600 leading-relaxed">
                Podemos atualizar estes termos periodicamente. Notificaremos os utilizadores sobre 
                alterações significativas com pelo menos 30 dias de antecedência. A continuação do 
                uso após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">11. Lei Aplicável</h2>
              <p className="text-slate-600 leading-relaxed">
                Estes termos são regidos pela lei portuguesa. Qualquer litígio será submetido aos 
                tribunais portugueses competentes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">12. Contacto</h2>
              <p className="text-slate-600 leading-relaxed">
                Para questões sobre estes termos, contacte-nos através de:
              </p>
              <p className="text-slate-600 mt-4">
                <strong>Email:</strong> suporte@questeduca.pt<br />
                <strong>Morada:</strong> Portugal
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
