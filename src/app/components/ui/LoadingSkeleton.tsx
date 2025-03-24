// Componente reutilizável para estados de carregamento
interface LoadingSkeletonProps {
    rows?: number;
    columns?: number;
    className?: string;
  }
  
  export default function LoadingSkeleton({ 
    rows = 5, 
    columns = 6,
    className = ""
  }: LoadingSkeletonProps) {
    return (
      <div className={`animate-pulse ${className}`}>
        {/* Cabeçalho da tabela */}
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        
        {/* Linhas da tabela */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-2 mb-3">
            {/* Coluna com imagem + texto (maior) */}
            <div className="w-1/3 h-14 bg-gray-100 rounded flex">
              <div className="h-10 w-10 bg-gray-200 rounded-full m-2"></div>
              <div className="flex flex-col justify-center flex-1 pr-2">
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            
            {/* Colunas restantes */}
            {Array.from({ length: columns - 1 }).map((_, j) => (
              <div 
                key={j} 
                className={`bg-gray-100 rounded h-14 ${j === columns - 2 ? 'w-1/6' : 'w-1/6'} ${j >= 2 ? 'hidden md:block' : ''}`}
              >
                <div className="h-3 bg-gray-200 rounded m-4 w-3/4"></div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }