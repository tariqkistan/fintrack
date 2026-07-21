export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:mt-2">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end [&_button]:min-h-11 [&_button]:flex-1 sm:[&_button]:flex-none">
          {action}
        </div>
      )}
    </div>
  );
}
