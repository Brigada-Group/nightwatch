/**
 * Client-side fallback for the product name. Prefer `usePage().props.name`
 * (from `config('app.name')`) so the shell matches `.env` without a Vite rebuild.
 */
export const appDisplayName: string =
    (import.meta.env.VITE_APP_NAME as string | undefined) || 'Guardian';
