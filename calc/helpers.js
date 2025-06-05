// Helper functions for currency handling
function parseCurrency(value) {
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
    }
    return parseFloat(value) || 0;
}

function formatCurrency(value) {
    return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}