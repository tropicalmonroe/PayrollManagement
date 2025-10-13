"use client";
import { useState, useEffect } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';

interface Employee {
  id: string;
  employeeId: string;
  lastName: string;
  firstName: string;
  position: string;
  baseSalary: number;
  idNumber: string;
}

export default function IncomeTaxStatement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [period, setPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear().toString()
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

const handleGenerateStatement = async () => {
  if (selectedEmployees.length === 0) {
    alert('Please select at least one employee');
    return;
  }

  try {
    setGenerating(true);
    
    const response = await fetch('/api/documents/paye-tax-statement/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeIds: selectedEmployees,
        period
      }),
    });

    // Check content type first
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);

    if (response.ok) {
      if (contentType?.includes('application/pdf')) {
        // Download the PDF
        const blob = await response.blob();
        console.log('Blob size:', blob.size, 'type:', blob.type);
        
        if (blob.size === 0) {
          throw new Error('Received empty PDF file');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `paye-tax-statement-${period.month}-${period.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // It's probably a JSON error response
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`);
      }
    } else {
      // Handle non-OK responses
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        alert(`Error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`);
      } catch {
        alert(`Error: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error: any) {
    console.error('Error generating income tax statement:', error);
    alert(`Error generating income tax statement: ${error.message}`);
  } finally {
    setGenerating(false);
  }
};

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
      <div className="p-6 space-y-6 bg-white mt-[2vh] rounded-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-zinc-800">PAYE Tax Statement</h1>
          <p className="text-zinc-400 text-sm w-[20vw]">
            Generate paye tax statements for employees
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Period Configuration
              </h3>
              <p className="text-sm text-zinc-600">
                Select the period for the paye tax statement
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="month" className="block text-sm font-medium text-zinc-700">
                    Month
                  </label>
                  <select
                    id="month"
                    value={period.month.toString()}
                    onChange={(e) => setPeriod(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="payroll-input"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="year" className="block text-sm font-medium text-zinc-700">
                    Year
                  </label>
                  <input
                    id="year"
                    type="number"
                    value={period.year}
                    onChange={(e) => setPeriod(prev => ({ ...prev, year: e.target.value }))}
                    min="2020"
                    max="2030"
                    className="payroll-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Generation
              </h3>
              <p className="text-sm text-zinc-600">
                Generate income tax statement for selected employees
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-zinc-600">
                  {selectedEmployees.length} employee(s) selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllEmployees}
                    disabled={loading}
                    className="payroll-button-secondary text-sm px-3 py-1"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={loading}
                    className="payroll-button-secondary text-sm px-3 py-1"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateStatement}
                disabled={generating || selectedEmployees.length === 0}
                className="flex items-center justify-center cursor-pointer w-full px-4 py-2 text-white hover:text-black bg-purple-500
                            rounded-md hover:bg-blue-200 transition duration-300 ease-in-out"
              >
                {generating ? (
                  <>
                    <div className="spinner mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Income Tax Statement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Employee Selection</h3>
            <p className="text-sm text-zinc-600">
              Select employees to include in the income tax statement
            </p>
          </div>
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner mr-2" />
                Loading employees...
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEmployees.includes(employee.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-zinc-50'
                    }`}
                    onClick={() => toggleEmployeeSelection(employee.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-zinc-600">
                            {employee.employeeId} • {employee.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(employee.baseSalary)}
                          </p>
                          <p className="text-sm text-zinc-600">
                            ID: {employee.idNumber || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}