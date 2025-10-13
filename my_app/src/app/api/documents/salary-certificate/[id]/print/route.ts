import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function GET(
request: NextRequest,
{ params }: { params: { id: string } }
) {
try {
    const { id } = await params;

    const document = await prisma.document.findUnique({
    where: { id },
    include: { employee: true },
    });

    if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Generate HTML with print-specific styles
    const html = generateSalaryCertificateHTML(document, true);

    return new NextResponse(html, {
    status: 200,
    headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline' 
    },
    });
} catch (error) {
    console.error('Error generating salary certificate print view:', error);
    return NextResponse.json({ error: 'Error while generating the certificate' }, { status: 500 });
}
}

// Enhanced HTML generator with print optimization
function generateSalaryCertificateHTML(document: any, forPrint: boolean = false) {
const employee = document.employee;
const metadata = document.metadata as any;

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    }).format(amount);

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    }).format(new Date(date));

const getMaritalStatus = () => {
    switch (employee.maritalStatus) {
    case 'SINGLE': return 'Single';
    case 'MARRIED': return 'Married';
    case 'DIVORCED': return 'Divorced';
    case 'WIDOWED': return 'Widowed';
    default: return employee.maritalStatus;
    }
};

const today = new Date();

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
        margin: 1.5cm;
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
        min-height: 29.7cm;
        margin: 0 auto;
        padding: 1.5cm;
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
        margin-bottom: 1cm;
        border-bottom: 2px solid #000;
        padding-bottom: 0.5cm;
        }
        
        .logo {
        float: left;
        max-width: 2.2cm;
        height: auto;
        }
        
        .company-info {
        text-align: right;
        margin-top: 0;
        font-size: 11pt;
        }
        
        .document-title {
        clear: both;
        text-align: center;
        font-size: 16pt;
        font-weight: bold;
        text-transform: uppercase;
        margin: 1cm 0;
        text-decoration: underline;
        }
        
        .content {
        text-align: justify;
        margin-bottom: 1cm;
        font-size: 11pt;
        }
        
        .content p {
        margin: 0.4cm 0;
        }
        
        .employee-details {
        margin: 0.8cm 0;
        padding: 0.6cm;
        border: 2px solid #000;
        background: #f9f9f9;
        }
        
        .detail-line {
        margin: 0.2cm 0;
        display: flex;
        page-break-inside: avoid;
        }
        
        .detail-label {
        width: 5cm;
        font-weight: bold;
        font-size: 11pt;
        }
        
        .detail-value {
        flex: 1;
        font-size: 11pt;
        }
        
        .signature-section {
        margin-top: 2cm;
        display: flex;
        justify-content: space-between;
        page-break-inside: avoid;
        }
        
        .signature-block {
        width: 6cm;
        text-align: center;
        }
        
        .signature-line {
        border-bottom: 1px solid #000;
        height: 1cm;
        margin: 0.8cm 0 0.3cm 0;
        }
        
        .footer {
        position: absolute;
        bottom: 0.5cm;
        left: 1.5cm;
        right: 1.5cm;
        text-align: center;
        font-size: 9pt;
        border-top: 1px solid #000;
        padding-top: 0.3cm;
        }
        
        /* Print-specific styles */
        @media print {
        body { 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .certificate-container {
            width: 100%;
            min-height: 100vh;
            margin: 0;
            padding: 1.5cm;
            box-shadow: none;
        }
        .employee-details {
            background: #f9f9f9 !important;
        }
        }
        
        /* Screen styles */
        @media screen {
        body {
            background: #f0f0f0;
            padding: 1cm;
        }
        .certificate-container {
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        }
        
        /* No-print elements for screen */
        .no-print {
        display: none;
        }
    </style>
    </head>
    <body>
    <div class="certificate-container">
        <!-- Print button for screen view -->
        <div class="no-print" style="text-align: center; margin-bottom: 1cm;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Print Certificate
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Close Window
        </button>
        </div>

        <div class="header">
        <img src="/logosch.png" alt="Company Logo" class="logo" />
        <div class="company-info">
            <strong>NewLight Academy</strong><br>
            Finance Department<br>
            Nairobi, Kenya
        </div>
        </div>

        <h1 class="document-title">Salary Certificate</h1>

        <div class="content">
        <p>I, the undersigned, Director of Human Resources of the company NewLight Academy,</p>
        
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
            <p>NewLight Academy</p>
        </div>
        </div>

        <div class="footer">
        <p>NewLight Academy - Finance Department | Nairobi, Kenya</p>
        </div>
    </div>

    <script>
        // Auto-print when page loads (for print route)
        ${forPrint ? `
        window.addEventListener('load', function() {
        setTimeout(function() {
            window.print();
        }, 1000);
        });
        
        // Close window after print
        window.onafterprint = function() {
        setTimeout(function() {
            window.close();
        }, 500);
        };
        ` : ''}
    </script>
    </body>
    </html>
`;
}