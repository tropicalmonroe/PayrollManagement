import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../../../components/Layout';
import { SalaryCertificate } from '../../../../components/SalaryCertificate';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  dateEmbauche: string;
  anciennete: number;
  salaireBase: number;
  primeTransport: number;
  indemniteRepresentation: number;
  indemniteLogement: number;
  situationFamiliale: string;
  cin?: string;
  cnss?: string;
}

interface Document {
  id: string;
  type: string;
  employee: Employee;
  metadata: any;
  dateGeneration: string;
}

export default function SalaryCertificateViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les documents et filtrer par ID
      const response = await fetch('/api/documents?type=ATTESTATION_SALAIRE');
      
      if (response.ok) {
        const documents = await response.json();
        const doc = documents.find((d: Document) => d.id === id);
        
        if (doc) {
          setDocument(doc);
        } else {
          setError('Document non trouvé');
        }
      } else {
        setError('Erreur lors du chargement du document');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/documents/salary-certificate');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Chargement de l'attestation...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !document) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
              <p className="text-red-700 mb-4">{error || 'Document non trouvé'}</p>
              <button
                onClick={handleBack}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="print:hidden">
          <button
            onClick={handleBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>

        {/* Composant d'attestation */}
        <SalaryCertificate 
          employee={document.employee} 
          metadata={document.metadata}
          showPrintButton={true}
        />
      </div>
    </Layout>
  );
}
