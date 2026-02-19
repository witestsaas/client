export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-card-foreground">
        {title}
      </h1>
      {children}
    </div>
  );
}
