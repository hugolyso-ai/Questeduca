import React from 'react';

// Prateleira de livros decorativos em perspectiva (CSS 3D)
const DecorShelf = ({ left, width, delay, tilt }) => {
  const books = [];
  const count = 10;
  for (let i = 0; i < count; i++) {
    const h = 40 + ((i * 37) % 30);
    const colors = ['#6b2737', '#274a63', '#3d5a27', '#5a3a5e', '#5d3a1a', '#7a4a1f'];
    books.push(
      <div
        key={i}
        style={{
          width: 10 + ((i * 13) % 8),
          height: h,
          background: `linear-gradient(180deg, ${colors[i % colors.length]}, rgba(0,0,0,0.55))`,
          borderRadius: '2px 2px 0 0',
          boxShadow: 'inset 1px 0 0 rgba(255,215,130,0.35), 2px 0 4px rgba(0,0,0,0.5)',
          transform: i % 6 === 5 ? 'rotate(7deg)' : 'none',
          transformOrigin: 'bottom center',
        }}
      />
    );
  }
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left, width, top: 'auto', bottom: 0, animationDelay: delay }}
    >
      <div className="flex items-end justify-center gap-[3px] px-2" style={{ transform: `perspective(400px) rotateX(${tilt || 0}deg)` }}>
        {books}
      </div>
      {/* Tábua da prateleira */}
      <div
        style={{
          height: 10,
          background: 'linear-gradient(180deg,#8a5a28 0%,#5d3a1a 60%,#3a2410 100%)',
          borderRadius: '0 0 3px 3px',
          boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,120,0.4)',
        }}
      />
    </div>
  );
};

// Lareira/vela com chama animada
const Candle = ({ left, bottom, size = 1 }) => (
  <div className="absolute pointer-events-none" style={{ left, bottom }}>
    <div className="relative">
      <div
        className="rounded-full animate-pulse"
        style={{
          width: 10 * size,
          height: 16 * size,
          background: 'radial-gradient(ellipse at 50% 70%, #fff7cc 0%, #ffb340 45%, rgba(255,120,40,0) 75%)',
          filter: 'blur(1px)',
        }}
      />
      <div
        style={{
          width: 14 * size,
          height: 22 * size,
          margin: '-4px auto 0',
          background: 'linear-gradient(180deg,#e8d5b0,#c9b184)',
          borderRadius: '3px 3px 2px 2px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  </div>
);

// Tapete central em perspectiva
const Carpet = () => (
  <div className="absolute left-1/2 pointer-events-none" style={{ bottom: 0, transform: 'translateX(-50%)' }}>
    <div
      style={{
        width: 'min(46vw, 420px)',
        height: 'min(16vh, 130px)',
        background: 'linear-gradient(180deg, #7a1f2b 0%, #5a1620 100%)',
        clipPath: 'polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)',
        borderRadius: '50% 50% 8px 8px / 22% 22% 4px 4px',
        boxShadow: 'inset 0 0 0 6px rgba(214,174,96,0.35), 0 -2px 14px rgba(0,0,0,0.5)',
        opacity: 0.9,
      }}
    />
  </div>
);

/**
 * Interior de biblioteca antiga simulado em 3D (puro CSS):
 * parede de fundo com estantes em perspectiva, arco de janela,
 * velas, tapete e halo quente de luz.
 * Os livros reais (dos professores) são renderizados por cima,
 * nas prateleiras interativas do painel principal.
 */
const LibraryRoom3D = () => {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      data-testid="library-room-3d"
      aria-hidden="true"
    >
      {/* Parede de fundo em pedra/madeira */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, rgba(255,190,90,0.16), transparent 55%),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 46px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 30px),
            linear-gradient(180deg, #241708 0%, #2e1d0c 55%, #1a1106 100%)`,
        }}
      />

      {/* Arco de janela central com luz da manhã */}
      <div
        className="absolute left-1/2"
        style={{
          top: '4%',
          transform: 'translateX(-50%)',
          width: 'min(22vw, 240px)',
          height: 'min(40vh, 330px)',
          background: 'linear-gradient(180deg, rgba(255,214,140,0.5) 0%, rgba(255,180,90,0.22) 55%, rgba(255,160,60,0.05) 100%)',
          borderRadius: '50% 50% 6px 6px / 38% 38% 4px 4px',
          border: '6px solid #4a2e12',
          boxShadow: '0 0 80px 30px rgba(255,180,80,0.18), inset 0 0 40px rgba(255,220,150,0.35)',
          opacity: 0.85,
        }}
      >
        {/* Caulice / divisórias da janela */}
        <div className="absolute inset-y-0 left-1/2 w-[4px] -translate-x-1/2" style={{ background: '#4a2e12' }} />
        <div className="absolute inset-x-0 top-1/3 h-[4px]" style={{ background: '#4a2e12' }} />
        <div className="absolute inset-x-0 top-2/3 h-[4px]" style={{ background: '#4a2e12' }} />
      </div>

      {/* Estantes laterais escuras em perspectiva (decoração) */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: '16%',
          background: 'linear-gradient(90deg, rgba(20,12,4,0.95) 0%, rgba(43,28,12,0.75) 70%, transparent 100%)',
          transform: 'perspective(600px) rotateY(28deg)',
          transformOrigin: 'left center',
        }}
      />
      <div
        className="absolute right-0 top-0 bottom-0"
        style={{
          width: '16%',
          background: 'linear-gradient(270deg, rgba(20,12,4,0.95) 0%, rgba(43,28,12,0.75) 70%, transparent 100%)',
          transform: 'perspective(600px) rotateY(-28deg)',
          transformOrigin: 'right center',
        }}
      />

      {/* Prateleiras decorativas com livros, sobre o arco */}
      <div className="absolute inset-x-0 bottom-0 top-0">
        <div className="absolute left-[4%] w-[13%] bottom-[16%]"><DecorShelf left={0} width="100%" delay="0s" tilt={4} /></div>
        <div className="absolute left-[4%] w-[13%] bottom-[44%]"><DecorShelf left={0} width="100%" delay="0.4s" tilt={4} /></div>
        <div className="absolute right-[4%] w-[13%] bottom-[16%]"><DecorShelf left={0} width="100%" delay="0.8s" tilt={4} /></div>
        <div className="absolute right-[4%] w-[13%] bottom-[44%]"><DecorShelf left={0} width="100%" delay="1.2s" tilt={4} /></div>
      </div>

      {/* Halo quente geral + chão */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '18%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(90,58,26,0.5) 100%)',
        }}
      />
      <Carpet />

      {/* Velas de mesa */}
      <Candle left="20%" bottom="10%" size={1.1} />
      <Candle left="78%" bottom="10%" size={1.1} />

      {/* Vinheta escura nas bordas */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 160px rgba(0,0,0,0.85), inset 0 0 50px rgba(255,170,60,0.07)' }}
      />
    </div>
  );
};

export default LibraryRoom3D;
