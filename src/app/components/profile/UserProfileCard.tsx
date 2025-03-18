"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Edit, Mail, Phone, Calendar, Building, MapPin, Briefcase, Loader } from "lucide-react";

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  joinDate?: Date | string | null;
  location?: string | null;
  bio?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  companyRole?: string | null;
}

interface UserProfileCardProps {
  editable?: boolean;
}

const UserProfileCard = ({ editable = false }: UserProfileCardProps) => {
  const currentDate = "2025-03-15 11:18:00";
  const currentUser = "sebastianascimento";
  
  const { data: session, status } = useSession();
  
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  // Buscar dados do perfil do banco de dados
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (status === "loading") return;
        
        if (status === "unauthenticated") {
          setError("Usuário não autenticado");
          setIsLoading(false);
          return;
        }
        
        console.log(`[${currentDate}] @${currentUser} - Buscando dados do perfil do banco de dados`);
        const response = await fetch('/api/user/profile').catch(err => {
          console.error(`[${currentDate}] @${currentUser} - Erro na requisição:`, err);
          return null;
        });
        
        // Se a API não estiver disponível, usar dados da sessão como fallback
        if (!response) {
          console.log(`[${currentDate}] @${currentUser} - API não disponível, usando dados da sessão como fallback`);
          setIsUsingFallback(true);
          setProfileData({
            id: session?.user?.id || "",
            name: session?.user?.name || "Usuário",
            email: session?.user?.email || "",
            image: session?.user?.image || "/noAvatar.png",
            companyId: session?.user?.companyId,
            companyName: session?.user?.companyName,
          });
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          // Se for 404, usar fallback em vez de mostrar erro
          if (response.status === 404) {
            console.log(`[${currentDate}] @${currentUser} - API retornou 404, usando dados da sessão como fallback`);
            setIsUsingFallback(true);
            setProfileData({
              id: session?.user?.id || "",
              name: session?.user?.name || "Usuário",
              email: session?.user?.email || "",
              image: session?.user?.image || "/noAvatar.png",
              companyId: session?.user?.companyId,
              companyName: session?.user?.companyName,
            });
            setIsLoading(false);
            return;
          }
          
          throw new Error(`Erro ao buscar perfil: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[${currentDate}] @${currentUser} - Dados do perfil recebidos:`, data);
        setProfileData(data);
        setIsUsingFallback(false);
      } catch (err) {
        console.error(`[${currentDate}] @${currentUser} - Erro:`, err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        
        // Mesmo com erro, tentar usar fallback
        setIsUsingFallback(true);
        setProfileData({
          id: session?.user?.id || "",
          name: session?.user?.name || "Usuário",
          email: session?.user?.email || "",
          image: session?.user?.image || "/noAvatar.png",
          companyId: session?.user?.companyId,
          companyName: session?.user?.companyName,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [status, currentDate, currentUser, session?.user]);
  
  // Determinar se o usuário pode editar o perfil
  const canEdit = editable || (session?.user?.id === profileData?.id);
  
  // Formatar data de ingresso se disponível
  const formattedJoinDate = profileData?.joinDate 
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(profileData.joinDate))
    : null;
  
  // Mostrar estado de carregamento
  if (isLoading) {
    return (
      <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">Carregando dados do perfil...</p>
        </div>
      </div>
    );
  }
  
  // Se não temos dados de perfil nem fallback, mostrar erro
  if (!profileData && error) {
    return (
      <div className="bg-red-50 py-6 px-4 rounded-md flex-1">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-1">Erro ao carregar perfil</h3>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  // Se chegamos aqui, temos dados de perfil (da API ou fallback)
  const user = profileData!;

  return (
    <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
      {/* SEÇÃO DA IMAGEM */}
      <div className="w-1/3">
        <div className="relative">
          <Image
            src={user.image || "/noAvatar.png"}
            alt={`Foto de perfil de ${user.name}`}
            width={144}
            height={144}
            className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-md"
          />
          {canEdit && (
            <button 
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              aria-label="Editar foto de perfil"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
      </div>
      
      {/* SEÇÃO DE INFORMAÇÕES */}
      <div className="w-2/3 flex flex-col justify-between gap-4">
        {/* Nome e botão de edição */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{user.name}</h1>
          <div className="flex items-center gap-2">
            {isUsingFallback && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                Dados básicos
              </span>
            )}
            {canEdit && (
              <button 
                className="text-xs bg-white px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Editar informações do perfil"
              >
                Editar Perfil
              </button>
            )}
          </div>
        </div>
        
        {/* Cargo da empresa (se disponível) */}
        {(user.position || user.companyRole) && (
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Briefcase size={16} className="text-blue-500" />
            <span>{user.position || user.companyRole}</span>
            
            {user.department && (
              <span className="text-gray-500">• {user.department}</span>
            )}
          </div>
        )}
        
        {/* Bio/Descrição */}
        <p className="text-sm text-gray-500">
          {user.bio || `Membro da equipe desde ${formattedJoinDate || "recentemente"}.`}
        </p>
        
        {/* Informações de contato e dados pessoais */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
          {/* Email */}
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Mail size={14} className="text-gray-500" />
            <span>{user.email || "-"}</span>
          </div>
          
          {/* Telefone */}
          <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
            <Phone size={14} className="text-gray-500" />
            <span>{user.phone || "-"}</span>
          </div>
          
          {/* Data de ingresso */}
          {formattedJoinDate && (
            <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
              <Calendar size={14} className="text-gray-500" />
              <span>Desde {formattedJoinDate}</span>
            </div>
          )}
          
          {/* Localização */}
          {user.location && (
            <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
              <MapPin size={14} className="text-gray-500" />
              <span>{user.location}</span>
            </div>
          )}
          
          {/* Empresa (apenas se multi-tenant) */}
          {user.companyName && (
            <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2 bg-blue-50 px-1.5 py-0.5 rounded">
              <Building size={14} className="text-blue-500" />
              <span className="text-blue-700">{user.companyName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;