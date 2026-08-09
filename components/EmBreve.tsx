export function EmBreve({
  icone,
  titulo,
  descricao,
}: {
  icone: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container text-secondary">
        <span className="material-symbols-outlined text-[32px]">{icone}</span>
      </div>
      <h1 className="mt-md font-headline-lg text-headline-lg text-primary">
        {titulo}
      </h1>
      <p className="mt-sm max-w-md text-body-md text-on-surface-variant">
        {descricao}
      </p>
      <span className="mt-md rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
        Chega ao ligar o Supabase
      </span>
    </div>
  );
}
