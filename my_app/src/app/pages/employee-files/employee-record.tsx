import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Users, ArrowLeft, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/router';
import EmployeeList from '../../components/EmployeeList';
import EmployeeForm from '../../components/EmployeeForm';
import EmployeeDetails from '../../components/EmployeeDetails';
import { Employee } from '@prisma/client';

const EmployeeRecordPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger les employés
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        const response = await fetch(`/api/employees/${employeeId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setEmployees(employees.filter(emp => emp.id !== employeeId));
        } else {
          alert('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleFormSubmit = async (employeeData: any) => {
    try {
      const url = isEditing ? `/api/employees/${selectedEmployee?.id}` : '/api/employees';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        const savedEmployee = await response.json();
        
        if (isEditing) {
          setEmployees(employees.map(emp => 
            emp.id === savedEmployee.id ? savedEmployee : emp
          ));
        } else {
          setEmployees([...employees, savedEmployee]);
        }
        
        setShowForm(false);
        setSelectedEmployee(null);
        setIsEditing(false);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEmployee(null);
    setIsEditing(false);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Chargement...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Fiche salarié</h1>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel employé</span>
            </button>
          </div>
          
          <p className="text-gray-600 text-lg">
            Création ou modification du dossier salarié : données personnelles, contrat, salaire, primes, indemnités, échéancier crédit logement.
          </p>
        </div>

        {/* Liste des employés */}
        <EmployeeList
          employees={employees}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />

        {/* Modal pour le formulaire d'employé */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <EmployeeForm
                initialData={selectedEmployee}
                isEditing={isEditing}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
              />
            </div>
          </div>
        )}

        {/* Modal pour les détails de l'employé */}
        {showDetails && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Détails de l'employé</h2>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <EmployeeDetails 
                employee={selectedEmployee} 
                onClose={handleCloseDetails}
                onEdit={() => {
                  handleCloseDetails();
                  handleEdit(selectedEmployee);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeRecordPage;
