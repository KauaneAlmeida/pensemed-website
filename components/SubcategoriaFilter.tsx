'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface SubcategoriaFilterProps {
  subcategorias: string[];
  baseUrl: string;
}

export default function SubcategoriaFilter({
  subcategorias,
  baseUrl,
}: SubcategoriaFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subcategoriaAtual = searchParams.get('subcategoria') || '';

  const handleChange = (subcategoria: string) => {
    const params = new URLSearchParams();
    if (subcategoria) {
      params.set('subcategoria', subcategoria);
    }
    params.set('pagina', '1'); // Reset to page 1 on filter change

    const url = subcategoria ? `${baseUrl}?${params.toString()}` : baseUrl;
    router.push(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <label htmlFor="subcategoria-filter" className="font-semibold text-gray-900">
          Filtrar por subcategoria:
        </label>
        <select
          id="subcategoria-filter"
          value={subcategoriaAtual}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 md:flex-initial px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical focus:border-transparent"
        >
          <option value="">Todas as subcategorias</option>
          {subcategorias.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        {subcategoriaAtual && (
          <button
            onClick={() => handleChange('')}
            className="text-sm text-medical hover:text-medical-dark font-semibold flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar filtro
          </button>
        )}
      </div>
    </div>
  );
}
