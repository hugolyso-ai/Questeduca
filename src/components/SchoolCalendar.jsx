import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Trophy, Target, Star, Bell } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Portuguese School Holidays - Auto-updating based on school year
const getSchoolHolidays = (year) => {
  // Calculate school year: if current month >= September, it's year/year+1, else year-1/year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const startYear = currentMonth >= 8 ? year : year - 1;
  const endYear = startYear + 1;

  return [
    // 1º Período (September - December)
    { date: `${startYear}-09-01`, name: 'Início do Ano Letivo', type: 'school', icon: '📚' },
    { date: `${startYear}-10-05`, name: 'Implantação da República', type: 'holiday', icon: '🇵🇹' },
    { date: `${startYear}-11-01`, name: 'Dia de Todos os Santos', type: 'holiday', icon: '🕯️' },
    { date: `${startYear}-12-01`, name: 'Restauração da Independência', type: 'holiday', icon: '🇵🇹' },
    { date: `${startYear}-12-08`, name: 'Imaculada Conceição', type: 'holiday', icon: '✨' },
    { date: `${startYear}-12-18`, name: 'Férias de Natal (Início)', type: 'vacation', icon: '🎄' },
    { date: `${startYear}-12-25`, name: 'Natal', type: 'holiday', icon: '🎅' },

    // 2º Período (January - March/April)
    { date: `${endYear}-01-01`, name: 'Ano Novo', type: 'holiday', icon: '🎆' },
    { date: `${endYear}-01-03`, name: 'Regresso às Aulas', type: 'school', icon: '📖' },
    // Carnaval varies each year - approximating
    { date: `${endYear}-02-28`, name: 'Carnaval', type: 'holiday', icon: '🎭' },
    { date: `${endYear}-03-24`, name: 'Férias da Páscoa (Início)', type: 'vacation', icon: '🐣' },

    // 3º Período (April - June)
    { date: `${endYear}-04-07`, name: 'Regresso às Aulas', type: 'school', icon: '📖' },
    { date: `${endYear}-04-25`, name: 'Dia da Liberdade', type: 'holiday', icon: '🌹' },
    { date: `${endYear}-05-01`, name: 'Dia do Trabalhador', type: 'holiday', icon: '💪' },
    { date: `${endYear}-06-10`, name: 'Dia de Portugal', type: 'holiday', icon: '🇵🇹' },
    { date: `${endYear}-06-13`, name: 'Santo António (Lisboa)', type: 'holiday', icon: '🎉' },
    { date: `${endYear}-06-20`, name: 'Fim do Ano Letivo', type: 'school', icon: '🎓' },
    // Summer vacation
    { date: `${endYear}-06-21`, name: 'Férias de Verão', type: 'vacation', icon: '☀️' },
  ];
};

// Generate dynamic events based on current week/month
const getQuestEducaEvents = (year, month) => {
  const events = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Weekly challenge days (every Monday)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 1) { // Monday
      events.push({
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        name: 'Novos Desafios Semanais',
        type: 'challenge',
        icon: '🎯'
      });
    }
  }

  // Monthly league end (last day of month)
  events.push({
    date: `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`,
    name: 'Fim da Liga Mensal',
    type: 'league',
    icon: '🏆'
  });

  // Monthly league start (first day of month)
  events.push({
    date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    name: 'Início da Nova Liga',
    type: 'league',
    icon: '🚀'
  });

  return events;
};

