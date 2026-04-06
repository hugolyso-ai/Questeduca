import React from 'react';
import { Link } from 'react-router-dom';
import { Castle, ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
            Política de Privacidade
          </h1>
          
          <div className="prose prose-slate max-w-none space-y-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <p className="text-slate-600">
              <strong>Última atualização:</strong> Março 2025
            </p>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Introdução</h2>
              <p className="text-slate-600 leading-relaxed">
                O QUESTEDUCA ("nós", "nosso" ou "plataforma") está comprometido em proteger a privacidade 
                dos nossos utilizadores, especialmente das crianças que utilizam a nossa plataforma educativa.
                Esta Política de Privacidade explica como recolhemos, utilizamos e protegemos as informações pessoais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Informações que Recolhemos</h2>
              <p className="text-slate-600 leading-relaxed mb-4">Recolhemos as seguintes categorias de informações:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Dados de Registo:</strong> Nome, email, palavra-passe (encriptada), tipo de conta</li>
                <li><strong>Dados de Estudantes:</strong> Alcunha, ano escolar, escola, distrito</li>
                <li><strong>Dados de Utilização:</strong> Progresso no jogo, respostas a quizzes, conquistas</li>
                <li><strong>Dados de Pagamento:</strong> Processados de forma segura através do Stripe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Como Utilizamos as Informações</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Fornecer e melhorar os nossos serviços educativos</li>
                <li>Personalizar a experiência de aprendizagem</li>
                <li>Permitir que os pais acompanhem o progresso dos filhos</li>
                <li>Gerar relatórios de desempenho</li>
                <li>Processar pagamentos de subscrições</li>
                <li>Comunicar atualizações importantes sobre o serviço</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Proteção de Menores</h2>
              <p className="text-slate-600 leading-relaxed">
                O QUESTEDUCA foi concebido para ser utilizado por crianças do 1º ao 9º ano do ensino básico.
                Implementamos medidas especiais para proteger os menores:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
                <li>As contas de estudantes são criadas e geridas pelos pais</li>
                <li>Os pedidos de amizade requerem aprovação parental</li>
                <li>Não recolhemos mais informações do que as necessárias</li>
                <li>Os dados dos menores nunca são vendidos a terceiros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Partilha de Informações</h2>
              <p className="text-slate-600 leading-relaxed">
                Não vendemos nem partilhamos dados pessoais com terceiros para fins de marketing.
                Podemos partilhar informações com:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
                <li><strong>Stripe:</strong> Para processamento de pagamentos</li>
                <li><strong>Prestadores de serviços:</strong> Que nos ajudam a operar a plataforma</li>
                <li><strong>Autoridades:</strong> Quando legalmente obrigados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Segurança dos Dados</h2>
              <p className="text-slate-600 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger os dados:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
                <li>Encriptação de palavras-passe</li>
                <li>Ligações HTTPS seguras</li>
                <li>Acesso restrito aos dados</li>
                <li>Backups regulares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">7. Direitos dos Utilizadores</h2>
              <p className="text-slate-600 leading-relaxed">
                De acordo com o RGPD, tem direito a:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
                <li>Aceder aos seus dados pessoais</li>
                <li>Retificar dados incorretos</li>
                <li>Eliminar a sua conta e dados</li>
                <li>Exportar os seus dados</li>
                <li>Retirar o consentimento a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">8. Cookies</h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizamos cookies essenciais para o funcionamento da plataforma, incluindo:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
                <li>Cookies de sessão para manter o login</li>
                <li>Cookies de preferências (ex: modo escuro, acessibilidade)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">9. Contacto</h2>
              <p className="text-slate-600 leading-relaxed">
                Para questões sobre privacidade, contacte-nos através de:
              </p>
              <p className="text-slate-600 mt-4">
                <strong>Email:</strong> privacidade@questeduca.pt<br />
                <strong>Morada:</strong> Portugal
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">10. Alterações a Esta Política</h2>
              <p className="text-slate-600 leading-relaxed">
                Podemos atualizar esta política periodicamente. Notificaremos os utilizadores sobre 
                alterações significativas através de email ou aviso na plataforma.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
