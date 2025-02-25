import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      <div className="flex justify-center mb-4">
        <Image src={icon} alt={title} width={64} height={64} />
      </div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default FeatureCard;
