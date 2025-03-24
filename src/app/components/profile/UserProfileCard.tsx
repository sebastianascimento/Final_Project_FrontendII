"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import { Camera, Check, X } from 'lucide-react';

interface UserProfileCardProps {
  editable?: boolean;
}

// Define the type for our user based on the error message
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  hasCompany: boolean;
  companyId: string;
  companyName: string;
  // These optional properties might not exist in your user object
  role?: string;
  createdAt?: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ editable = false }) => {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  
  const handleSave = () => {
    // Here you would normally implement API calls to save changes
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    // Reset to original values
    setName(user?.name || "");
    setEmail(user?.email || "");
    setIsEditing(false);
  };
  
  // Current date for "member since" if createdAt is not available
  const formattedDate = new Date("2025-03-21 10:11:16").toLocaleDateString();
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex flex-col items-center md:flex-row md:items-start p-6">
        {/* Profile Image - Responsive container */}
        <div className="relative w-32 h-32 mb-4 md:mb-0 md:mr-6 flex-shrink-0">
          <div className="relative w-full h-full rounded-full overflow-hidden">
            {/* Responsive Image with proper aspect ratio */}
            <Image
              src={user?.image || '/default-avatar.png'}
              alt={`Foto de perfil de ${user?.name || 'usuário'}`}
              fill
              sizes="(max-width: 768px) 128px, 128px"
              className="object-cover"
              priority
            />
          </div>
          
          {/* Camera overlay for image editing */}
          {editable && (
            <button 
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
              aria-label="Alterar foto de perfil"
            >
              <Camera size={16} />
            </button>
          )}
        </div>
        
        {/* User Information */}
        <div className="flex-1 w-full text-center md:text-left">
          {isEditing ? (
            <>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full md:w-3/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full md:w-3/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-center md:justify-start space-x-2 mt-4">
                <button 
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Check size={16} className="mr-1" />
                  Salvar
                </button>
                <button 
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <X size={16} className="mr-1" />
                  Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{user?.name || "Nome do Usuário"}</h2>
              <p className="text-gray-600 mb-2">{user?.email || "email@exemplo.com"}</p>
              
              <p className="text-gray-500 text-sm">
                Membro desde: {formattedDate}
              </p>
              
              {user?.companyName && (
                <p className="text-gray-500 text-sm">
                  Empresa: {user.companyName}
                </p>
              )}
              
              {editable && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
                >
                  Editar Perfil
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Additional user information section */}
      <div className="border-t border-gray-200 px-6 py-4">
        <h3 className="text-lg font-medium mb-2">Informações Adicionais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Função</p>
            <p>{"Usuário Padrão"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="inline-flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Ativo
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Último acesso</p>
            <p>2025-03-21 10:11:16</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ID do usuário</p>
            <p className="text-xs bg-gray-100 px-2 py-1 rounded inline-block">
              {user?.id || "USER123456"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;