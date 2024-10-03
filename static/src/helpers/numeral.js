/** @odoo-module **/

const arabicNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const farsiNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function convertFarsiNumbersToArabic(inputString) {
    if(typeof inputString !== 'string') inputString = inputString.toString()
    return inputString.replace(/[۰-۹]/g, (match) => {
        const farsiIndex = farsiNumbers.indexOf(match);
        return farsiIndex !== -1 ? arabicNumbers[farsiIndex] : match;
    });
}

export function convertArabicNumbersToFarsi(inputString) {
    if(typeof inputString !== 'string') inputString = inputString.toString()
    return inputString.replace(/[0-9]/g, (match) => {
        const arabicIndex = arabicNumbers.indexOf(match);
        return arabicIndex !== -1 ? farsiNumbers[arabicIndex] : match;
    });
}
