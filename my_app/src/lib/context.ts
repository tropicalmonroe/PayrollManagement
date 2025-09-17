// lib/context.ts
export const ITEM_PER_PAGE = 8;

type RouteAccessMap = {
[key: string]: string[];
};

export const RouteAccessMap: RouteAccessMap = {
'/dashboard': ['ADMIN', 'USER', 'VIEWER'],
'/dashboard/admin': ['ADMIN'],
'/dashboard/invoices': ['ADMIN'],
'/dashboard/transactions': ['ADMIN'],
'/employee-files': ['ADMIN', 'USER'],
'/employee-files/employee-record': ['ADMIN', 'USER'],
'/employee-files/salary-advances': ['ADMIN', 'USER'],
'/employee-files/consultation': ['ADMIN', 'USER'],
'/payroll-calculation': ['ADMIN'],
'/payroll-calculation/monthly-variables': ['ADMIN'],
'/payroll-calculation/monthly-calculation': ['ADMIN'],
'/employee-documents': ['ADMIN', 'USER'],
'/employee-documents/payslip': ['ADMIN', 'USER'],
'/employee-documents/salary-certificate': ['ADMIN', 'USER'],
'/employee-documents/final-settlement': ['ADMIN', 'USER'],
'/administrative-reports': ['ADMIN', 'VIEWER'],
'/administrative-reports/payroll-journal': ['ADMIN', 'VIEWER'],
'/administrative-reports/bank-transfer': ['ADMIN'],
'/administrative-reports/nssf-declaration': ['ADMIN', 'VIEWER'],
'/administrative-reports/paye-tax-statement': ['ADMIN', 'VIEWER'],
'/archive': ['ADMIN', 'VIEWER'],
'/archive/payslips': ['ADMIN', 'USER', 'VIEWER'],
'/archive/certificates': ['ADMIN', 'USER', 'VIEWER'],
'/archive/nssf-declarations': ['ADMIN', 'VIEWER'],
'/archive/paye-statements': ['ADMIN', 'VIEWER'],
'/archive/payroll-journals': ['ADMIN', 'VIEWER'],
'/archive/final-settlements': ['ADMIN', 'USER', 'VIEWER'],
'/simulation': ['ADMIN', 'VIEWER'],
'/simulation/salary-simulation': ['ADMIN', 'VIEWER'],
'/simulation/family-tax-impact': ['ADMIN', 'VIEWER'],
'/simulation/regularization-recall': ['ADMIN', 'VIEWER'],
'/simulation/housing-loan': ['ADMIN', 'VIEWER'],
'/application-settings': ['ADMIN'],
'/application-settings/social-tax-scales': ['ADMIN'],
'/application-settings/thresholds-reductions': ['ADMIN'],
'/application-settings/housing-loan': ['ADMIN'],
'/profile': ['ADMIN', 'USER', 'VIEWER'],
};