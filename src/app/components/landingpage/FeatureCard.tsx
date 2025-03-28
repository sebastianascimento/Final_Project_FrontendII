import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full">
      {/* Seção da imagem no topo */}
      <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
        <Image 
          src={icon} 
          alt={title} 
          fill 
          className="object-cover" 
          priority
        />
      </div>
      
      {/* Seção do texto embaixo */}
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;