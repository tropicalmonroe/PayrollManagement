import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Advance, Employee } from '@prisma/client'
import { Layout } from '../../components/Layout';
import EmployeeForm from '../../components/EmployeeForm'
import EmployeeList from '../../components/EmployeeList'
import EmployeeDetails from '../../components/EmployeeDetails'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [advances, setAdvances] = useState<Advance[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load employees
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees')
      if (!response.ok) {
        throw new Error('Error loading employees')
      }
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      console.error('Error fetching employees:', error)
      setError('Error loading employees')
    } finally {
      setLoading(false)
    }
  };

  // Load advances
  const fetchAdvances = async () => {
    try {
      const response = await fetch('/api/advances');
      if (response.ok) {
        const data = await response.json();
        setAdvances(data);
      } else {
        throw new Error('Error loading advances');
      }
    } catch (error) {
      console.error('Error loading advances:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAdvances();
  }, [])

  // Add an employee
  const handleAddEmployee = async (employeeData: any) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error adding employee')
      }

      const newEmployee = await response.json()
      setEmployees(prev => [newEmployee, ...prev])
      setShowForm(false)
      setError(null)
    } catch (error: any) {
      console.error('Error adding employee:', error)
      setError(error.message)
      throw error
    }
  }

  // Edit an employee
  const handleEditEmployee = async (employeeData: any) => {
    if (!selectedEmployee) return

    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error updating employee')
      }

      const updatedEmployee = await response.json()
      setEmployees(prev => 
        prev.map(emp => emp.id === selectedEmployee.id ? updatedEmployee : emp)
      )
      setShowForm(false)
      setShowDetails(false)
      setSelectedEmployee(null)
      setIsEditing(false)
      setError(null)
    } catch (error: any) {
      console.error('Error updating employee:', error)
      setError(error.message)
      throw error
    }
  }

  // Delete an employee
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error deleting employee')
      }

      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
      setError(null)
    } catch (error: any) {
      console.error('Error deleting employee:', error)
      setError(error.message)
    }
  }

  // View employee details
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowDetails(true)
  }

  // Edit an employee
  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEditing(true)
    setShowForm(true)
  }

  // Open add form
  const handleAddClick = () => {
    setSelectedEmployee(null)
    setIsEditing(false)
    setShowForm(true)
  }

  // Close modals
  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedEmployee(null)
    setIsEditing(false)
    setError(null)
  }

  const handleCloseDetails = () => {
    setShowDetails(false)
    setSelectedEmployee(null)
  }

  // Switch from details to edit
  const handleEditFromDetails = () => {
    setShowDetails(false)
    setIsEditing(true)
    setShowForm(true)
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Employee Management - AD Capital</title>
          <meta name="description" content="Manage employee information" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Layout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage employee information
                </p>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading employees...</p>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Employee Management - AD Capital</title>
        <meta name="description" content="Manage employee information" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage employee information ({employees.length} employee{employees.length > 1 ? 's' : ''})
              </p>
            </div>
            <button 
              onClick={handleAddClick}
              className="payroll-button"
            >
              Add Employee
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          <EmployeeList
            employees={employees}
            advances={advances}
            onEdit={handleEditClick}
            onDelete={handleDeleteEmployee}
            onView={handleViewEmployee}
          />

          {showForm && (
            <EmployeeForm
              onSubmit={isEditing ? handleEditEmployee : handleAddEmployee}
              onCancel={handleCloseForm}
              initialData={selectedEmployee}
              isEditing={isEditing}
            />
          )}

          {showDetails && selectedEmployee && (
            <EmployeeDetails
              employee={selectedEmployee}
              onClose={handleCloseDetails}
              onEdit={handleEditFromDetails}
            />
          )}
        </div>
      </Layout>
    </>
  )
}