const SchoolCalendar = ({ schoolYear, userRole = 'student' }) => {
  const { settings } = useAccessibility();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [challengesDone, setChallengesDone] = useState(0);
  const [leaguePosition, setLeaguePosition] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [teacherEvents, setTeacherEvents] = useState([]);

  // Busca eventos agendados por professores para este aluno
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('teacher_events')
          .select('id, title, event_type, event_date')
          .eq('student_id', user.id)
          .order('event_date', { ascending: true });
        setTeacherEvents((data || []).map(ev => ({
          id: ev.id,
          date: ev.event_date,
          name: ev.title,
          type: ev.event_type === 'test' ? 'teacher-test' : 'teacher-event',
          icon: ev.event_type === 'test' ? '📝' : '📚',
        })));
      } catch {
        setTeacherEvents([]);
      }
    };
    load();
  }, [user]);

  const holidays = getSchoolHolidays(year);
  const questEvents = getQuestEducaEvents(year, month);
  const allEvents = [...holidays, ...questEvents, ...teacherEvents];

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch weekly challenge progress (count completed)
        const { data: challengeProgress, error: chalError } = await supabase
          .from('weekly_challenge_progress')
          .select('challenge_id, current, claimed')
          .eq('user_id', user.id);

        if (!chalError && challengeProgress) {
          // Fetch challenge definitions to know targets
          const { data: challengeDefs } = await supabase
            .from('weekly_challenges')
            .select('id, target');

          const defMap = {};
          (challengeDefs || []).forEach(d => { defMap[d.id] = d.target; });

          const completed = challengeProgress.filter(p =>
            p.current >= (defMap[p.challenge_id] || 0)
          ).length;
          setChallengesDone(completed);
        }

        // Fetch league position (rank by XP)
        const { data: gameState, error: gsError } = await supabase
          .from('game_states')
          .select('user_id, xp')
          .order('xp', { ascending: false });

        if (!gsError && gameState) {
          const position = gameState.findIndex(g => g.user_id === user.id);
          setLeaguePosition(position >= 0 ? position + 1 : null);
        }
      } catch (err) {
        console.log('Could not fetch calendar data');
      }
    };
    fetchData();
  }, [user]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
    setSelectedDate(null);
  };

  const formatDateKey = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDay = (day) => {
    const dateKey = formatDateKey(day);
    return allEvents.filter(e => e.date === dateKey);
  };

  const getEventTypeColor = (type) => {
    switch(type) {
      case 'holiday': return 'bg-red-100 text-red-700 border-red-300';
      case 'vacation': return 'bg-[hsl(142,45%,88%)] text-green-700 border-green-300';
      case 'school': return 'bg-[hsl(200,55%,88%)] text-blue-700 border-blue-300';
      case 'challenge': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'league': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'teacher-test': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
      case 'teacher-event': return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getEventDotColor = (type) => {
    switch(type) {
      case 'holiday': return 'bg-red-500';
      case 'vacation': return 'bg-[hsl(35,92%,50%)]';
      case 'school': return 'bg-[hsl(35,92%,50%)]';
      case 'challenge': return 'bg-purple-500';
      case 'league': return 'bg-amber-500';
      case 'teacher-test': return 'bg-cyan-500';
      case 'teacher-event': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const today = new Date();
    const isToday = (day) =>
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const events = getEventsForDay(day);
      const hasEvents = events.length > 0;
      const isSelected = selectedDate === day;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(day)}
          className={`h-12 rounded-lg flex flex-col items-center justify-center relative transition ${
            isToday(day)
              ? 'bg-purple-500 text-white font-bold'
              : isSelected
                ? 'bg-purple-100 text-purple-700 font-semibold'
                : settings.darkMode
                  ? 'hover:bg-slate-600 text-slate-200'
                  : 'hover:bg-slate-100'
          }`}
          data-testid={`calendar-day-${day}`}
        >
          <span className="text-sm">{day}</span>
          {hasEvents && (
            <div className="flex gap-0.5 mt-0.5">
              {events.slice(0, 3).map((event, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(event.type)}`}
                />
              ))}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className={`w-full rounded-3xl shadow-xl overflow-hidden ${
      settings.darkMode ? 'bg-slate-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-[hsl(24,70%,42%)] p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
              <Calendar size={28} />
              Calendário Escolar
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Ano Letivo {currentDate.getMonth() >= 8 ? currentDate.getFullYear() : currentDate.getFullYear() - 1}/{currentDate.getMonth() >= 8 ? currentDate.getFullYear() + 1 : currentDate.getFullYear()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`rounded-xl p-4 ${settings.darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Target className="text-white" size={20} />
                </div>
                <div>
                  <p className={`text-xs ${settings.darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                    Desafios Semanais
                  </p>
                  <p className={`font-bold ${settings.darkMode ? 'text-white' : 'text-purple-800'}`}>
                    {challengesDone}/5 Completos
                  </p>
                </div>
              </div>
            </div>
            <div className={`rounded-xl p-4 ${settings.darkMode ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Trophy className="text-white" size={20} />
                </div>
                <div>
                  <p className={`text-xs ${settings.darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                    Liga Mensal
                  </p>
                  <p className={`font-bold ${settings.darkMode ? 'text-white' : 'text-amber-800'}`}>
                    {leaguePosition ? `${leaguePosition}º Lugar` : 'Sem dados'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className={`p-2 rounded-lg transition ${
                settings.darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100'
              }`}
              data-testid="prev-month-btn"
            >
              <ChevronLeft size={24} />
            </button>
            <h3 className={`text-xl font-bold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'Cinzel, serif' }}>
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className={`p-2 rounded-lg transition ${
                settings.darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100'
              }`}
              data-testid="next-month-btn"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className={`rounded-2xl p-4 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div
                  key={day}
                  className={`text-center text-sm font-semibold py-2 ${
                    settings.darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className={`mt-4 rounded-2xl p-4 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <h4 className={`font-bold mb-3 ${settings.darkMode ? 'text-white' : 'text-slate-800'}`}>
                {selectedDate} de {monthNames[month]}
              </h4>
              {selectedEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${getEventTypeColor(event.type)}`}
                    >
                      <span className="text-2xl">{event.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{event.name}</p>
                        <p className="text-xs capitalize opacity-80">{event.type === 'teacher-test' ? 'Teste marcado pelo professor' : event.type === 'teacher-event' ? 'Agendado pelo professor' : event.type === 'challenge' ? 'Desafio QUESTEDUCA' : event.type === 'league' ? 'Liga QUESTEDUCA' : event.type}</p>
                      </div>
                      {(event.type === 'teacher-test' || event.type === 'teacher-event') && (
                        <span className="text-xs font-black bg-white/70 text-slate-700 rounded-full px-2.5 py-1 whitespace-nowrap">
                          {(() => {
                            const days = Math.ceil((new Date(event.date + 'T12:00:00') - new Date()) / 86400000);
                            return days <= 0 ? 'É hoje!' : days === 1 ? 'Amanhã!' : `Faltam ${days} dias`;
                          })()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Nenhum evento neste dia
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          <div className={`mt-4 rounded-2xl p-4 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <h4 className={`font-bold mb-3 text-sm ${settings.darkMode ? 'text-white' : 'text-slate-700'}`}>
              Legenda
            </h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className={`text-xs ${settings.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Feriado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(35,92%,50%)]"></div>
                <span className={`text-xs ${settings.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Férias</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(35,92%,50%)]"></div>
                <span className={`text-xs ${settings.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Escola</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className={`text-xs ${settings.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Desafios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className={`text-xs ${settings.darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Liga</span>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className={`mt-4 rounded-2xl p-4 ${settings.darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
            <h4 className={`font-bold mb-3 flex items-center gap-2 ${settings.darkMode ? 'text-white' : 'text-slate-800'}`}>
              <Bell size={18} />
              Próximos Eventos
            </h4>
            <div className="space-y-2">
              {allEvents
                .filter(e => {
                  const eventDate = new Date(e.date);
                  const today = new Date();
                  return eventDate >= today;
                })
                .slice(0, 5)
                .map((event, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      settings.darkMode ? 'bg-slate-600' : 'bg-white'
                    }`}
                  >
                    <span className="text-xl">{event.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${settings.darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {event.name}
                      </p>
                      <p className={`text-xs ${settings.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(event.date).toLocaleDateString('pt-PT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getEventDotColor(event.type)}`}></div>
                  </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default SchoolCalendar;
