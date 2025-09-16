import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method === 'GET') {
    try {
    const { id } = req.query;

    // Retrieve the document from the database.
    const document = await prisma.document.findUnique({
        where: { id: id as string },
        // Also include the related 'employee' information.
        include: {
        employee: true
        }
    });

    // If no document is found, return a 404 Not Found error.
    if (!document) {
        return res.status(404).json({ error: 'Document not found' });
    }

    // Generate the HTML for the salary certificate.
    const html = generateSalaryCertificateHTML(document);

    // Set the response header to indicate that the content is HTML.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    } catch (error) {
    console.error('Error generating salary certificate view:', error);
    res.status(500).json({ error: 'Error while generating the certificate' });
    }
} else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
}
}

// This function generates the HTML content for the salary certificate.
function generateSalaryCertificateHTML(document: any) {
const employee = document.employee;
const metadata = document.metadata as any;

// Helper function to format currency as Kenyan Shillings (KES).
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    }).format(amount)
}

// Helper function to format a date as Day/Month/Year.
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
    }).format(new Date(date))
}

// Helper function to translate the marital status.
const getMaritalStatus = () => {
    switch (employee.maritalStatus) {
    case 'SINGLE': return 'Single'
    case 'MARRIED': return 'Married'
    case 'DIVORCED': return 'Divorced'
    case 'WIDOWED': return 'Widowed'
    default: return employee.maritalStatus
    }
}

const today = new Date();

