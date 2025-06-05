// ...existing code...

document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...

    // Add event listeners for input changes to recalculate costs
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', calculateCosts);
    });

    // Add Item functionality
    window.addItem = function(containerId) {
        const container = document.getElementById(containerId);
        const itemId = Date.now(); // Unique ID for the item
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'add-on-item';
        itemDiv.id = `item-${itemId}`;
        
        itemDiv.innerHTML = `
            <div class="input-group">
                <label>Item</label>
                <input type="text" class="add-on-name" placeholder="Item name">
            </div>
            <div class="input-group">
                <label>Qty</label>
                <input type="number" class="add-on-qty" min="1" value="1">
            </div>
            <div class="input-group">
                <label>Cost (RM)</label>
                <input type="number" class="add-on-cost" min="0" value="0">
            </div>
            <button class="delete-btn" onclick="deleteItem('${itemId}')">Delete</button>
        `;
        
        container.appendChild(itemDiv);
        
        // Add event listeners to new inputs
        itemDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', calculateCosts);
        });
        
        calculateCosts();
    };
    
    // Delete Item functionality
    window.deleteItem = function(itemId) {
        const itemElement = document.getElementById(`item-${itemId}`);
        if (itemElement) {
            itemElement.remove();
            calculateCosts();
        }
    };

    // Function to calculate costs
    function calculateCosts() {
        // ... existing calculation code ...
        
        // Calculate studio room cost
        const studioRoomHours = parseFloat(document.getElementById('studioRoomHours').value) || 0;
        const studioRoomRate = parseFloat(document.getElementById('studioRoomRate').value) || 0;
        const studioRoomCost = studioRoomHours * studioRoomRate;
        document.getElementById('studioRoomCost').textContent = studioRoomCost.toFixed(2);
        
        // Similar calculations for other sections...
        const studioSessionHours = parseFloat(document.getElementById('studioSessionHours').value) || 0;
        const studioSessionRate = parseFloat(document.getElementById('studioSessionRate').value) || 0;
        const studioSessionCost = studioSessionHours * studioSessionRate;
        document.getElementById('studioSessionCost').textContent = studioSessionCost.toFixed(2);
        
        const recordingEquipmentHours = parseFloat(document.getElementById('recordingEquipmentHours').value) || 0;
        const recordingEquipmentRate = parseFloat(document.getElementById('recordingEquipmentRate').value) || 0;
        const recordingEquipmentCost = recordingEquipmentHours * recordingEquipmentRate;
        document.getElementById('recordingEquipmentCost').textContent = recordingEquipmentCost.toFixed(2);
        
        const liveStreamingEquipmentHours = parseFloat(document.getElementById('liveStreamingEquipmentHours').value) || 0;
        const liveStreamingEquipmentRate = parseFloat(document.getElementById('liveStreamingEquipmentRate').value) || 0;
        const liveStreamingEquipmentCost = liveStreamingEquipmentHours * liveStreamingEquipmentRate;
        document.getElementById('liveStreamingEquipmentCost').textContent = liveStreamingEquipmentCost.toFixed(2);
        
        const postProductionHours = parseFloat(document.getElementById('postProductionHours').value) || 0;
        const postProductionRate = parseFloat(document.getElementById('postProductionRate').value) || 0;
        const postProductionCost = postProductionHours * postProductionRate;
        document.getElementById('postProductionCost').textContent = postProductionCost.toFixed(2);
        
        // Calculate add-on costs for each section
        const calculateAddOnCosts = (containerId) => {
            let totalAddOnCost = 0;
            const addOnItems = document.getElementById(containerId).querySelectorAll('.add-on-item');
            
            addOnItems.forEach(item => {
                const qty = parseFloat(item.querySelector('.add-on-qty').value) || 0;
                const cost = parseFloat(item.querySelector('.add-on-cost').value) || 0;
                totalAddOnCost += qty * cost;
            });
            
            return totalAddOnCost;
        };
        
        const studioRoomAddOnsCost = calculateAddOnCosts('studioRoomAddOns');
        const studioSessionAddOnsCost = calculateAddOnCosts('studioSessionAddOns');
        const recordingEquipmentAddOnsCost = calculateAddOnCosts('recordingEquipmentAddOns');
        const liveStreamingEquipmentAddOnsCost = calculateAddOnCosts('liveStreamingEquipmentAddOns');
        const postProductionAddOnsCost = calculateAddOnCosts('postProductionAddOns');
        const commissionAddOnsCost = calculateAddOnCosts('commissionAddOns');
        
        // Calculate commission
        const subtotal = studioRoomCost + studioSessionCost + recordingEquipmentCost + 
                         liveStreamingEquipmentCost + postProductionCost + 
                         studioRoomAddOnsCost + studioSessionAddOnsCost + 
                         recordingEquipmentAddOnsCost + liveStreamingEquipmentAddOnsCost + 
                         postProductionAddOnsCost;
        
        const commissionRate = parseFloat(document.getElementById('commissionRate').value) || 0;
        const commissionCost = subtotal * commissionRate;
        document.getElementById('commissionCost').textContent = commissionCost.toFixed(2);
        
        // Calculate total cost
        const totalCost = subtotal + commissionCost + commissionAddOnsCost;
        document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    }

    // Function to generate PDF
    function generatePDF() {
        // ... existing PDF generation code ...
        
        // Create content for the PDF
        let content = [
            { text: 'Services & Studio Room Quotation', style: 'header' },
            { text: '\n' },
            { text: 'Studio Room Package', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['Description', 'Hours/Qty', 'Cost (RM)'],
                        ['Studio Room', document.getElementById('studioRoomHours').value, document.getElementById('studioRoomCost').textContent]
                    ]
                }
            }
        ];
        
        // Add Studio Room Add-on items to PDF
        addAddOnsToPdfContent(content, 'studioRoomAddOns');
        
        // Add other sections similarly
        content.push(
            { text: '\n' },
            { text: 'Studio Room Session', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['Description', 'Hours/Qty', 'Cost (RM)'],
                        ['Studio Session', document.getElementById('studioSessionHours').value, document.getElementById('studioSessionCost').textContent]
                    ]
                }
            }
        );
        addAddOnsToPdfContent(content, 'studioSessionAddOns');
        
        content.push(
            { text: '\n' },
            { text: 'Recording Equipment', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['Description', 'Hours/Qty', 'Cost (RM)'],
                        ['Recording Equipment', document.getElementById('recordingEquipmentHours').value, document.getElementById('recordingEquipmentCost').textContent]
                    ]
                }
            }
        );
        addAddOnsToPdfContent(content, 'recordingEquipmentAddOns');
        
        content.push(
            { text: '\n' },
            { text: 'Live Streaming Equipment', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['Description', 'Hours/Qty', 'Cost (RM)'],
                        ['Live Streaming Equipment', document.getElementById('liveStreamingEquipmentHours').value, document.getElementById('liveStreamingEquipmentCost').textContent]
                    ]
                }
            }
        );
        addAddOnsToPdfContent(content, 'liveStreamingEquipmentAddOns');
        
        content.push(
            { text: '\n' },
            { text: 'Post-Production', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['Description', 'Hours/Qty', 'Cost (RM)'],
                        ['Post-Production', document.getElementById('postProductionHours').value, document.getElementById('postProductionCost').textContent]
                    ]
                }
            }
        );
        addAddOnsToPdfContent(content, 'postProductionAddOns');
        
        content.push(
            { text: '\n' },
            { text: 'Commission', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: [
                        ['Description', 'Rate', 'Cost (RM)'],
                        ['Commission', document.getElementById('commissionRate').value, document.getElementById('commissionCost').textContent]
                    ]
                }
            }
        );
        addAddOnsToPdfContent(content, 'commissionAddOns');
        
        // Add total cost
        content.push(
            { text: '\n' },
            { text: 'Total Cost', style: 'sectionHeader' },
            {
                table: {
                    widths: ['*', 'auto'],
                    body: [
                        ['Description', 'Cost (RM)'],
                        ['Total', document.getElementById('totalCost').textContent]
                    ]
                }
            }
        );

        // Generate and open the PDF
        pdfMake.createPdf({
            content: content,
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center'
                },
                sectionHeader: {
                    fontSize: 14,
                    bold: true
                }
            }
        }).open();
    }
    
    // Function to add add-on items to PDF content
    function addAddOnsToPdfContent(content, containerId) {
        const addOnItems = document.getElementById(containerId).querySelectorAll('.add-on-item');
        
        if (addOnItems.length > 0) {
            // Create a table for add-on items
            const tableBody = [['Item', 'Qty', 'Cost (RM)']];
            
            addOnItems.forEach(item => {
                const itemName = item.querySelector('.add-on-name').value || 'Unknown Item';
                const qty = item.querySelector('.add-on-qty').value || '0';
                const costInput = item.querySelector('.add-on-cost').value || '0';
                const totalCost = (parseFloat(qty) * parseFloat(costInput)).toFixed(2);
                
                tableBody.push([itemName, qty, totalCost]);
            });
            
            content.push({
                table: {
                    widths: ['*', 'auto', 'auto'],
                    body: tableBody
                }
            });
        }
    }

    // Event listeners for buttons
    document.getElementById('calculate').addEventListener('click', calculateCosts);
    document.getElementById('reset').addEventListener('click', resetForm);
    document.getElementById('generatePdf').addEventListener('click', generatePDF);

    // Initialize
    calculateCosts();
});

function resetForm() {
    // Reset all input fields to default values
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.value = 0;
    });
    
    // Reset any select elements to their first option
    document.querySelectorAll('select').forEach(select => {
        if (select.options.length) {
            select.selectedIndex = 0;
        }
    });
    
    // Remove all add-on items
    document.querySelectorAll('[id$="AddOns"]').forEach(container => {
        container.innerHTML = '';
    });
    
    // Recalculate costs
    calculateCosts();
}
