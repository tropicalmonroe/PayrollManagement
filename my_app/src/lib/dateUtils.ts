export function getCurrentMonthYear() {
const now = new Date();
const currentMonth = now.toLocaleString('en-GB', { month: 'long' });
const currentYear = now.getFullYear();
return { currentMonth, currentYear };
}