// Return the full HTML string using a template literal.
return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salary Certificate - ${employee.firstName} ${employee.lastName}</title>
    <style>
        @page {
        size: A4;
        margin: 2cm;
        }
        
        body {
        font-family: 'Times New Roman', serif;
        margin: 0;
        padding: 0;
        background-color: white;
        font-size: 12pt;
        line-height: 1.4;
        color: #000;
        }
        
        .certificate-container {
        width: 21cm;
        height: 29.7cm;
        margin: 0 auto;
        padding: 1cm;
        background: white;
        box-sizing: border-box;
        position: relative;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .underline { text-decoration: underline; }
        
        .header {
        margin-bottom: 0.8cm;
        height: 1.5cm;
        }
        
        .logo {
        float: left;
        max-width: 2cm;
        height: auto;
        }
        
        .company-info {
        text-align: right;
        margin-top: 0.2cm;
        font-size: 10pt;
        }
        
        .document-title {
        clear: both;
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
        text-transform: uppercase;
        margin: 0.6cm 0 0.6cm 0;
        text-decoration: underline;
        }
        
        .content {
        text-align: justify;
        margin-bottom: 0.5cm;
        }
        
        .content p {
        margin: 0.3cm 0;
        }
        
        .employee-details {
        margin: 0.5cm 0;
        padding: 0.4cm;
        border: 1px solid #000;
        }
        
        .detail-line {
        margin: 0.1cm 0;
        display: flex;
        }
        
        .detail-label {
        width: 4.5cm;
        font-weight: bold;
        font-size: 11pt;
        }
        
        .detail-value {
        flex: 1;
        font-size: 11pt;
        }
        
        .signature-section {
        margin-top: 0.8cm;
        display: flex;
        justify-content: space-between;
        }
        
        .signature-block {
        width: 5cm;
        text-align: center;
        }
        
        .signature-line {
        border-bottom: 1px solid #000;
        height: 1cm;
        margin: 0.5cm 0 0.2cm 0;
        }
        
        .footer {
        position: absolute;
        bottom: 0.3cm;
        left: 1cm;
        right: 1cm;
        text-align: center;
        font-size: 8pt;
        border-top: 1px solid #000;
        padding-top: 0.2cm;
        }
        
        @media print {
        body { 
            margin: 0;
            padding: 0;
        }
        .certificate-container {
            width: 100%;
            min-height: 100vh;
            margin: 0;
            padding: 2cm;
        }
        }
        
        @media screen {
        body {
            background: #f0f0f0;
            padding: 1cm;
        }
        .certificate-container {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        }
    </style>
    </head>
    <body>
    <div class="certificate-container">
        <div class="header">
        <img src="/image001.png" alt="Company Logo" class="logo" />
        <div class="company-info">
            <strong>AD CAPITAL</strong><br>
            Management Company<br>
            Nairobi, Kenya
        </div>
        </div>

        <h1 class="document-title">Salary Certificate</h1>

        <div class="content">
        <p>I, the undersigned, Director of Human Resources of the company AD CAPITAL,</p>
        
        <p><strong>Hereby certify that:</strong></p>

        <div class="employee-details">
            <div class="detail-line">
            <span class="detail-label">Full Name:</span>
            <span class="detail-value"><strong>${employee.firstName} ${employee.lastName}</strong></span>
            </div>
            <div class="detail-line">
            <span class="detail-label">Employee ID:</span>
            <span class="detail-value">${employee.employeeId}</span>
            </div>
            <div class="detail-line">
            <span class="detail-label">ID Number:</span>
            <span class="detail-value">${employee.idNumber || 'Not provided'}</span>
            </div>
            <div class="detail-line">
            <span class="detail-label">Position:</span>
            <span class="detail-value">${employee.position}</span>
            </div>
            <div class="detail-line">
            <span class="detail-label">Date of Hire:</span>
            <span class="detail-value">${formatDate(employee.hireDate)}</span>
            </div>
            <div class="detail-line">
            <span class="detail-label">Seniority:</span>
            <span class="detail-value">${employee.seniority} years</span>
            </div>
            <div class="detail-line">
            <span class="detail-label">Marital Status:</span>
            <span class="detail-value">${getMaritalStatus()}</span>
            </div>
            <div class="detail-line">
            <span class="detail-label">Base Salary:</span>
            <span class="detail-value"><strong>${formatCurrency(employee.baseSalary)}</strong></span>
            </div>
            ${employee.transportAllowance > 0 ? `
            <div class="detail-line">
            <span class="detail-label">Transport Allowance:</span>
            <span class="detail-value">${formatCurrency(employee.transportAllowance)}</span>
            </div>
            ` : ''}
            ${employee.representationAllowance > 0 ? `
            <div class="detail-line">
            <span class="detail-label">Representation Allowance:</span>
            <span class="detail-value">${formatCurrency(employee.representationAllowance)}</span>
            </div>
            ` : ''}
            ${employee.housingAllowance > 0 ? `
            <div class="detail-line">
            <span class="detail-label">Housing Allowance:</span>
            <span class="detail-value">${formatCurrency(employee.housingAllowance)}</span>
            </div>
            ` : ''}
            <div class="detail-line">
            <span class="detail-label">NSSF Number:</span>
            <span class="detail-value">${employee.nssfNumber || 'Not provided'}</span>
            </div>
        </div>

        <p>Is employed in our company as a <strong>${employee.position}</strong> since <strong>${formatDate(employee.hireDate)}</strong>.</p>

        <p>Their base salary amounts to <strong>${formatCurrency(employee.baseSalary)}</strong>${employee.transportAllowance > 0 || employee.representationAllowance > 0 || employee.housingAllowance > 0 ? ', to which are added the allowances mentioned above' : ''}.</p>

        <p>The employee is registered with the National Social Security Fund under the number <strong>${employee.nssfNumber || '[TO BE COMPLETED]'}</strong>.</p>

        <p>This certificate is issued to the employee to serve whatever purpose it may legally serve.</p>

        <div class="text-right">
            <p><strong>Done at Nairobi, on ${formatDate(today)}</strong></p>
        </div>
        </div>

        <div class="signature-section">
        <div class="signature-block">
            <p><strong>The Employee</strong></p>
            <div class="signature-line"></div>
            <p>${employee.firstName} ${employee.lastName}</p>
        </div>
        
        <div class="signature-block">
            <p><strong>The HR Director</strong></p>
            <div class="signature-line"></div>
            <p>AD CAPITAL</p>
        </div>
        </div>

        <div class="footer">
        <p>AD CAPITAL - Management Company | Nairobi, Kenya</p>
        </div>
    </div>
    </body>
    </html>
`;
}